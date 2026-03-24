/* eslint-disable @next/next/no-img-element */
import { Food } from '@/hooks/useCatalog';
import { useOrderStore } from '@/store/useOrderStore';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FoodItemCardProps {
    item: Food;
}

export function FoodItemCard({ item }: FoodItemCardProps) {
    const { cart, addToCart, updateQuantity, session } = useOrderStore();
    const cartItem = cart.find(x => x.foodId === item.id);
    const quantity = cartItem?.quantity || 0;

    const handleAdd = () => {
        addToCart({
            foodId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
        });
    };

    return (
        <div className="flex flex-row md:flex-col gap-4 p-4 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 md:h-full border border-gray-100 group">
            {/* Image Container */}
            <div className="md:order-1 w-28 h-28 md:w-full md:h-52 flex-shrink-0 relative overflow-hidden rounded-2xl bg-neutral-100">
                <img
                    src={item.imageUrl || '/images/dish-placeholder.png'}
                    alt={item.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-white font-bold text-xs px-3 py-1 border border-white/50 rounded-full">HẾT MÓN</span>
                    </div>
                )}
            </div>

            <div className="flex-1 md:order-2 flex flex-col justify-between py-1">
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-display text-neutral-900 font-bold text-xl leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                    </div>
                    <p className="text-neutral-500 text-xs font-main line-clamp-2 mb-3 leading-relaxed">{item.description}</p>
                </div>

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Giá từ</span>
                        <span className="font-display text-primary text-2xl font-black">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                        </span>
                    </div>

                    {item.isAvailable && session && (
                        <div className="flex items-center">
                            {quantity > 0 ? (
                                <div className="flex items-center bg-neutral-100 rounded-full p-1 border border-neutral-200 shadow-inner">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full hover:bg-white hover:text-red-500 transition-all"
                                        onClick={() => updateQuantity(item.id, quantity - 1)}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className="w-8 text-center font-bold text-neutral-800">{quantity}</span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full hover:bg-white hover:text-primary transition-all"
                                        onClick={() => updateQuantity(item.id, quantity + 1)}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    size="icon"
                                    className="h-12 w-12 rounded-2xl shadow-lg shadow-primary/20 hover:scale-110 transition-all duration-300"
                                    onClick={handleAdd}
                                >
                                    <Plus className="w-6 h-6" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
