import { create } from 'zustand'

interface OrderState {
  order: any | null;
  setOrder: (order: any) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  order: null,
  setOrder: (order) => set({ order }),
}))
