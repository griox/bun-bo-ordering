'use client';

import { useEffect, useState } from 'react';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { FoodItemCard } from '@/components/menu/FoodItemCard';
import { Footer } from '@/components/landing/Footer';
import { Header } from '@/components/layout/Header';
import { Loader2 } from 'lucide-react';
import { useCategories, useFoodsByCategory } from '@/hooks/useCatalog';

export default function MenuPage() {
    const { data: categories = [], isLoading: catsLoading } = useCategories();
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

    // Set initial active category when data loads
    useEffect(() => {
        if (categories.length > 0 && activeCategoryId === null) {
            setActiveCategoryId(categories[0].id);
        }
    }, [categories, activeCategoryId]);

    const { data: activeItems = [], isLoading: foodsLoading } = useFoodsByCategory(activeCategoryId);

    const handleCategorySelect = (id: string | number) => {
        setActiveCategoryId(Number(id));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const isLoading = catsLoading || (foodsLoading && activeItems.length === 0);

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

                    {/* Mobile: Sticky Horizontal Nav */}
                    <div className="md:hidden sticky top-16 z-40 -mx-4 px-4 py-3 bg-white/50 backdrop-blur-xl border-y border-white/50 shadow-sm overflow-x-auto no-scrollbar flex gap-3 mb-6">
                        <CategoryNav
                            categories={categories.map(c => ({ ...c, id: c.id.toString() }))}
                            activeCategory={activeCategoryId?.toString() || ''}
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
                                        categories={categories.map(c => ({ ...c, id: c.id.toString() }))}
                                        activeCategory={activeCategoryId?.toString() || ''}
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
                                    {categories.find(c => c.id === activeCategoryId)?.name}
                                </h2>
                                {foodsLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                            </div>

                            {isLoading ? (
                                <div className="py-20 flex flex-col items-center gap-4">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    <p className="text-neutral-500 italic">Đang chuẩn bị thực đơn...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activeItems.map((item) => (
                                        <FoodItemCard key={item.id} item={{
                                            ...item,
                                            image: item.imageUrl || '/images/dish-placeholder.png',
                                            category: item.categoryName || 'Món ăn'
                                        } as any} />
                                    ))}
                                </div>
                            )}

                            {!isLoading && activeItems.length === 0 && (
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
