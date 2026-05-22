import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';

export interface UnreadOrderItem {
    productName: string;
    quantity: number;
}

export interface UnreadOrder {
    id: string;
    tableCode: string;
    tableName: string;
    totalAmount: number;
    paymentMethod: string;
    status: number;
    createdAt: string;
    items: UnreadOrderItem[];
}

export const useUnreadOrders = () => {
    const queryClient = useQueryClient();

    const { data: unreadOrders = [], isLoading, isError } = useQuery<UnreadOrder[]>({
        queryKey: ['unread-orders'],
        queryFn: async () => {
            const res = await axiosInstance.get('/api/orders/unread');
            return res.data;
        },
        refetchInterval: 30000, // Optional: Poll every 30s as a fallback to SignalR
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (orderId: string) => {
            // Status 4 is Completed
            const res = await axiosInstance.put(`/api/orders/${orderId}/status?status=4`);
            return res.data;
        },
        onSuccess: () => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['unread-orders'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
    });

    return {
        unreadOrders,
        isLoading,
        isError,
        markAsRead: markAsReadMutation.mutate,
        isMarkingAsRead: markAsReadMutation.isPending
    };
};
