'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <header className="bg-background/95 backdrop-blur-sm sticky top-0 z-50 border-b-4 border-primary/20 shadow-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* Brand Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="bg-paper w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform">
                        <span className="text-xl">🍜</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-display text-lg text-paper leading-none">BÚN BÒ</span>
                        <span className="font-display text-xs text-secondary leading-none">& CÀ PHÊ PHỐ</span>
                    </div>
                </Link>

                {/* Navigation (Desktop) */}
                <nav className="hidden md:flex items-center gap-8">
                    {[
                        { name: 'TRANG CHỦ', path: '/' },
                        { name: 'THỰC ĐƠN', path: '/menu' },
                        { name: 'VỀ CHÚNG TÔI', path: '/#story' }, // Anchor link to story section
                    ].map((link) => (
                        <Link
                            key={link.path}
                            href={link.path}
                            className={`font-display text-sm tracking-wider transition-colors hover:text-secondary ${isActive(link.path) ? 'text-secondary border-b-2 border-secondary' : 'text-white'}`}
                        >
                            {link.name}
                        </Link>
                    ))}

                    {/* CTA Button */}
                    <Link href="/menu" className="bg-primary text-white font-display text-sm px-4 py-2 rounded-full border-2 border-text shadow-[2px_2px_0px_#2D2D2D] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#2D2D2D] transition-all">
                        ĐẶT MÓN
                    </Link>
                </nav>

                {/* Mobile Menu Button (Hamburger - Placeholder for now) */}
                <button className="md:hidden text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
