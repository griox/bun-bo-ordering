'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';
import { useOrderStore } from '@/store/useOrderStore';
import { toast } from 'sonner';

export interface CartItemDto {
    foodId: string;
    foodName: string;
    unitPrice: number;
    quantity: number;
}

export interface CartDto {
    cartOwnerId: string;
    items: CartItemDto[];
}

export const useCart = () => {
    const { session } = useOrderStore();
    const queryClient = useQueryClient();

    const cartQuery = useQuery<CartDto>({
        queryKey: ['cart', session?.id],
        queryFn: async () => {
            if (!session?.id) return { cartOwnerId: '', items: [] };
            const response = await axiosInstance.get(`/api/cart/${session.id}`);
            return response.data;
        },
        enabled: !!session?.id,
    });

    const syncCartMutation = useMutation({
        mutationFn: async (items: CartItemDto[]) => {
            if (!session?.id) throw new Error("No active session");
            await axiosInstance.post('/api/cart', {
                cart: {
                    cartOwnerId: session.id,
                    items: items
                }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart', session?.id] });
        }
    });

    return {
        cart: cartQuery.data,
        isLoading: cartQuery.isLoading,
        syncCart: syncCartMutation.mutateAsync,
        isSyncing: syncCartMutation.isPending
    };
};

export const usePlaceOrderMutation = () => {
    const { session, clearCart } = useOrderStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ note }: { note?: string }) => {
            if (!session?.id) throw new Error("No active session");
            const response = await axiosInstance.post('/api/orders', {
                tableSessionId: session.id,
                note: note
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart', session?.id] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            clearCart();
            toast.success("Đặt món thành công! Nhà bếp đã nhận được yêu cầu.");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Không thể đặt món. Vui lòng thử lại.");
        }
    });
};
