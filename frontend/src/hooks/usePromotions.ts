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

export function usePromotions() {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();

    // Admin: Get all vouchers
    const useVouchers = (skip: number = 0, take: number = 50) => useQuery({
        queryKey: ['vouchers', skip, take],
        enabled: !!token,
        queryFn: async () => {
            const { data } = await axiosInstance.get<{ items: Voucher[], totalCount: number }>(`/api/promotion/vouchers?skip=${skip}&take=${take}`);
            return data;
        }
    });

    // Client: Get active vouchers
    const useActiveVouchers = () => useQuery({
        queryKey: ['vouchers', 'active'],
        enabled: !!token,
        queryFn: async () => {
            const { data } = await axiosInstance.get<Voucher[]>('/api/promotion/vouchers/active');
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
        enabled: !!token,
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

    // Client: Redeem voucher
    const useRedeemVoucherMutation = () => {
        return useMutation({
            mutationFn: async (voucherId: string) => {
                const { data } = await axiosInstance.post(`/api/promotion/vouchers/redeem?voucherId=${voucherId}`);
                return data;
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['vouchers'] });
                queryClient.invalidateQueries({ queryKey: ['my-points'] });
            }
        });
    };

    return {
        useVouchers,
        useActiveVouchers,
        createVoucherMutation,
        useMyPoints,
        validateVoucherMutation,
        useRedeemVoucherMutation
    };
}
