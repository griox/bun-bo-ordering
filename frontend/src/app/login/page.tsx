import { LoginForm } from "@/components/login-form"
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng Nhập | Bún Bò Chung Cư',
  description: 'Đăng nhập vào hệ thống Bún Bò Chung Cư để đặt món, quản lý đơn hàng và nhận các ưu đãi hấp dẫn dành riêng cho thành viên.',
  openGraph: {
    title: 'Đăng Nhập | Bún Bò Chung Cư',
    description: 'Đăng nhập vào hệ thống Bún Bò Chung Cư để trải nghiệm đặt món tiện lợi.',
    url: 'https://bunbochungcu.com/login',
  },
};
export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center p-6 md:p-10 overflow-hidden bg-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "url('/images/parchment.png')" }}>
      </div>

      <div className="relative z-10 w-full max-w-lg bg-background border-4 border-text p-6 md:p-10 shadow-[10px_10px_0px_rgba(0,0,0,0.1)] rounded-[2rem]">
        <LoginForm />
      </div>

      {/* Decorative Blobs */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>
    </main>
  )
}
