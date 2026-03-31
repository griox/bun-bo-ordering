/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { User, Home, UtensilsCrossed, Building2, Settings, ScrollText, LogOut, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoginForm } from '@/components/login-form';
import { useOrderStore } from '@/store/useOrderStore';
import { CartModal } from '@/components/menu/CartModal';

export function Header() {
    const pathname = usePathname();
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const isActive = (path: string) => pathname === path;

    // Xử lý Hydration mismatch với local storage state của Zustand
    const [mounted, setMounted] = useState(false);
    const { user, logout } = useAuthStore();
    const { table, session } = useOrderStore();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
                                className={`font-display text-sm tracking-wider transition-colors hover:text-primary ${isActive(link.path) ? 'text-primary' : 'text-text/80'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Member Section */}
                    <div className="z-50 flex items-center">
                        {/* CartModal only for non-session (guest/browse) — session users use OrderBar */}
                        {!session && <CartModal />}

                        {/* Desktop Version */}
                        <div className="hidden md:block">
                            {mounted && user ? (
                                <div className="relative group cursor-pointer">
                                    <div id="nav-member-desktop" className="onboarding-member hidden md:flex items-center gap-2 bg-primary text-white font-display text-sm px-4 py-2 rounded-full border-2 border-text shadow-[2px_2px_0px_#2D2D2D] active:translate-y-px active:shadow-none transition-all">
                                        <User size={14} className="w-4 h-4" />
                                        <span>{(user.username ?? 'THÀNH VIÊN').toUpperCase()}</span>
                                    </div>

                                    <div className="absolute top-full right-0 mt-2 w-52 bg-white border-2 border-text rounded-xl shadow-[4px_4px_0px_#2D2D2D] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden font-display">
                                        {user.role === 'Admin' && (
                                            <Link
                                                href="/admin"
                                                className="px-4 py-3 text-left text-sm font-bold border-b-2 border-text/5 hover:bg-black/5 transition-colors"
                                            >
                                                TRANG QUẢN TRỊ
                                            </Link>
                                        )}
                                        {user.role === 'Customer' && (
                                            <Link
                                                href="/orders"
                                                className="px-4 py-3 text-left text-sm font-bold border-b-2 border-text/5 hover:bg-black/5 transition-colors"
                                            >
                                                LỊCH SỬ ĐƠN HÀNG
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => { logout(); toast.success('Đã đăng xuất!'); }}
                                            className="px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            ĐĂNG XUẤT
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                                    <DialogTrigger id="nav-member-desktop" nativeButton={false} render={
                                        <div className="onboarding-member hidden md:flex items-center gap-2 bg-primary text-white font-display text-sm px-6 py-3 rounded-full border-2 border-text shadow-[2px_2px_0px_#2D2D2D] active:translate-y-px active:shadow-none transition-all active:scale-95 cursor-pointer">
                                            <User size={16} />
                                            <span>THÀNH VIÊN</span>
                                        </div>
                                    } />
                                    <DialogContent className="w-[92vw] max-w-lg bg-background border-4 border-text p-0 overflow-hidden shadow-[10px_10px_0px_rgba(0,0,0,0.15)] rounded-[2.5rem]">
                                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                            style={{ backgroundImage: "url('/images/parchment.png')" }}>
                                        </div>
                                        <div className="relative p-10 overflow-y-auto max-h-[85vh]">
                                            <LoginForm onSuccess={() => setIsLoginOpen(false)} />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        {/* Mobile Version (Dropdown) */}
                        <div className="md:hidden">
                            <DropdownMenu>
                                <DropdownMenuTrigger nativeButton={false} render={
                                    <div
                                        id="nav-member-mobile"
                                        className="onboarding-member md:hidden flex flex-row items-center gap-2 bg-primary text-white font-display text-xs px-4 py-2.5 rounded-full border-2 border-text shadow-[2px_2px_0px_#2D2D2D] active:translate-y-px active:shadow-none transition-all cursor-pointer"
                                    >
                                        <User size={16} />
                                        <span>{mounted && user ? (user.username ?? 'THÀNH VIÊN').toUpperCase() : 'THÀNH VIÊN'}</span>
                                    </div>
                                } />
                                <DropdownMenuContent align="end" className="w-64 bg-white border-2 border-text rounded-xl shadow-[4px_4px_0px_#2D2D2D] p-2 mt-2 font-display">
                                    <DropdownMenuItem id="mobile-home" render={<Link href="/" className="w-full text-sm font-bold cursor-pointer px-4 py-3 hover:bg-black/5 rounded-lg transition-colors focus:bg-black/5" />}>
                                        <span className="flex items-center gap-2.5"><Home size={15} className="text-neutral-500" /> TRANG CHỦ</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem id="mobile-menu" render={<Link href="/menu" className="w-full text-sm font-bold cursor-pointer px-4 py-3 hover:bg-black/5 rounded-lg transition-colors focus:bg-black/5" />}>
                                        <span className="flex items-center gap-2.5"><UtensilsCrossed size={15} className="text-neutral-500" /> THỰC ĐƠN</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem id="mobile-about" render={<Link href="/#story" className="w-full text-sm font-bold cursor-pointer px-4 py-3 hover:bg-black/5 rounded-lg transition-colors focus:bg-black/5" />}>
                                        <span className="flex items-center gap-2.5"><Building2 size={15} className="text-neutral-500" /> VỀ CHÚNG TÔI</span>
                                    </DropdownMenuItem>

                                    {mounted && user && user.role === 'Admin' && (
                                        <DropdownMenuItem id="mobile-admin" render={<Link href="/admin" className="w-full text-sm font-bold bg-black/5 border-2 border-black/5 cursor-pointer px-4 py-3 hover:bg-black/10 rounded-lg transition-colors focus:bg-black/10" />}>
                                            <span className="flex items-center gap-2.5"><Settings size={15} className="text-neutral-500" /> QUẢN TRỊ VIÊN</span>
                                        </DropdownMenuItem>
                                    )}

                                    {mounted && user && user.role === 'Customer' && (
                                        <DropdownMenuItem id="mobile-history" render={<Link href="/orders" className="w-full text-sm font-bold bg-black/5 border-2 border-black/5 cursor-pointer px-4 py-3 hover:bg-black/10 rounded-lg transition-colors focus:bg-black/10" />}>
                                            <span className="flex items-center gap-2.5"><ScrollText size={15} className="text-neutral-500" /> LỊCH SỬ ĐƠN HÀNG</span>
                                        </DropdownMenuItem>
                                    )}

                                    <DropdownMenuSeparator className="bg-text/10 my-1" />

                                    {mounted && user ? (
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.preventDefault();
                                                logout();
                                                toast.success('Đã đăng xuất!');
                                            }}
                                            className="w-full text-sm font-bold text-red-600 focus:text-red-700 cursor-pointer px-4 py-3 hover:bg-red-50 rounded-lg transition-colors focus:bg-red-50"
                                        >
                                            <span className="flex items-center gap-2.5"><LogOut size={15} /> ĐĂNG XUẤT</span>
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setIsLoginOpen(true);
                                            }}
                                            className="w-full text-sm font-bold cursor-pointer px-4 py-3 hover:bg-black/5 rounded-lg transition-colors focus:bg-black/5"
                                        >
                                            <span className="flex items-center gap-2.5"><KeyRound size={15} className="text-neutral-500" /> ĐĂNG NHẬP</span>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Mobile Login Dialog rendered globally outside DropdownMenu */}
                            {!user && (
                                <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                                    <DialogContent className="w-[92vw] max-w-lg bg-background border-4 border-text p-0 overflow-hidden shadow-[10px_10px_0px_rgba(0,0,0,0.15)] rounded-[2.5rem]">
                                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                            style={{ backgroundImage: "url('/images/parchment.png')" }}>
                                        </div>
                                        <div className="relative p-6 overflow-y-auto max-h-[85vh]">
                                            <LoginForm onSuccess={() => setIsLoginOpen(false)} />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </header>
    );
}
