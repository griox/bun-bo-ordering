import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';
import { useAuthStore } from '@/store/useAuthStore';

export function useReorderPreference() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery<{ preferredOrderId: string | null }>({
        queryKey: ['reorder-preference'],
        enabled: !!user,
        queryFn: async () => {
            const { data } = await axiosInstance.get('/api/orders/preferences/reorder');
            return data;
        },
        staleTime: 5 * 60 * 1000,
        retry: false,
    });

    const savePreference = useMutation({
        mutationFn: async (preferredOrderId: string) => {
            await axiosInstance.put('/api/orders/preferences/reorder', { preferredOrderId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reorder-preference'] });
        },
    });

    return {
        preferredOrderId: data?.preferredOrderId ?? null,
        isLoading,
        savePreference,
    };
}
