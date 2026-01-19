import { Category } from '@/data/mockData';

interface CategoryNavProps {
    categories: Category[];
    activeCategory: string;
    onSelect: (id: string) => void;
    variant?: 'horizontal' | 'vertical';
}

export function CategoryNav({ categories, activeCategory, onSelect, variant = 'horizontal' }: CategoryNavProps) {
    const containerClasses = variant === 'horizontal'
        ? "sticky top-0 z-20 overflow-x-auto no-scrollbar py-3 flex gap-3"
        : "flex flex-col gap-3";

    return (
        <div className={containerClasses}>
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => onSelect(cat.id)}
                    className={`
                         px-5 py-2.5 rounded-full text-sm font-bold font-main transition-all duration-200 border-2
                        ${activeCategory === cat.id
                            ? 'bg-secondary border-secondary text-text shadow-md translate-y-0'
                            : 'bg-white border-white text-text/80 hover:text-primary hover:border-primary/30'}
                    `}
                >
                    {cat.name}
                </button>
            ))}
        </div>
    );
}
