import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TableResponseDto, TableSessionResponseDto } from '@/types';

// ... (CartItem and OrderState interfaces stay the same)
export interface CartItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

interface OrderState {
  table: TableResponseDto | null;
  session: TableSessionResponseDto | null;
  cart: CartItem[];

  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;

  setTable: (table: TableResponseDto | null) => void;
  setSession: (session: TableSessionResponseDto | null) => void;

  addToCart: (item: CartItem) => void;
  removeFromCart: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  updateNote: (foodId: string, note: string) => void;
  clearCart: () => void;

  paymentSuccessOrderId: string | null;
  setPaymentSuccess: (id: string | null) => void;

  // Computeds (helper functions)
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      table: null,
      session: null,
      cart: [],
      paymentSuccessOrderId: null,
      _hasHydrated: false,

      setHasHydrated: (val) => set({ _hasHydrated: val }),
      setTable: (table) => set({ table }),
      setSession: (session) => set({ session }),
      setPaymentSuccess: (id) => set({ paymentSuccessOrderId: id }),

      addToCart: (item) => set((state) => {
        const existing = state.cart.find(x => x.foodId === item.foodId);
        if (existing) {
          return {
            cart: state.cart.map(x => (x.foodId === item.foodId)
              ? { ...x, quantity: x.quantity + item.quantity }
              : x)
          };
        }
        return { cart: [...state.cart, item] };
      }),

      removeFromCart: (foodId) => set((state) => ({
        cart: state.cart.filter(x => x.foodId !== foodId)
      })),

      updateQuantity: (foodId, quantity) => set((state) => {
        if (quantity <= 0) {
          return { cart: state.cart.filter(x => x.foodId !== foodId) };
        }
        return {
          cart: state.cart.map(x => (x.foodId === foodId) ? { ...x, quantity } : x)
        };
      }),
      updateNote: (foodId, note) => set((state) => ({
        cart: state.cart.map(x => (x.foodId === foodId) ? { ...x, note } : x)
      })),

      clearCart: () => set({ cart: [] }),

      getCartTotal: () => {
        return get().cart
          .reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getCartCount: () => {
        return get().cart
          .reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'bunbo-order-storage',
      partialize: (state) => ({
        cart: state.cart,
        paymentSuccessOrderId: state.paymentSuccessOrderId,
        // ⚠️ table & session are NOT persisted — must be re-validated via QR scan
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
)
