'use client';

import { MOCK_FOODS } from "@/data/mockData";
import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";

export function FeaturedMenu() {
    // Select top 3 items
    const featuredItems = MOCK_FOODS.slice(0, 3);

    return (
        <section className="py-20 bg-paper relative overflow-hidden">
            {/* Background Ticket Edge Top */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-background" style={{ clipPath: "polygon(0% 0%, 0% 100%, 2% 0%, 4% 100%, 6% 0%, 8% 100%, 10% 0%, 12% 100%, 14% 0%, 16% 100%, 18% 0%, 20% 100%, 22% 0%, 24% 100%, 26% 0%, 28% 100%, 30% 0%, 32% 100%, 34% 0%, 36% 100%, 38% 0%, 40% 100%, 42% 0%, 44% 100%, 46% 0%, 48% 100%, 50% 0%, 52% 100%, 54% 0%, 56% 100%, 58% 0%, 60% 100%, 62% 0%, 64% 100%, 66% 0%, 68% 100%, 70% 0%, 72% 100%, 74% 0%, 76% 100%, 78% 0%, 80% 100%, 82% 0%, 84% 100%, 86% 0%, 88% 100%, 90% 0%, 92% 100%, 94% 0%, 96% 100%, 98% 0%, 100% 100%, 100% 0%)" }}></div>

            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <span className="text-primary font-bold tracking-widest uppercase text-sm mb-2 block">Menu Nổi Bật</span>
                    <h2 className="font-display text-4xl md:text-5xl text-text relative inline-block">
                        MÓN "RUỘT" CỦA QUÁN
                        <span className="absolute -right-8 -top-8 text-secondary transform rotate-12">
                            <Star size={40} fill="#F2C94C" stroke="#2D2D2D" strokeWidth={2} />
                        </span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featuredItems.map((item, index) => (
                        <div key={item.id} className="group relative bg-white rounded-2xl border-4 border-dashed border-primary/20 p-4 hover:border-primary transition-colors cursor-pointer">
                            <div className="aspect-square relative overflow-hidden rounded-xl mb-4 border-2 border-text bg-gray-100">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-2 right-2 bg-secondary text-text font-display px-3 py-1 rounded-full border-2 border-text text-sm shadow-sm">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                </div>
                            </div>

                            <h3 className="font-display text-2xl text-text mb-2 group-hover:text-primary transition-colors">{item.name}</h3>
                            <p className="font-main text-gray-600 line-clamp-2 mb-4 h-12">{item.description}</p>

                            <div className="flex justify-between items-center">
                                <div className="flex gap-1 text-yellow-500">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} fill="currentColor" stroke="none" />
                                    ))}
                                </div>
                                <button className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center border-2 border-text shadow-[2px_2px_0px_#2D2D2D] md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0 transition-all">
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <Link href="/menu" className="inline-block border-b-2 border-text font-display text-text hover:text-primary hover:border-primary transition-colors pb-1 text-xl">
                        XEM TOÀN BỘ MEMU →
                    </Link>
                </div>
            </div>
        </section>
    );
}
