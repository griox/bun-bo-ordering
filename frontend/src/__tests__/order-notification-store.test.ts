import { describe, it, expect, beforeEach } from 'vitest';
import { useOrderNotificationStore, OrderNotification } from '@/store/useOrderNotificationStore';

const makeNotification = (overrides: Partial<OrderNotification> = {}): OrderNotification => ({
    orderId: `order-${Math.random().toString(36).slice(2)}`,
    tableNumber: 'A1',
    items: [
        { productId: 'food-1', productName: 'Bún Bò', quantity: 2, price: 65000 },
    ],
    status: 'Created',
    createdAt: new Date().toISOString(),
    ...overrides,
});

beforeEach(() => {
    useOrderNotificationStore.setState({
        orders: [],
        notifications: [],
        unreadCount: 0,
    });
});

describe('useOrderNotificationStore', () => {

    it('adds an order and increments unread count', () => {
        const order = makeNotification({ orderId: 'order-1' });
        useOrderNotificationStore.getState().addOrder(order);

        const state = useOrderNotificationStore.getState();
        expect(state.orders).toHaveLength(1);
        expect(state.notifications).toHaveLength(1);
        expect(state.unreadCount).toBe(1);
    });

    it('prepends new orders (most recent first)', () => {
        useOrderNotificationStore.getState().addOrder(makeNotification({ orderId: 'old' }));
        useOrderNotificationStore.getState().addOrder(makeNotification({ orderId: 'new' }));

        const state = useOrderNotificationStore.getState();
        expect(state.orders[0].orderId).toBe('new');
        expect(state.orders[1].orderId).toBe('old');
    });

    it('accumulates unread count with multiple orders', () => {
        useOrderNotificationStore.getState().addOrder(makeNotification());
        useOrderNotificationStore.getState().addOrder(makeNotification());
        useOrderNotificationStore.getState().addOrder(makeNotification());

        expect(useOrderNotificationStore.getState().unreadCount).toBe(3);
    });

    it('updates order status correctly', () => {
        useOrderNotificationStore.getState().addOrder(makeNotification({ orderId: 'order-1', status: 'Created' }));
        useOrderNotificationStore.getState().updateOrderStatus('order-1', 'Paid');

        expect(useOrderNotificationStore.getState().orders[0].status).toBe('Paid');
    });

    it('does not affect other orders when updating status', () => {
        useOrderNotificationStore.getState().addOrder(makeNotification({ orderId: 'order-1', status: 'Created' }));
        useOrderNotificationStore.getState().addOrder(makeNotification({ orderId: 'order-2', status: 'Created' }));
        useOrderNotificationStore.getState().updateOrderStatus('order-1', 'Cooking');

        const state = useOrderNotificationStore.getState();
        // order-2 is at index 0 because addOrder prepends
        const order2 = state.orders.find(o => o.orderId === 'order-2');
        expect(order2?.status).toBe('Created');
    });

    it('marks all as read (resets unread count)', () => {
        useOrderNotificationStore.getState().addOrder(makeNotification());
        useOrderNotificationStore.getState().addOrder(makeNotification());
        useOrderNotificationStore.getState().markAsRead();

        expect(useOrderNotificationStore.getState().unreadCount).toBe(0);
    });

    it('clears all notifications and resets unread count', () => {
        useOrderNotificationStore.getState().addOrder(makeNotification());
        useOrderNotificationStore.getState().addOrder(makeNotification());
        useOrderNotificationStore.getState().clearNotifications();

        const state = useOrderNotificationStore.getState();
        expect(state.notifications).toHaveLength(0);
        expect(state.unreadCount).toBe(0);
    });

    it('sets orders in bulk', () => {
        const orders = [makeNotification(), makeNotification(), makeNotification()];
        useOrderNotificationStore.getState().setOrders(orders);

        expect(useOrderNotificationStore.getState().orders).toHaveLength(3);
    });
});
