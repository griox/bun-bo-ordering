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
                    <div className="flex flex-col md:flex-row md:items-baseline md:gap-2">
                        <span className="font-display text-lg md:text-xl text-paper leading-none">BÚN BÒ</span>
                        <span className="font-display text-[10px] md:text-sm text-secondary leading-none">& CÀ PHÊ PHỐ</span>
                    </div>

                    {mounted && session && table && (
                        <div className="ml-4 flex items-center gap-2 bg-secondary/10 text-secondary border-2 border-secondary/30 px-3 py-1 rounded-lg">
                            <Coffee size={14} className="animate-pulse" />
                            <span className="text-[10px] font-bold tracking-tighter">BÀN: {table.tableCode || table.name}</span>
                        </div>
                    )}
                </Link>

                {/* Navigation & Member CTA (Both Desktop & Mobile) */}
                <div className="flex items-center gap-4">
                    {/* Navigation (Desktop Only) */}
                    <nav className="hidden md:flex items-center font-bold gap-8 mr-4">
                        {menuItems.map((link) => (
                            <Link
                                key={link.path}
                                href={link.path}
                                id={link.path === '/' ? 'nav-home' : link.path === '/menu' ? 'nav-menu' : link.path === '/#story' ? 'nav-about' : undefined}
                                className={`font-display text-sm tracking-wider transition-colors hover:text-primary ${isActive(link.path) ? 'text-primary border-b-2 border-none' : 'text-text/80'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Member Section (Visible on both) */}
                    <div className="z-50">
                        {mounted && user ? (
                            <div className="relative group cursor-pointer">
                                <div id="nav-member" className="flex items-center gap-2 bg-primary text-white font-display text-xs md:text-sm px-3 md:px-4 py-2 rounded-full border-2 border-text shadow-[2px_2px_0px_#2D2D2D] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#2D2D2D] transition-all">
                                    <User size={14} className="md:w-4 md:h-4" />
                                    <span>{(user.username ?? 'THÀNH VIÊN').toUpperCase()}</span>
                                </div>

                                <div className="absolute top-full right-0 mt-2 w-48 bg-paper border-2 border-text rounded-xl shadow-[4px_4px_0px_#2D2D2D] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden">
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
                                <DialogTrigger id="nav-member" render={
                                    <button className="flex items-center gap-2 bg-primary text-white font-display text-xs md:text-sm px-4 md:px-6 py-2.5 md:py-3 rounded-full border-2 border-text shadow-[3px_3px_0px_#2D2D2D] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0px_#2D2D2D] transition-all active:scale-95" />
                                }>
                                    <User size={16} />
                                    <span>THÀNH VIÊN</span>
                                </DialogTrigger>
                                <DialogContent className="w-[92vw] max-w-lg bg-background border-4 border-text p-0 overflow-hidden shadow-[10px_10px_0px_rgba(0,0,0,0.15)] rounded-[2.5rem]">
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/parchment.png')" }}>
                                    </div>
                                    <div className="relative p-6 md:p-10 overflow-y-auto max-h-[85vh]">
                                        <LoginForm onSuccess={() => setIsLoginOpen(false)} />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    {/* Mobile Menu Button - Optional, keeping hidden as requested for now */}
                    {/* <button
                        onClick={toggleMenu}
                        className="md:hidden text-paper p-2"
                    >
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button> */}
                </div>

            </div>
        </header>
    );
}
