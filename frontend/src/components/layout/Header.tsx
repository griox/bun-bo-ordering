'use client';

import Link from 'next/link';
import { usePathname as useNextPathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Home, UtensilsCrossed, Building2, Settings, ScrollText, LogOut, KeyRound, Star, BadgePercent, ChevronDown, Globe } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePromotions } from '@/hooks/usePromotions';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/axiosInstance';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
, DialogDescription } from "@/components/ui/dialog"
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
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';

export function Header() {
    const nextPathname = useNextPathname();
    const pathname = usePathname();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('LandingHeader');
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const isActive = (path: string) => nextPathname === path;

    const switchLocale = (nextLocale: string) => {
        if (nextLocale !== locale) {
            router.replace(pathname, { locale: nextLocale });
        }
    };

    // Xử lý Hydration mismatch với local storage state của Zustand
    const [mounted, setMounted] = useState(false);
    const { user, logout } = useAuthStore();
    const { session } = useOrderStore();
    const { useMyPoints } = usePromotions();
    const { data: points } = useMyPoints();

    useEffect(() => {
        setMounted(true);
    }, []);

    const menuItems = [
        { name: t('navHome'), path: '/' },
        { name: t('navMenu'), path: '/menu' },
        { name: t('navAbout'), path: '/#story' },
    ];

    return (
        <header className="bg-background/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm transition-colors duration-300">
            <div className="container mx-auto px-3 md:px-4 h-14 md:h-20 flex items-center justify-between">

                {/* Brand Logo */}
                <Link href="/" className="flex items-center gap-1.5 md:gap-2 group z-50 relative">
                    <div className="w-11 h-11 md:w-16 md:h-16 relative group-hover:rotate-12 transition-transform shrink-0">
                        <Image 
                            src="/images/logo.png" 
                            alt="Logo" 
                            fill
                            className="object-contain drop-shadow-sm" 
                            priority
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-display text-sm md:text-xl text-paper leading-tight">{t('brand1')}</span>
                        <span className="font-display text-[9px] md:text-sm text-secondary leading-tight">{t('brand2')}</span>
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

                    {/* Language Toggle */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center justify-center gap-1 h-9 md:h-11 px-2 md:px-3 rounded-full hover:bg-black/5 active:scale-95 transition-all outline-none">
                                <Globe size={16} className="text-text/80" />
                                <span className="font-display font-bold text-xs md:text-sm text-text/80">{locale === 'vi' ? 'VN' : 'EN'}</span>
                                <span className="sr-only">Toggle language</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 bg-white border-2 border-text rounded-xl shadow-[4px_4px_0px_#2D2D2D] font-display p-2 mt-1">
                            <DropdownMenuItem
                                onClick={() => switchLocale('vi')}
                                className={`cursor-pointer px-3 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-between ${locale === 'vi' ? 'bg-primary/10 text-primary' : 'hover:bg-black/5 text-text'}`}
                            >
                                <span>Tiếng Việt</span>
                                <span>🇻🇳</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => switchLocale('en')}
                                className={`cursor-pointer px-3 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-between ${locale === 'en' ? 'bg-primary/10 text-primary' : 'hover:bg-black/5 text-text'}`}
                            >
                                <span>English</span>
                                <span>🇬🇧</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

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
                                        <span>{(user.username || t('member')).toUpperCase()}</span>
                                        {points && (
                                            <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full ml-1">
                                                <Star size={10} className="fill-yellow-300 text-yellow-300" />
                                                <span className="text-[10px] font-black">{points.balance}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="absolute top-full right-0 mt-2 w-52 bg-white border-2 border-text rounded-xl shadow-[4px_4px_0px_#2D2D2D] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden font-display">
                                        {user.role === 'Admin' && (
                                            <Link
                                                href="/admin"
                                                className="px-4 py-3 text-left text-sm font-bold border-b-2 border-text/5 hover:bg-black/5 transition-colors"
                                            >
                                                {t('admin')}
                                            </Link>
                                        )}
                                        {user.role === 'Client' && (
                                            <>
                                                <Link
                                                    href="/history"
                                                    className="px-4 py-3 text-left text-sm font-bold border-b-2 border-text/5 hover:bg-black/5 transition-colors"
                                                >
                                                    {t('history')}
                                                </Link>
                                                <Link
                                                    href="/vouchers"
                                                    className="px-4 py-3 text-left text-sm font-bold border-b-2 border-text/5 hover:bg-black/5 transition-colors"
                                                >
                                                    {t('vouchers')}
                                                </Link>
                                            </>
                                        )}
                                        <button
                                            onClick={async () => { 
                                                try { await axiosInstance.post('/api/identity/logout'); } catch(_) {}
                                                logout(); 
                                                toast.success('Đã đăng xuất!'); 
                                            }}
                                            className="px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            ĐĂNG XUẤT
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    id="nav-member-desktop"
                                    className="onboarding-member hidden md:flex items-center gap-2 bg-primary text-white font-display text-sm px-6 py-3 rounded-full border-2 border-text shadow-[2px_2px_0px_#2D2D2D] active:translate-y-px active:shadow-none transition-all active:scale-95 cursor-pointer"
                                    onClick={() => setIsLoginOpen(true)}
                                >
                                    <User size={16} />
                                    <span>{t('member')}</span>
                                </div>
                            )}
                        </div>

                        {/* Mobile Version (Dropdown) */}
                        <div className="md:hidden">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div
                                        id="nav-member-mobile"
                                        className="onboarding-member md:hidden flex flex-row items-center gap-1.5 bg-primary text-white font-display text-[11px] px-3 py-2 rounded-full border-2 border-text shadow-[2px_2px_0px_#2D2D2D] active:translate-y-px active:shadow-none transition-all cursor-pointer min-h-[36px]"
                                    >
                                        <User size={14} />
                                        <span className="max-w-[80px] truncate">{mounted && user ? (user.username || t('member')).toUpperCase() : t('member')}</span>
                                        {mounted && user && points && (
                                            <span className="flex items-center gap-0.5 bg-white/20 px-1.5 py-0.5 rounded-full text-[9px] font-black">
                                                <Star size={7} className="fill-yellow-300 text-yellow-300" />
                                                {points.balance}
                                            </span>
                                        )}
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 bg-white border-2 border-text rounded-xl shadow-[4px_4px_0px_#2D2D2D] p-2 mt-2 font-display">
                                    <DropdownMenuItem asChild id="mobile-home">
                                        <Link href="/" className="w-full text-sm font-bold cursor-pointer px-4 py-3 hover:bg-black/5 rounded-lg transition-colors focus:bg-black/5" >
                                            <span className="flex items-center gap-2.5"><Home size={15} className="text-neutral-500" /> {t('navHome')}</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild id="mobile-menu">
                                        <Link href="/menu" className="w-full text-sm font-bold cursor-pointer px-4 py-3 hover:bg-black/5 rounded-lg transition-colors focus:bg-black/5" >
                                            <span className="flex items-center gap-2.5"><UtensilsCrossed size={15} className="text-neutral-500" /> {t('navMenu')}</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild id="mobile-about">
                                        <Link href="/#story" className="w-full text-sm font-bold cursor-pointer px-4 py-3 hover:bg-black/5 rounded-lg transition-colors focus:bg-black/5" >
                                            <span className="flex items-center gap-2.5"><Building2 size={15} className="text-neutral-500" /> {t('navAbout')}</span>
                                        </Link>
                                    </DropdownMenuItem>

                                    {mounted && user && user.role === 'Admin' && (
                                        <DropdownMenuItem asChild id="mobile-admin">
                                            <Link href="/admin" className="w-full text-sm font-bold bg-black/5 border-2 border-black/5 cursor-pointer px-4 py-3 hover:bg-black/10 rounded-lg transition-colors focus:bg-black/10" >
                                                <span className="flex items-center gap-2.5"><Settings size={15} className="text-neutral-500" /> {t('admin')}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    )}

                                    {mounted && user && user.role === 'Client' && (
                                        <>
                                            <DropdownMenuItem asChild id="mobile-history">
                                                <Link href="/history" className="w-full text-sm font-bold cursor-pointer px-4 py-3 hover:bg-black/5 rounded-lg transition-all focus:bg-black/5 flex items-center justify-between group" >
                                                    <span className="flex items-center gap-2.5"><ScrollText size={16} className="text-primary" /> {t('history')}</span>
                                                    <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ChevronDown size={10} className="-rotate-90 text-primary" />
                                                    </div>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild id="mobile-vouchers">
                                                <Link href="/vouchers" className="w-full text-sm font-bold cursor-pointer px-4 py-3 hover:bg-black/5 rounded-lg transition-all focus:bg-black/5 flex items-center justify-between group" >
                                                    <span className="flex items-center gap-2.5"><BadgePercent size={16} className="text-secondary" /> {t('vouchers')}</span>
                                                    <div className="size-5 rounded-full bg-secondary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ChevronDown size={10} className="-rotate-90 text-secondary" />
                                                    </div>
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    )}

                                    <DropdownMenuSeparator className="bg-text/10 my-1" />

                                    {mounted && user ? (
                                        <DropdownMenuItem
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                try { await axiosInstance.post('/api/identity/logout'); } catch(_) {}
                                                logout();
                                                toast.success(t('logoutSuccess'));
                                            }}
                                            className="w-full text-sm font-bold text-red-600 focus:text-red-700 cursor-pointer px-4 py-3 hover:bg-red-50 rounded-lg transition-colors focus:bg-red-50"
                                        >
                                            <span className="flex items-center gap-2.5"><LogOut size={15} /> {t('logout')}</span>
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setIsLoginOpen(true);
                                            }}
                                            className="w-full text-sm font-bold cursor-pointer px-4 py-3 hover:bg-black/5 rounded-lg transition-colors focus:bg-black/5"
                                        >
                                            <span className="flex items-center gap-2.5"><KeyRound size={15} className="text-neutral-500" /> {t('login')}</span>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Mobile Login Dialog removed from here, moved to global scope */}
                        </div>
                    </div>
                </div>

            </div>

            {/* Global Login Dialog */}
            {!user && (
                <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                    <DialogContent className="w-[92vw] max-w-lg bg-background border-2 border-black box-border p-0 overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,0.1)] rounded-[2rem] font-admin">
        <DialogDescription className="sr-only">Dialog nội dung</DialogDescription>
                        <DialogHeader>
                            <DialogTitle className="sr-only">Đăng nhập</DialogTitle>
                        </DialogHeader>
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{ backgroundImage: "url('/images/parchment.png')" }}>
                        </div>
                        <div className="relative p-10 overflow-y-auto max-h-[85vh] custom-scrollbar">
                            <LoginForm onSuccess={() => setIsLoginOpen(false)} />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </header>
    );
}
