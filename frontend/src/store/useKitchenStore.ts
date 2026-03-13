import { create } from 'zustand';

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    note?: string;
}

export interface KitchenOrder {
    orderId: string;
    tableNumber: string;
    items: OrderItem[];
    status: 'Created' | 'Cooking' | 'Served' | 'Cancelled' | 'PendingPayment' | 'Paid' | 'Closed';
    createdAt: string;
}

interface KitchenState {
    orders: KitchenOrder[];
    notifications: KitchenOrder[];
    unreadCount: number;
    setOrders: (orders: KitchenOrder[]) => void;
    addOrder: (order: KitchenOrder) => void;
    updateOrderStatus: (orderId: string, status: KitchenOrder['status']) => void;
    clearNotifications: () => void;
    markAsRead: () => void;
}

export const useKitchenStore = create<KitchenState>((set) => ({
    orders: [],
    notifications: [],
    unreadCount: 0,
    setOrders: (orders) => set({ orders }),
    addOrder: (order) => set((state) => ({
        orders: [order, ...state.orders],
        notifications: [order, ...state.notifications],
        unreadCount: state.unreadCount + 1
    })),
    updateOrderStatus: (orderId, status) => set((state) => ({
        orders: state.orders.map(o => o.orderId === orderId ? { ...o, status } : o)
    })),
    clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
    markAsRead: () => set({ unreadCount: 0 })
}));
