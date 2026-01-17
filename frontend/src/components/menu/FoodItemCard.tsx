/* eslint-disable @next/next/no-img-element */
import { FoodItem } from '@/data/mockData';
import { useOrderStore } from '@/store/useOrderStore';

interface FoodItemCardProps {
    item: FoodItem;
}

export function FoodItemCard({ item }: FoodItemCardProps) {
    const { addToCart } = useOrderStore();

    const handleAdd = () => {
        addToCart({
            foodId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
        });
        // Optional: Add haptic feedback or toast here
    };

    return (
        <div className="flex gap-4 p-3 border-b-2 border-dashed border-primary/20 hover:bg-white/40 transition-colors rounded-lg group">
            <div className="flex-1">
                <h3 className="font-display text-lg text-text mb-1 group-hover:text-primary transition-colors">{item.name}</h3>
                <p className="text-text/70 text-sm font-main line-clamp-2 mb-2 leading-relaxed">{item.description}</p>
                <div className="flex items-center justify-between mt-2">
                    <span className="font-display text-xl text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</span>
                    <button
                        onClick={handleAdd}
                        className="bg-secondary text-text border-2 border-text w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-[2px_2px_0px_#2D2D2D] active:translate-y-[2px] active:shadow-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="w-24 h-24 flex-shrink-0 relative">
                <div className="absolute inset-0 bg-text rounded-xl translate-x-1 translate-y-1"></div>
                <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-xl border-2 border-text relative z-10 bg-white"
                />
            </div>
        </div>
    );
}
