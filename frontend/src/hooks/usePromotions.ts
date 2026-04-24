import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';

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

export function usePromotions() {
    const queryClient = useQueryClient();

    // Admin: Get all vouchers
    const useVouchers = () => useQuery({
        queryKey: ['vouchers'],
        queryFn: async () => {
            const { data } = await axiosInstance.get<Voucher[]>('/api/promotion/vouchers');
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
        }) => {
            // Map frontend form fields to backend C# command fields
            const payload = {
                Code: formData.code,
                Description: formData.description,
                DiscountType: formData.discountType,
                DiscountValue: formData.discountValue,
                MinOrderValue: formData.minOrderValue,
                MaxDiscountAmount: formData.maxDiscountAmount || null,
                ValidFrom: new Date(formData.startDate).toISOString(),
                ValidTo: new Date(formData.endDate).toISOString(),
                TotalUsageLimit: formData.maxUsageLimit,
                MaxUsagePerUser: formData.maxUsagePerUser,
                Type: 0, // VoucherType.Standard
                PointCost: null,
                Conditions: null,
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
        queryFn: async () => {
            const { data } = await axiosInstance.get<LoyaltyPoints>('/api/promotion/points');
            return data;
        }
    });

    // Client: Validate voucher
    const validateVoucherMutation = useMutation({
        mutationFn: async ({ code, orderValue }: { code: string, orderValue: number }) => {
            const { data } = await axiosInstance.post('/api/promotion/vouchers/validate', { code, orderValue });
            return data as { isValid: boolean, discountAmount: number, message: string };
        }
    });

    return {
        useVouchers,
        createVoucherMutation,
        useMyPoints,
        validateVoucherMutation
    };
}
