import { describe, it, expect, beforeEach } from 'vitest';
import { useOrderStore, CartItem } from '@/store/useOrderStore';

// Reset store before each test
beforeEach(() => {
    useOrderStore.setState({
        table: null,
        session: null,
        cart: [],
        paymentSuccessOrderId: null,
        sessionExpiresAt: null,
        _hasHydrated: false,
    });
});

const makeCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
    foodId: 'food-1',
    name: 'Bún Bò Huế',
    price: 65000,
    quantity: 1,
    ...overrides,
});

describe('useOrderStore — Cart Operations', () => {

    // ── addToCart ────────────────────────────────────────────────────────────

    it('adds a new item to an empty cart', () => {
        const item = makeCartItem();
        useOrderStore.getState().addToCart(item);

        const cart = useOrderStore.getState().cart;
        expect(cart).toHaveLength(1);
        expect(cart[0].foodId).toBe('food-1');
        expect(cart[0].quantity).toBe(1);
    });

    it('increments quantity when adding an existing item', () => {
        useOrderStore.getState().addToCart(makeCartItem({ quantity: 2 }));
        useOrderStore.getState().addToCart(makeCartItem({ quantity: 3 }));

        const cart = useOrderStore.getState().cart;
        expect(cart).toHaveLength(1);
        expect(cart[0].quantity).toBe(5);
    });

    it('adds multiple different items independently', () => {
        useOrderStore.getState().addToCart(makeCartItem({ foodId: 'food-1', name: 'Bún Bò' }));
        useOrderStore.getState().addToCart(makeCartItem({ foodId: 'food-2', name: 'Cơm Tấm' }));

        const cart = useOrderStore.getState().cart;
        expect(cart).toHaveLength(2);
    });

    // ── removeFromCart ───────────────────────────────────────────────────────

    it('removes an item from cart by foodId', () => {
        useOrderStore.getState().addToCart(makeCartItem({ foodId: 'food-1' }));
        useOrderStore.getState().addToCart(makeCartItem({ foodId: 'food-2' }));

        useOrderStore.getState().removeFromCart('food-1');

        const cart = useOrderStore.getState().cart;
        expect(cart).toHaveLength(1);
        expect(cart[0].foodId).toBe('food-2');
    });

    it('does nothing when removing non-existent item', () => {
        useOrderStore.getState().addToCart(makeCartItem());
        useOrderStore.getState().removeFromCart('non-existent');

        expect(useOrderStore.getState().cart).toHaveLength(1);
    });

    // ── updateQuantity ──────────────────────────────────────────────────────

    it('updates quantity of an existing item', () => {
        useOrderStore.getState().addToCart(makeCartItem({ foodId: 'food-1', quantity: 1 }));
        useOrderStore.getState().updateQuantity('food-1', 5);

        expect(useOrderStore.getState().cart[0].quantity).toBe(5);
    });

    it('removes item when quantity is set to 0', () => {
        useOrderStore.getState().addToCart(makeCartItem());
        useOrderStore.getState().updateQuantity('food-1', 0);

        expect(useOrderStore.getState().cart).toHaveLength(0);
    });

    it('removes item when quantity is set to negative', () => {
        useOrderStore.getState().addToCart(makeCartItem());
        useOrderStore.getState().updateQuantity('food-1', -1);

        expect(useOrderStore.getState().cart).toHaveLength(0);
    });

    // ── updateNote ──────────────────────────────────────────────────────────

    it('updates note of an existing item', () => {
        useOrderStore.getState().addToCart(makeCartItem());
        useOrderStore.getState().updateNote('food-1', 'Không hành, thêm ớt');

        expect(useOrderStore.getState().cart[0].note).toBe('Không hành, thêm ớt');
    });

    // ── clearCart ────────────────────────────────────────────────────────────

    it('clears all items from cart', () => {
        useOrderStore.getState().addToCart(makeCartItem({ foodId: 'food-1' }));
        useOrderStore.getState().addToCart(makeCartItem({ foodId: 'food-2' }));
        useOrderStore.getState().clearCart();

        expect(useOrderStore.getState().cart).toHaveLength(0);
    });

    // ── getCartTotal ────────────────────────────────────────────────────────

    it('calculates correct cart total', () => {
        useOrderStore.getState().addToCart(makeCartItem({ foodId: 'food-1', price: 65000, quantity: 2 }));
        useOrderStore.getState().addToCart(makeCartItem({ foodId: 'food-2', price: 45000, quantity: 1 }));

        // 65000 * 2 + 45000 * 1 = 175000
        expect(useOrderStore.getState().getCartTotal()).toBe(175000);
    });

    it('returns 0 for empty cart', () => {
        expect(useOrderStore.getState().getCartTotal()).toBe(0);
    });

    // ── getCartCount ────────────────────────────────────────────────────────

    it('calculates correct cart count (sum of quantities)', () => {
        useOrderStore.getState().addToCart(makeCartItem({ foodId: 'food-1', quantity: 3 }));
        useOrderStore.getState().addToCart(makeCartItem({ foodId: 'food-2', quantity: 2 }));

        expect(useOrderStore.getState().getCartCount()).toBe(5);
    });

    it('returns 0 for empty cart count', () => {
        expect(useOrderStore.getState().getCartCount()).toBe(0);
    });
});

describe('useOrderStore — Session Management', () => {

    it('extends session by 20 minutes', () => {
        const before = Date.now();
        useOrderStore.getState().extendSession();
        const after = Date.now();

        const expiresAt = useOrderStore.getState().sessionExpiresAt!;
        // Should be ~20 minutes from now
        expect(expiresAt).toBeGreaterThanOrEqual(before + 20 * 60 * 1000);
        expect(expiresAt).toBeLessThanOrEqual(after + 20 * 60 * 1000);
    });

    it('sets and clears payment success order ID', () => {
        useOrderStore.getState().setPaymentSuccess('order-123');
        expect(useOrderStore.getState().paymentSuccessOrderId).toBe('order-123');

        useOrderStore.getState().setPaymentSuccess(null);
        expect(useOrderStore.getState().paymentSuccessOrderId).toBeNull();
    });
});
