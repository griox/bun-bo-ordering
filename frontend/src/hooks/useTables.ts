import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';

export interface RestaurantTable {
    id: string;
    tableCode: string;
    name: string;
    posX: number;
    posY: number;
}

export const useTables = () => {
    return useQuery<RestaurantTable[]>({
        queryKey: ['tables'],
        queryFn: async () => {
            const response = await axiosInstance.get('/api/orders/tables');
            return response.data;
        },
    });
};

export const useCreateTableMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { tableCode: string; name: string; posX?: number; posY?: number }) => {
            await axiosInstance.post('/api/orders/tables', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            toast.success("Tạo bàn mới thành công!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Lỗi khi tạo bàn");
        }
    });
};

export const useUpdateTableMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: RestaurantTable) => {
            await axiosInstance.put(`/api/orders/tables/${data.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            toast.success("Cập nhật bàn thành công!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật bàn");
        }
    });
};

export const useUpdateTablePositionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, posX, posY }: { id: string; posX: number; posY: number }) => {
            await axiosInstance.patch(`/api/orders/tables/${id}/position`, null, {
                params: { posX, posY }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
        },
        onError: () => {
            toast.error("Không thể lưu vị trí bàn");
        }
    });
};

export const useUpdateTablePositionsMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: { id: string; posX: number; posY: number }[]) => {
            // Match the backend command structure: { updates: [...] }
            await axiosInstance.post('/api/orders/tables/positions', { updates });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            toast.success("Đã lưu sơ đồ bàn ăn!");
        },
        onError: () => {
            toast.error("Lỗi khi lưu sơ đồ bàn");
        }
    });
};

export const useDeleteTableMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(`/api/orders/tables/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            toast.success("Đã xóa bàn");
        },
        onError: () => {
            toast.error("Lỗi khi xóa bàn");
        }
    });
};

export const useScanTableMutation = () => {
    return useMutation({
        mutationFn: async (tableId: string) => {
            const response = await axiosInstance.post(`/api/orders/tables/${tableId}/scan`);
            return response.data; // Should return { sessionId: '...' }
        }
    });
};
