'use client';

import Link from 'next/link';
export function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}>
            </div>

            {/* Decorative Floating Elements (Warm Glows) */}
            <div className="absolute top-10 left-10 w-64 h-64 bg-primary/20 rounded-full filter blur-3xl animate-blob"></div>
            <div className="absolute top-1/4 right-0 w-80 h-80 bg-yellow-400/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-red-400/10 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>

            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                <div className="inline-block mb-4 px-6 py-2 bg-paper rounded-full border-2 border-primary transform -rotate-2 shadow-lg hover:rotate-0 transition-transform cursor-default">
                    <span className="font-display text-primary text-lg tracking-wider">HƯƠNG VỊ BIỂN x PHONG CÁCH PHỐ</span>
                </div>

                <h1 className="font-display text-6xl md:text-8xl text-paper drop-shadow-[4px_4px_0px_#D9381E] mb-6 leading-tight">
                    BÚN BÒ <br />
                    <span className="text-secondary drop-shadow-[4px_4px_0px_#2D2D2D]">& CÀ PHÊ</span>
                </h1>

                <p className="font-main text-xl text-text/90 mb-10 max-w-2xl mx-auto leading-relaxed shadow-white drop-shadow-sm font-medium">
                    Sự kết hợp hoàn hảo giữa nước dùng đậm đà, thịt bò mềm tan và ly cà phê sữa đá Nha Trang.
                    Một trải nghiệm ẩm thực "Retro" ngay giữa lòng thành phố.
                </p>

                <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/menu"
                        className="group relative inline-flex items-center justify-center gap-2 bg-primary text-white font-display text-xl px-8 py-4 rounded-full shadow-[4px_4px_0px_#2D2D2D] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2D2D2D] transition-all border-2 border-[#2D2D2D]"
                    >
                        <span className='font-bold text-white'>ĐẶT MÓN NGAY</span>
                        <span className="group-hover:translate-x-1 text-white transition-transform">→</span>
                    </Link>


                </div>
            </div>

            {/* Scroll Down Indicator */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-paper/80">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                </svg>
            </div>
        </section>
    );
}
