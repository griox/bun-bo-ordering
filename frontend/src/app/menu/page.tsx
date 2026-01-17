'use client';

import { useOrderStore } from '@/store/useOrderStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MOCK_CATEGORIES, MOCK_FOODS } from '@/data/mockData';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { FoodItemCard } from '@/components/menu/FoodItemCard';
import { StickyCart } from '@/components/menu/StickyCart';

export default function MenuPage() {
    const { table, session } = useOrderStore();
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0]?.id || '');

    const activeItems = MOCK_FOODS.filter(item => item.categoryId === activeCategory);

    return (
        <div className="pb-24 bg-background min-h-screen p-2 md:p-4">
            <div className="max-w-md mx-auto relative">

                {/* Header Ticket Style */}
                <header className="bg-paper p-4 rounded-t-xl border-x-4 border-t-4 border-dashed border-primary/30 relative">
                    <div className="flex justify-between items-center z-10 relative">
                        <div>
                            <h1 className="text-2xl font-display text-primary drop-shadow-sm">
                                {table ? table.name : 'KHÁCH LẺ'}
                            </h1>
                            <p className="text-xs font-bold font-main text-text/60 uppercase tracking-widest">
                                {session ? `SESSION #${session.id.substring(0, 4)}` : 'ORDER TẠI BÀN'}
                            </p>
                        </div>
                        <div className="bg-secondary p-2 rounded-full border-2 border-text shadow-[2px_2px_0px_#2D2D2D]">
                            <span className="text-2xl">🍜</span>
                        </div>
                    </div>
                </header>

                {/* Category Nav */}
                <div className="bg-paper px-2 border-x-4 border-dashed border-primary/30">
                    <CategoryNav
                        categories={MOCK_CATEGORIES}
                        activeCategory={activeCategory}
                        onSelect={setActiveCategory}
                    />
                </div>

                {/* Main Content Paper */}
                <main className="bg-paper min-h-[60vh] rounded-b-xl border-x-4 border-b-4 border-dashed border-primary/30 p-2 shadow-2xl relative overflow-hidden">
                    {/* Background Texture Overlay */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply"
                        style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/cream-paper.png")` }}></div>

                    <h2 className="px-2 py-4 font-display text-3xl text-text text-center transform -rotate-1">
                        {MOCK_CATEGORIES.find(c => c.id === activeCategory)?.name}
                    </h2>

                    <div className="space-y-3 relative z-10 px-2 pb-4">
                        {activeItems.map((item) => (
                            <FoodItemCard key={item.id} item={item} />
                        ))}
                    </div>

                    {activeItems.length === 0 && (
                        <div className="p-8 text-center text-gray-500 font-main italic">
                            Chưa cập nhật món ăn.
                        </div>
                    )}
                </main>
            </div>

            {/* Sticky Cart Footer */}
            <StickyCart />

        </div>
    );
}
