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
                         px-5 py-2.5 rounded-full text-sm font-bold font-main transition-all duration-200 border-2 whitespace-nowrap flex-shrink-0
                        ${activeCategory === cat.id
                            ? 'bg-secondary text-red-700 border-secondary text-text shadow-md translate-y-0 opacity-100'
                            : 'bg-secondary border-secondary text-text shadow-md translate-y-0 opacity-100'}
                    `}
                >
                    {cat.name}
                </button>
            ))}
        </div>
    );
}
