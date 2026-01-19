/* eslint-disable @next/next/no-img-element */
import { FoodItem } from '@/data/mockData';


interface FoodItemCardProps {
    item: FoodItem;
}

export function FoodItemCard({ item }: FoodItemCardProps) {

    return (
        <div className="flex flex-row md:flex-col gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 md:h-full border border-gray-100">
            {/* Mobile: Image Right. Desktop: Image Top */}
            <div className="md:order-1 w-24 h-24 md:w-full md:h-48 flex-shrink-0 relative overflow-hidden rounded-xl">
                <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                />
            </div>

            <div className="flex-1 md:order-2 flex flex-col justify-between">
                <div>
                    <h3 className="font-display text-xl text-text mb-1">{item.name}</h3>
                    <p className="text-gray-500 text-sm font-main line-clamp-2 mb-2">{item.description}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className="font-display text-xl text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</span>
                </div>
            </div>
        </div>
    );
}
