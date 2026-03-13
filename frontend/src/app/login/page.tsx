'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import axiosInstance from '@/lib/axiosInstance';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                // Login uses Email + Password
                const response = await axiosInstance.post('/api/identity/login', {
                    email,
                    password,
                });

                const { token, userId, username: resUsername, email: resEmail, role } = response.data;
                login(token, { userId, username: resUsername, email: resEmail, role });
                toast.success(`Chào mừng, ${resUsername}!`);
                
                if (role === 'Admin') {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
            } else {
                // Register uses Username + Email + Password
                await axiosInstance.post('/api/identity/register', {
                    username,
                    email,
                    password,
                });
                toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
                setIsLogin(true);
            }
        } catch (err: any) {
            toast.error(err.response?.data || err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const response = await axiosInstance.post('/api/identity/google-login', {
                    accessToken: tokenResponse.access_token,
                });

                const { token, userId, username: resUsername, email: resEmail, role } = response.data;
                login(token, { userId, username: resUsername, email: resEmail, role });
                toast.success(`Chào mừng, ${resUsername}!`);
                
                if (role === 'Admin') {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
            } catch (err: any) {
                toast.error(err.response?.data || 'Đăng nhập Google thất bại!');
            }
        },
        onError: () => {
            toast.error('Đăng nhập Google thất bại. Vui lòng thử lại!');
        },
    });

    return (
        <main className="min-h-[80vh] flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md bg-paper p-8 rounded-lg border-4 border-text shadow-[8px_8px_0px_#2D2D2D]">

                {/* Header Tabs */}
                <div className="flex mb-8 border-b-2 border-text/20">
                    <button
                        className={`flex-1 py-3 font-display text-xl transition-all ${isLogin ? 'text-primary border-b-4 border-primary' : 'text-text/50 hover:text-text'}`}
                        onClick={() => setIsLogin(true)}
                    >
                        ĐĂNG NHẬP
                    </button>
                    <button
                        className={`flex-1 py-3 font-display text-xl transition-all ${!isLogin ? 'text-primary border-b-4 border-primary' : 'text-text/50 hover:text-text'}`}
                        onClick={() => setIsLogin(false)}
                    >
                        ĐĂNG KÝ
                    </button>
                </div>

                {/* Google Login */}
                <button
                    onClick={() => handleGoogleLogin()}
                    className="w-full mb-6 flex items-center justify-center gap-3 bg-white text-black font-main font-bold py-3 px-4 rounded border-2 border-text shadow-[2px_2px_0px_#2D2D2D] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#2D2D2D] transition-all"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    Tiếp tục với Google
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-text/20"></div>
                    <span className="font-display text-sm text-text/50">HOẶC</span>
                    <div className="flex-1 h-px bg-text/20"></div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block font-display text-sm mb-2">TÊN ĐĂNG NHẬP</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full bg-white border-2 border-text p-3 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 font-main"
                                placeholder="Tên hiển thị của bạn..."
                            />
                        </div>
                    )}

                    <div>
                        <label className="block font-display text-sm mb-2">GMAIL</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-white border-2 border-text p-3 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 font-main"
                            placeholder="example@gmail.com"
                        />
                    </div>

                    <div>
                        <label className="block font-display text-sm mb-2">MẬT KHẨU</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-white border-2 border-text p-3 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 font-main"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white font-display text-xl py-4 rounded border-2 border-text shadow-[4px_4px_0px_#2D2D2D] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2D2D2D] transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'ĐANG XỬ LÝ...' : isLogin ? 'ĐĂNG NHẬP NGAY' : 'TẠO TÀI KHOẢN'}
                    </button>
                </form>

            </div>
        </main>
    );
}
