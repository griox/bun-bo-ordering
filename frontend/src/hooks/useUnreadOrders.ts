import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';

export interface UnreadOrderItem {
    productName: string;
    quantity: number;
    note?: string | null;
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
        mutationFn: async (tableCode: string) => {
            const res = await axiosInstance.post(`/api/orders/mark-read-by-table/${tableCode}`);
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
