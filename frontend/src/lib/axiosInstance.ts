import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

const isClient = typeof window !== 'undefined';

const axiosInstance = axios.create({
    baseURL: isClient ? '/api/proxy' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'),
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue: { resolve: () => void; reject: (reason?: unknown) => void }[] = [];

const processQueue = (error: unknown) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

// Interceptor cho Request
axiosInstance.interceptors.request.use(
    (config) => {
        // Token is now handled by the Next.js Proxy via HttpOnly cookies
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor cho Response
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise<void>(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return axiosInstance(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Gọi API refresh token. Proxy sẽ tự lấy refreshToken từ Cookie và gửi đi.
                await axios.post(`${axiosInstance.defaults.baseURL}/api/identity/refresh-token`);

                processQueue(null);
                return axiosInstance(originalRequest);
            } catch (refreshError: any) {
                // Có thể lỗi 400/401 này là do Race Condition đa tab (một tab khác đã làm mới token thành công).
                // Thử gọi lại request gốc thêm 1 lần nữa để xem token mới (nếu có) đã hoạt động chưa.
                if ((refreshError.response?.status === 400 || refreshError.response?.status === 401) && !originalRequest._secondRetry) {
                    try {
                        originalRequest._secondRetry = true;
                        // Dùng axios global để tránh lặp vô hạn interceptor
                        const retryRes = await axios.request({
                            ...originalRequest,
                            baseURL: axiosInstance.defaults.baseURL
                        });
                        processQueue(null);
                        return retryRes;
                    } catch (secondErr) {
                        // Thực sự hết hạn
                    }
                }

                // Bất kỳ lỗi nào (như 400, 401, 500) từ refresh-token và retry thất bại
                processQueue(refreshError);
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
                
                try {
                    await axios.post(`${axiosInstance.defaults.baseURL}/api/identity/logout`);
                } catch (e) {
                    console.error("Failed to clear cookies on logout", e);
                }

                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
