import { Category } from '@/data/mockData';

interface CategoryNavProps {
    categories: Category[];
    activeCategory: string;
    onSelect: (id: string) => void;
}

export function CategoryNav({ categories, activeCategory, onSelect }: CategoryNavProps) {
    return (
        <div className="sticky top-0 z-20 overflow-x-auto no-scrollbar py-3 flex gap-3">
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => onSelect(cat.id)}
                    className={`
                        whitespace-nowrap px-4 py-2 rounded-full text-base font-display transition-all border-2
                        ${activeCategory === cat.id
                            ? 'bg-primary text-white border-text shadow-[2px_2px_0px_#2D2D2D] translate-y-[-2px]'
                            : 'bg-white text-text border-transparent hover:border-text hover:bg-gray-50'}
                    `}
                >
                    {cat.name}
                </button>
            ))}
        </div>
    );
}
