'use client';

import { useOrderStore } from '@/store/useOrderStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MOCK_CATEGORIES, MOCK_FOODS } from '@/data/mockData';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { FoodItemCard } from '@/components/menu/FoodItemCard';

import { Footer } from '@/components/landing/Footer';
import { Header } from '@/components/layout/Header';

export default function MenuPage() {
    const { table, session } = useOrderStore();
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0]?.id || '');
    const activeItems = MOCK_FOODS.filter(item => item.categoryId === activeCategory);

    // activeCategory changes only via user click
    const handleCategorySelect = (id: string) => {
        setActiveCategory(id);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Optional: Scroll to top of list
    };

    return (
        <div className="flex flex-col min-h-screen font-main text-text">
            <Header />

            <div className="flex-grow p-4 md:p-8">
                <div className="max-w-7xl mx-auto relative">

                    <div className="text-center mb-10 md:mb-16">
                        <h1 className="font-display text-6xl md:text-8xl text-paper drop-shadow-[4px_4px_0px_#D9381E] mb-6 leading-tight">
                            THỰC ĐƠN QUÁN
                        </h1>
                        <span className="text-secondary font-display text-xl tracking-widest uppercase mb-4 block drop-shadow-md">Hôm nay bạn ăn gì ?</span>
                        <div className="w-32 h-2 bg-paper/20 mx-auto mt-6 rounded-full"></div>
                    </div>

                    {/* Mobile: Sticky Horizontal Nav (Moved outside grid for proper sticky behavior) */}
                    <div className="md:hidden sticky top-16 z-40 -mx-4 px-4 py-3 bg-white/50 backdrop-blur-xl border-y border-white/50 shadow-sm overflow-x-auto no-scrollbar flex gap-3 mb-6">
                        <CategoryNav
                            categories={MOCK_CATEGORIES}
                            activeCategory={activeCategory}
                            onSelect={handleCategorySelect}
                            variant="horizontal"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 min-h-[500px]">
                        {/* Sidebar (Desktop Only) */}
                        <div className="hidden md:block md:col-span-1">
                            <div className="sticky top-24">
                                <div className="bg-white/50 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-white/50">
                                    <h3 className="font-display text-xl text-text/50 mb-6 pl-4 uppercase tracking-widest text-sm">Danh Mục</h3>
                                    <CategoryNav
                                        categories={MOCK_CATEGORIES}
                                        activeCategory={activeCategory}
                                        onSelect={handleCategorySelect}
                                        variant="vertical"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <main className="md:col-span-3">
                            <div className="mb-6 flex items-center gap-3">
                                <h2 className="font-display text-3xl text-text">
                                    {MOCK_CATEGORIES.find(c => c.id === activeCategory)?.name}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeItems.map((item) => (
                                    <FoodItemCard key={item.id} item={item} />
                                ))}
                            </div>

                            {activeItems.length === 0 && (
                                <div className="py-20 text-center">
                                    <div className="text-6xl mb-4">🥣</div>
                                    <p className="text-gray-500 font-main text-lg">
                                        Chưa cập nhật món ăn cho danh mục này.
                                    </p>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
