import { describe, it, expect } from 'vitest';
import { Order, OrderItem } from '@/hooks/useOrders';

// ── Pure helper extracted from ReorderPrompt ────────────────────────────────
// Mirrors the useMemo logic in ReorderPrompt.tsx
interface TopItem {
    key: string;
    item: OrderItem;
    totalQty: number;
}

function computeTopItems(orders: Order[], limit = 5): TopItem[] {
    const map: Record<string, TopItem> = {};
    orders.forEach(order => {
        order.orderItems?.forEach(item => {
            const key = item.foodId ?? item.dishId ?? item.id;
            if (!map[key]) map[key] = { key, item, totalQty: 0 };
            map[key].totalQty += item.quantity;
        });
    });
    return Object.values(map)
        .sort((a, b) => b.totalQty - a.totalQty)
        .slice(0, limit);
}

// ── Fixtures ────────────────────────────────────────────────────────────────
const makeItem = (overrides: Partial<OrderItem> = {}): OrderItem => ({
    id: 'item-default',
    unitPrice: 50000,
    quantity: 1,
    totalPrice: 50000,
    ...overrides,
});

const makeOrder = (items: OrderItem[]): Order => ({
    id: `order-${Math.random()}`,
    tableId: 'table-1',
    totalAmount: items.reduce((s, i) => s + i.totalPrice, 0),
    status: 'Paid',
    orderItems: items,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});

// ── Tests ────────────────────────────────────────────────────────────────────
describe('computeTopItems', () => {

    // ── Happy Path ──────────────────────────────────────────────────────────

    it('returns items sorted by total quantity descending', () => {
        const orders = [
            makeOrder([
                makeItem({ foodId: 'bun-bo', quantity: 3 }),
                makeItem({ foodId: 'com-tam', quantity: 1 }),
            ]),
            makeOrder([
                makeItem({ foodId: 'bun-bo', quantity: 2 }),
                makeItem({ foodId: 'com-tam', quantity: 4 }),
            ]),
        ];

        const result = computeTopItems(orders);

        // bun-bo: 5 total, com-tam: 5 total — tie broken by insertion order
        // com-tam was inserted second so bun-bo first
        expect(result[0].key).toBe('bun-bo');
        expect(result[0].totalQty).toBe(5);
        expect(result[1].key).toBe('com-tam');
        expect(result[1].totalQty).toBe(5);
    });

    it('aggregates quantity for the same foodId across multiple orders', () => {
        const orders = [
            makeOrder([makeItem({ foodId: 'bun-bo', quantity: 2 })]),
            makeOrder([makeItem({ foodId: 'bun-bo', quantity: 3 })]),
            makeOrder([makeItem({ foodId: 'bun-bo', quantity: 1 })]),
        ];

        const result = computeTopItems(orders);

        expect(result).toHaveLength(1);
        expect(result[0].totalQty).toBe(6);
    });

    it('respects the limit parameter', () => {
        const orders = [
            makeOrder([
                makeItem({ foodId: 'a', quantity: 1 }),
                makeItem({ foodId: 'b', quantity: 2 }),
                makeItem({ foodId: 'c', quantity: 3 }),
                makeItem({ foodId: 'd', quantity: 4 }),
                makeItem({ foodId: 'e', quantity: 5 }),
                makeItem({ foodId: 'f', quantity: 6 }),
            ]),
        ];

        const result = computeTopItems(orders, 3);

        expect(result).toHaveLength(3);
        expect(result[0].key).toBe('f');
        expect(result[1].key).toBe('e');
        expect(result[2].key).toBe('d');
    });

    it('returns most-ordered item first when quantities differ', () => {
        const orders = [
            makeOrder([
                makeItem({ foodId: 'pho', quantity: 10 }),
                makeItem({ foodId: 'bun-bo', quantity: 1 }),
            ]),
        ];

        const result = computeTopItems(orders);

        expect(result[0].key).toBe('pho');
    });

    // ── Edge Cases ──────────────────────────────────────────────────────────

    it('returns empty array for empty orders list', () => {
        const result = computeTopItems([]);
        expect(result).toHaveLength(0);
    });

    it('returns empty array for orders with no items', () => {
        const result = computeTopItems([makeOrder([])]);
        expect(result).toHaveLength(0);
    });

    it('falls back to dishId when foodId is undefined', () => {
        const orders = [
            makeOrder([
                makeItem({ foodId: undefined, dishId: 'dish-1', quantity: 2 }),
            ]),
        ];

        const result = computeTopItems(orders);

        expect(result[0].key).toBe('dish-1');
        expect(result[0].totalQty).toBe(2);
    });

    it('falls back to item.id when both foodId and dishId are undefined', () => {
        const orders = [
            makeOrder([
                makeItem({ id: 'fallback-id', foodId: undefined, dishId: undefined, quantity: 1 }),
            ]),
        ];

        const result = computeTopItems(orders);

        expect(result[0].key).toBe('fallback-id');
    });

    it('does not exceed limit even when fewer items exist', () => {
        const orders = [
            makeOrder([makeItem({ foodId: 'only-one', quantity: 5 })]),
        ];

        const result = computeTopItems(orders, 5);

        expect(result).toHaveLength(1);
    });
});
