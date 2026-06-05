import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';
import { useAuthStore } from '@/store/useAuthStore';

export interface Voucher {
    id: string;
    code: string;
    description: string;
    discountType: 'Percentage' | 'FixedAmount';
    discountValue: number;
    minOrderValue: number;
    maxDiscountAmount: number;
    validFrom: string;
    validTo: string;
    totalUsageLimit: number;
    maxUsagePerUser: number;
    isActive: boolean;
    usageCount: number;
    type: 'Standard' | 'PointRedemption' | 'Reward';
    pointCost?: number;
    conditions?: string;
}

export interface LoyaltyPoints {
    userId: string;
    balance: number;
    recentTransactions: {
        id: string;
        amount: number;
        transactionType: 'Earned' | 'Redeemed' | 'Adjusted';
        description: string;
        createdAt: string;
        orderId?: string;
    }[];
}

export interface UserVoucher {
    id: string;
    code: string;
    description: string;
    status: 'Unused' | 'Used' | 'Expired';
    expiryDate?: string;
    voucherId: string;
}

export function usePromotions() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    // Admin: Get all vouchers
    const useVouchers = (skip: number = 0, take: number = 50) => useQuery({
        queryKey: ['vouchers', skip, take],
        enabled: !!user,
        queryFn: async () => {
            const { data } = await axiosInstance.get<{ items: Voucher[], totalCount: number }>(`/api/promotion/vouchers?skip=${skip}&take=${take}`);
            return data;
        }
    });

    // Client: Get active vouchers
    const useActiveVouchers = () => useQuery({
        queryKey: ['vouchers', 'active'],
        enabled: !!user,
        queryFn: async () => {
            const { data } = await axiosInstance.get<Voucher[]>('/api/promotion/vouchers/active');
            return data;
        }
    });

    // Client: Get my vouchers (claimed)
    const useMyVouchers = () => useQuery({
        queryKey: ['vouchers', 'my'],
        enabled: !!user,
        refetchInterval: 30000, // Refresh every 30 seconds for real-time status
        queryFn: async () => {
            const { data } = await axiosInstance.get<UserVoucher[]>('/api/promotion/vouchers/my');
            return data;
        }
    });

    // Admin: Create voucher
    const createVoucherMutation = useMutation({
        mutationFn: async (formData: {
            code: string;
            description: string;
            discountType: 'Percentage' | 'FixedAmount';
            discountValue: number;
            minOrderValue: number;
            maxDiscountAmount: number;
            startDate: string;
            endDate: string;
            maxUsageLimit: number;
            maxUsagePerUser: number;
            isActive: boolean;
            type: 'Standard' | 'PointRedemption' | 'Reward';
            pointCost?: number;
        }) => {
            // Map frontend form fields to backend C# command fields
            const typeMap = {
                'Standard': 0,
                'PointRedemption': 1,
                'Reward': 2
            };

            const discountTypeMap = {
                'Percentage': 0,
                'FixedAmount': 1
            };

            const payload = {
                code: formData.code,
                description: formData.description,
                discountType: discountTypeMap[formData.discountType],
                discountValue: Number(formData.discountValue),
                minOrderValue: Number(formData.minOrderValue),
                maxDiscountAmount: formData.discountType === 'Percentage' ? (formData.maxDiscountAmount || null) : null,
                validFrom: formData.type === 'PointRedemption' ? null : new Date(formData.startDate).toISOString(),
                validTo: formData.type === 'PointRedemption' ? null : new Date(formData.endDate).toISOString(),
                totalUsageLimit: Number(formData.maxUsageLimit),
                maxUsagePerUser: Number(formData.maxUsagePerUser),
                type: typeMap[formData.type],
                pointCost: formData.type === 'PointRedemption' ? Number(formData.pointCost) : null,
                conditions: null,
            };
            const { data } = await axiosInstance.post<Voucher>('/api/promotion/vouchers', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vouchers'] });
        }
    });

    // Client: Get loyalty points
    const useMyPoints = () => useQuery({
        queryKey: ['my-points'],
        enabled: !!user,
        refetchInterval: 30000, // Refresh every 30 seconds
        queryFn: async () => {
            const { data } = await axiosInstance.get<LoyaltyPoints>('/api/promotion/points');
            return data;
        }
    });

    // Client: Validate voucher
    const validateVoucherMutation = useMutation({
        mutationFn: async ({ code, orderValue }: { code: string, orderValue: number }) => {
            try {
                const { data } = await axiosInstance.post('/api/promotion/vouchers/validate', { code, orderValue });
                return data as { isValid: boolean, discountAmount: number, message: string };
            } catch (error: unknown) {
                const axiosError = error as { response?: { data?: { isValid: boolean; discountAmount: number; message: string } } };
                if (axiosError.response && axiosError.response.data) {
                    return axiosError.response.data;
                }
                throw error;
            }
        }
    });

    // Client: Redeem voucher
    const useRedeemVoucherMutation = () => {
        return useMutation({
            mutationFn: async (voucherId: string) => {
                const { data } = await axiosInstance.post(`/api/promotion/vouchers/redeem?voucherId=${voucherId}`);
                return data;
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['vouchers', 'my'] });
                queryClient.invalidateQueries({ queryKey: ['vouchers', 'active'] });
                queryClient.invalidateQueries({ queryKey: ['my-points'] });
            }
        });
    };

    // Admin: Update voucher
    const updateVoucherMutation = useMutation({
        mutationFn: async ({ id, formData }: { id: string, formData: { description: string; discountType: string; discountValue: number; minOrderValue: number; maxDiscountAmount?: number; startDate?: string; endDate?: string; maxUsageLimit: number; maxUsagePerUser: number; isActive: boolean; type: string; pointCost?: number; } }) => {
            const typeMap = { 'Standard': 0, 'PointRedemption': 1, 'Reward': 2 };
            const discountTypeMap = { 'Percentage': 0, 'FixedAmount': 1 };

            const payload = {
                id: id,
                description: formData.description,
                discountType: discountTypeMap[formData.discountType as 'Percentage' | 'FixedAmount'],
                discountValue: Number(formData.discountValue),
                minOrderValue: Number(formData.minOrderValue),
                maxDiscountAmount: formData.discountType === 'Percentage' ? (formData.maxDiscountAmount || null) : null,
                validFrom: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                validTo: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                totalUsageLimit: Number(formData.maxUsageLimit),
                maxUsagePerUser: Number(formData.maxUsagePerUser),
                isActive: formData.isActive,
                type: typeMap[formData.type as 'Standard' | 'PointRedemption' | 'Reward'],
                pointCost: formData.type === 'PointRedemption' ? Number(formData.pointCost) : null,
                conditions: null,
            };
            const { data } = await axiosInstance.put(`/api/promotion/vouchers/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vouchers'] });
            queryClient.invalidateQueries({ queryKey: ['vouchers', 'active'] });
        }
    });

    // Admin: Delete voucher
    const deleteVoucherMutation = useMutation({
        mutationFn: async (id: string) => {
            const { data } = await axiosInstance.delete(`/api/promotion/vouchers/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vouchers'] });
            queryClient.invalidateQueries({ queryKey: ['vouchers', 'active'] });
        }
    });

    return {
        useVouchers,
        useActiveVouchers,
        useMyVouchers,
        createVoucherMutation,
        updateVoucherMutation,
        deleteVoucherMutation,
        useMyPoints,
        validateVoucherMutation,
        useRedeemVoucherMutation
    };
}
