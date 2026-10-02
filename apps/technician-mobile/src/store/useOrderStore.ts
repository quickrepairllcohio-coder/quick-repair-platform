import { create } from 'zustand';

interface OrderStore {
  liveOrder: any | null;
  publishOrder: (order: any) => void;
  acceptOrder: () => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  liveOrder: null,
  publishOrder: (order) => set({ liveOrder: order }),
  acceptOrder: () => set({ liveOrder: null }),
}));