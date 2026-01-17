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
                         px-4 py-2 rounded-full text-base font-display transition-all border-2
                        ${activeCategory === cat.id
                            ? 'bg-gray-800 text-white border-text shadow-[2px_2px_0px_#2D2D2D] translate-y-[-2px]'
                            : 'bg-black text  border-primary/30 hover:border-solid hover:border-text hover:text-text hover:shadow-[2px_2px_0px_#2D2D2D] hover:translate-y-[-2px]'}
                    `}
                >
                    {cat.name}
                </button>
            ))}
        </div>
    );
}
