'use client';

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Paper Card */}
      <div className="bg-paper w-full max-w-md p-8 rounded-lg shadow-2xl relative overflow-hidden paper-texture border-4 border-dashed border-primary/30">

        {/* Retro Header Group */}
        <div className="text-center mb-8 relative z-10">
          <h1 className="font-display text-5xl md:text-6xl text-primary drop-shadow-[2px_2px_0px_#F2C94C] mb-2 transform -rotate-2">
            BÚN BÒ
          </h1>
          <h2 className="font-display text-2xl md:text-3xl text-text mt-2 transform rotate-1">
            & CÀ PHÊ PHỐ
          </h2>
        </div>

        {/* Decorative Elements (Circles) */}
        <div className="absolute top-[-20px] left-[-20px] w-20 h-20 bg-secondary rounded-full opacity-50"></div>
        <div className="absolute bottom-[-20px] right-[-20px] w-24 h-24 bg-primary rounded-full opacity-20"></div>

        {/* Center Image/Icon Placeholder */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-4 rounded-full border-4 border-secondary shadow-lg">
            <span className="text-6xl">🍜</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Link
            href="/menu" // For demo purposes, go straight to menu. Real flow uses /order/[table]
            className="inline-block bg-primary text-white font-display text-xl py-3 px-8 rounded-full shadow-[4px_4px_0px_#2D2D2D] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2D2D2D] transition-all border-2 border-[#2D2D2D]"
          >
            XEM MENU NGAY
          </Link>

          <p className="mt-6 text-sm font-main font-bold text-gray-600">
            MỞ CỬA: 6:00 - 12:00
          </p>
        </div>

        {/* Vintage Stamp */}
       

      </div>

      {/* Footer */}
      <footer className="mt-8 text-white/80 font-main text-sm text-center">
        <p>Chung cư Vĩnh Phước khu B, Nha Trang, Khánh Hòa</p>
        <p>© 2026 Bun Bo Hue Xua System</p>
      </footer>
    </div>
  );
}
