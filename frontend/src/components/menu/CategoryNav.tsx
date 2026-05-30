'use client';

import { Category } from '@/data/mockData';
import { useRef, useEffect } from 'react';

interface CategoryNavProps {
    categories: Category[];
    activeCategory: string;
    onSelect: (id: string) => void;
    variant?: 'horizontal' | 'vertical';
}

export function CategoryNav({ categories, activeCategory, onSelect, variant = 'horizontal' }: CategoryNavProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const activeRef = useRef<HTMLButtonElement>(null);

    const containerClasses = variant === 'horizontal'
        ? "sticky top-0 z-20 overflow-x-auto no-scrollbar py-3 flex gap-3 scroll-smooth"
        : " flex flex-col gap-3 sticky top-0 z-20 overflow-x-auto no-scrollbar py-3" ;

    useEffect(() => {
        if (variant === 'horizontal' && activeRef.current && containerRef.current) {
            const container = containerRef.current;
            const active = activeRef.current;

            // Calculate center position
            const containerWidth = container.offsetWidth;
            const activeWidth = active.offsetWidth;
            const activeLeft = active.offsetLeft;
            const scrollLeft = activeLeft - (containerWidth / 2) + (activeWidth / 2);

            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    }, [activeCategory, variant]);

    return (
        <div ref={containerRef} className={containerClasses}>
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    ref={activeCategory === cat.id ? activeRef : null}
                    onClick={() => onSelect(cat.id)}
                    className={`
                        px-4 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[11px] md:text-sm font-black font-display transition-all duration-300 border-2 whitespace-nowrap flex-shrink-0 active:scale-95 cursor-pointer min-h-[38px] md:min-h-[44px]
                        ${activeCategory === cat.id
                            ? 'bg-primary border-primary text-white shadow-[0_8px_20px_-6px_rgba(239,68,68,0.5)] translate-y-[-1px] md:translate-y-[-2px]'
                            : 'bg-white border-neutral-100 text-neutral-500 hover:border-neutral-200'}
                    `}
                >
                    {cat.name.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
