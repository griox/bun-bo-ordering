'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Header() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isActive = (path: string) => pathname === path;
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const menuItems = [
        { name: 'TRANG CHỦ', path: '/' },
        { name: 'THỰC ĐƠN', path: '/menu' },
        { name: 'VỀ CHÚNG TÔI', path: '/#story' },
    ];

    return (
        <header className="bg-background/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* Brand Logo */}
                <Link href="/" className="flex items-center gap-2 group z-50 relative">
                    <div className="bg-paper w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform">
                        <span className="text-xl">🍜</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-display text-lg text-paper leading-none">BÚN BÒ</span>
                        <span className="font-display text-xs text-secondary leading-none">& CÀ PHÊ PHỐ</span>
                    </div>
                </Link>

                {/* Navigation (Desktop) */}
                <nav className="hidden md:flex items-center font-bold gap-8">
                    {menuItems.map((link) => (
                        <Link
                            key={link.path}
                            href={link.path}
                            className={`font-display text-sm tracking-wider transition-colors hover:text-red-700 ${isActive(link.path) ? 'text-red-700 border-b-2 border-none' : 'text-text/80'}`}
                        >
                            {link.name}
                        </Link>
                    ))}

                    {/* CTA Button */}
                    <Link href="/menu" className="bg-primary text-black font-display text-sm px-4 py-2 rounded-full border-2 border-text shadow-[2px_2px_0px_#2D2D2D] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#2D2D2D] transition-all">
                        ĐẶT MÓN
                    </Link>
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
                    <Link
                        href="/menu"
                        onClick={() => setIsMenuOpen(false)}
                        className="bg-primary text-black font-display text-xl px-8 py-3 rounded-full border-2 border-text shadow-[4px_4px_0px_#2D2D2D] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2D2D2D] transition-all mt-4"
                    >
                        ĐẶT MÓN NGAY
                    </Link>
                </div>
            </div>
        </header>
    );
}
