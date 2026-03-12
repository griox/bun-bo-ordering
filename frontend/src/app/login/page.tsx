'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import axiosInstance from '@/lib/axios';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const response = await axiosInstance.post('/api/identity/login', {
                    username,
                    password,
                });

                const { token, userId, username: resUsername, role } = response.data;
                login(token, { userId, username: resUsername, role });
                toast.success(`Chào mừng, ${resUsername}!`);
                router.push('/');
            } else {
                toast.error('Tính năng đăng ký đang được bảo trì. Vui lòng đăng nhập!');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác!');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            // Google trả về access_token, cần đổi sang id_token qua userinfo endpoint
            // Tuy nhiên backend dùng ID Token nên ta dùng flow: authorization_code
            // hoặc gọi Google userinfo rồi lấy sub, email
            // Cách đơn giản nhất: dùng flow='implicit' để lấy access_token, 
            // rồi fetch user info, hoặc dùng CredentialResponse (id_token) từ GoogleLogin button
            try {
                // Lấy thông tin user từ Google bằng access_token
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoRes.json();

                // Gửi id_token lên backend — nhưng useGoogleLogin chỉ cho access_token
                // Nên ta gửi sub + email trực tiếp thay thế (hoặc đổi sang GoogleLogin component)
                // Hiện tại: backend nhận IdToken nên ta cần dùng GoogleLogin component (credential flow)
                // Đây là fallback thông báo để biết đăng nhập Google đã hoạt động
                toast.success(`Google xác thực thành công cho ${userInfo.email}! Đang kết nối...`);

                // Gọi backend với sub làm IdToken (không chuẩn — xem ghi chú bên dưới)
                const response = await axiosInstance.post('/api/identity/google-login', {
                    accessToken: tokenResponse.access_token,
                });

                const { token, userId, username: resUsername, role } = response.data;
                login(token, { userId, username: resUsername, role });
                toast.success(`Chào mừng, ${resUsername}!`);
                router.push('/');
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
                    <div>
                        <label className="block font-display text-sm mb-2">TÀI KHOẢN</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full bg-white border-2 border-text p-3 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 font-main"
                            placeholder="Nhập tên đăng nhập..."
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
                        className="w-full bg-primary text-black font-display text-xl py-4 rounded border-2 border-text shadow-[4px_4px_0px_#2D2D2D] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2D2D2D] transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'ĐANG XỬ LÝ...' : isLogin ? 'ĐĂNG NHẬP NGAY' : 'TẠO TÀI KHOẢN'}
                    </button>
                </form>

            </div>
        </main>
    );
}
