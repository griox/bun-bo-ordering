'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, User } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import { LoginForm } from '@/components/login-form';
import { useOrderStore } from '@/store/useOrderStore';
import { Badge } from '@/components/ui/badge';
import { Coffee } from 'lucide-react';

export function Header() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const isActive = (path: string) => pathname === path;
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    // Xử lý Hydration mismatch với local storage state của Zustand
    const [mounted, setMounted] = useState(false);
    const { user, logout } = useAuthStore();
    const { table, session } = useOrderStore();

    useEffect(() => {
        setMounted(true);
    }, []);

    const menuItems = [
        { name: 'TRANG CHỦ', path: '/' },
        { name: 'THỰC ĐƠN', path: '/menu' },
        { name: 'VỀ CHÚNG TÔI', path: '/#story' },
    ];

    return (
        <header className="bg-background/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4 h-24 flex items-center justify-between">

                {/* Brand Logo */}
                <Link href="/" className="flex items-center gap-2 group z-50 relative">
                    <div className="w-24 h-24 relative group-hover:rotate-12 transition-transform shrink-0">
                        <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-display text-lg text-paper leading-none">BÚN BÒ</span>
                        <span className="font-display text-xs text-secondary leading-none">& CÀ PHÊ PHỐ</span>
                    </div>

                    {mounted && session && table && (
                        <div className="ml-4 flex items-center gap-2 bg-secondary/10 text-secondary border-2 border-secondary/30 px-3 py-1 rounded-lg">
                            <Coffee size={14} className="animate-pulse" />
                            <span className="text-[10px] font-bold tracking-tighter">BÀN: {table.tableCode || table.name}</span>
                        </div>
                    )}
                </Link>

                {/* Navigation (Desktop) */}
                <nav className="hidden md:flex items-center font-bold gap-8">
                    {menuItems.map((link) => (
                        <Link
                            key={link.path}
                            href={link.path}
                            className={`font-display text-sm tracking-wider transition-colors hover:text-primary ${isActive(link.path) ? 'text-primary border-b-2 border-none' : 'text-text/80'}`}
                        >
                            {link.name}
                        </Link>
                    ))}

                    {/* Member CTA Button */}
                    {mounted && user ? (
                        <div className="relative group cursor-pointer">
                            <div className="flex items-center gap-2 bg-primary text-white font-display text-sm px-4 py-2 rounded-full border-2 border-text shadow-[2px_2px_0px_#2D2D2D] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#2D2D2D] transition-all">
                                <User size={16} />
                                <span>{(user.username ?? 'THÀNH VIÊN').toUpperCase()}</span>
                            </div>
                            
                            {/* Dropdown Menu */}
                            <div className="absolute top-full right-0 mt-2 w-48 bg-paper border-2 border-text rounded-lg shadow-[4px_4px_0px_#2D2D2D] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden">
                                <button
                                    onClick={() => { logout(); toast.success('Đã đăng xuất!'); }}
                                    className="px-4 py-3 text-left font-display text-sm hover:bg-black/5 hover:text-red-600 transition-colors"
                                >
                                    ĐĂNG XUẤT
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                            <DialogTrigger render={<button className="flex items-center gap-2 bg-primary text-white font-display text-sm px-4 py-2 rounded-full border-2 border-text shadow-[2px_2px_0px_#2D2D2D] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#2D2D2D] transition-all" />}>
                                <User size={16} />
                                <span>THÀNH VIÊN</span>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg bg-background border-4 border-text p-0 overflow-hidden shadow-[10px_10px_0px_rgba(0,0,0,0.15)] rounded-[2rem]">
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                    style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/parchment.png')" }}>
                                </div>
                                <div className="relative p-6 md:p-10 overflow-y-auto max-h-[90vh]">
                                    <LoginForm onSuccess={() => setIsLoginOpen(false)} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMenu}
                    className="md:hidden text-paper z-50 relative p-2"
                >
                    {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
                </button>

                {/* Mobile Menu Overlay */}
                <div className={`fixed inset-0 bg-background/98 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-8 transition-all duration-300 md:hidden ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                    {menuItems.map((link) => (
                        <Link
                            key={link.path}
                            href={link.path}
                            onClick={() => setIsMenuOpen(false)}
                            className={`font-display text-3xl tracking-widest ${isActive(link.path) ? 'text-secondary' : 'text-paper'}`}
                        >
                            {link.name}
                        </Link>
                    ))}
                    {mounted && user ? (
                        <div className="flex flex-col items-center gap-4 mt-4">
                            <div className="flex items-center gap-2 bg-primary text-white font-display text-xl px-8 py-3 rounded-full border-2 border-text shadow-[4px_4px_0px_#2D2D2D]">
                                <User size={24} />
                                <span>{(user.username ?? 'THÀNH VIÊN').toUpperCase()}</span>
                            </div>
                            <button
                                onClick={() => { logout(); toast.success('Đã đăng xuất!'); setIsMenuOpen(false); }}
                                className="text-secondary font-display text-lg tracking-widest underline decoration-dashed transition-all hover:text-primary"
                            >
                                ĐĂNG XUẤT
                            </button>
                        </div>
                    ) : (
                        <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                            <DialogTrigger render={
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-2 bg-primary text-white font-display text-xl px-8 py-3 rounded-full border-2 border-text shadow-[4px_4px_0px_#2D2D2D] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2D2D2D] transition-all mt-4"
                                />
                            }>
                                <User size={24} />
                                <span>THÀNH VIÊN</span>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg bg-background border-4 border-text p-0 overflow-hidden shadow-[10px_10px_0px_rgba(0,0,0,0.15)] rounded-[2rem]">
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                    style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/parchment.png')" }}>
                                </div>
                                <div className="relative p-6 md:p-10 overflow-y-auto max-h-[90vh]">
                                    <LoginForm onSuccess={() => setIsLoginOpen(false)} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>
        </header>
    );
}
