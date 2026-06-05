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
                // Gọi API refresh token. Proxy sẽ tự lấy refreshToken từ Cookie và gửi đi, 
                // sau đó tự set lại Cookie mới.
                await axios.post(`${axiosInstance.defaults.baseURL}/api/identity/refresh-token`);

                processQueue(null);
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
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
