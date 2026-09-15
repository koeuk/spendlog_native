import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  show: (message, kind = 'info') => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts.slice(-2), { id, kind, message }] }));
    setTimeout(() => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })), 3200);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

/** Show a toast from anywhere, including non-component code. */
export function toast(message: string, kind: ToastKind = 'info'): void {
  useToastStore.getState().show(message, kind);
}
