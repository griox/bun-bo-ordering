import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue: { resolve: (value: string | null) => void; reject: (reason?: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Interceptor cho Request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
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
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return axiosInstance(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = useAuthStore.getState().refreshToken;
            const accessToken = useAuthStore.getState().token;

            if (!refreshToken) {
                useAuthStore.getState().logout();
                return Promise.reject(error);
            }

            try {
                // Gọi API refresh token
                const response = await axios.post(`${axiosInstance.defaults.baseURL}/api/identity/refresh-token`, {
                    accessToken: accessToken,
                    refreshToken: refreshToken
                });

                const { token: newAccessToken, refreshToken: newRefreshToken, ...user } = response.data;
                
                // Lưu token mới vào store
                useAuthStore.getState().login(newAccessToken, newRefreshToken, user);
                
                axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
                originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;

                processQueue(null, newAccessToken);
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
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
