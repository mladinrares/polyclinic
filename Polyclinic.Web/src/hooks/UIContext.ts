import { createContext, useContext } from 'react';
import type { ToastItem, ToastType } from '../components/Toast';
import type { ConfirmOptions } from '../components/ConfirmModal';

interface UIContextType {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
  toast: (message: string, type?: ToastType) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  confirmState: { options: ConfirmOptions; resolve: (val: boolean) => void } | null;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const UIContext = createContext<UIContextType | null>(null);

export function useUIContext() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUIContext must be used within UIContext.Provider');
  return ctx;
}