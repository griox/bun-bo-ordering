import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

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
    (error) => {
        if (error.response?.status === 401) {
            const hasToken = !!useAuthStore.getState().token;
            // Only show expired-session message and redirect if user had a token.
            // If there's no token, it's simply an anonymous/guest request — ignore silently.
            if (hasToken) {
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
                useAuthStore.getState().logout();
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;

