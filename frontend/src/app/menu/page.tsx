'use client';

import { useOrderStore } from '@/store/useOrderStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MOCK_CATEGORIES, MOCK_FOODS } from '@/data/mockData';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { FoodItemCard } from '@/components/menu/FoodItemCard';

import { Footer } from '@/components/landing/Footer';

export default function MenuPage() {
    const { table, session } = useOrderStore();
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0]?.id || '');

    const activeItems = MOCK_FOODS.filter(item => item.categoryId === activeCategory);

    return (
        <div className="flex flex-col min-h-screen bg-background font-main text-text">

            <div className="flex-grow p-4 md:p-8">
                <div className="max-w-7xl mx-auto relative">

                    {/* Content Header - Clean & Friendly */}
                    <div className="text-center mb-8 md:mb-12">
                        <span className="text-secondary font-display text-lg tracking-wider uppercase mb-2 block">Thực Đơn Hôm Nay</span>
                        <h1 className="text-4xl md:text-5xl font-display text-primary drop-shadow-sm">
                            HƯƠNG VỊ CỐ ĐÔ
                        </h1>
                        <div className="w-24 h-1 bg-primary/20 mx-auto mt-4 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 min-h-[500px]">
                        {/* Sidebar / Topbar Nav */}
                        <div className="md:col-span-1">
                            {/* Mobile: Sticky Horizontal */}
                            <div className="md:hidden sticky top-0 z-40 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-primary/10 shadow-sm overflow-x-auto no-scrollbar flex gap-3">
                                <CategoryNav
                                    categories={MOCK_CATEGORIES}
                                    activeCategory={activeCategory}
                                    onSelect={setActiveCategory}
                                    variant="horizontal"
                                />
                            </div>

                            {/* Desktop: Sticky Vertical Sidebar */}
                            <div className="hidden md:block sticky top-24">
                                <div className="bg-white/50 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-white/50">
                                    <h3 className="font-display text-xl text-text/50 mb-6 pl-4 uppercase tracking-widest text-sm">Danh Mục</h3>
                                    <CategoryNav
                                        categories={MOCK_CATEGORIES}
                                        activeCategory={activeCategory}
                                        onSelect={setActiveCategory}
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
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                                    {activeItems.length} món
                                </span>
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
