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

        // Bắt lỗi 400/401 nếu bản thân request đó là '/api/identity/refresh-token'
        if (originalRequest.url?.includes('/api/identity/refresh-token') && 
            (error.response?.status === 400 || error.response?.status === 401)) {
            
            processQueue(error);
            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
            
            // Xóa cookies HttpOnly thông qua proxy route
            try {
                await axios.post(`${axiosInstance.defaults.baseURL}/api/identity/logout`);
            } catch (e) {
                console.error("Failed to clear cookies on logout", e);
            }
            
            useAuthStore.getState().logout();
            isRefreshing = false;
            return Promise.reject(error);
        }

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
                // Gọi API refresh token. Proxy sẽ tự lấy refreshToken từ Cookie và gửi đi, 
                // sau đó tự set lại Cookie mới.
                await axios.post(`${axiosInstance.defaults.baseURL}/api/identity/refresh-token`);

                processQueue(null);
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Bất kỳ lỗi nào (như 400, 401, 500) từ refresh-token
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
