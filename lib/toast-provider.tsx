"use client";

import { createContext, useContext, useCallback, useState, type ReactNode } from "react";
import { ToastContainer, type Toast, type ToastType } from "@/components/ui/toast";

type ToastContextType = {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const createToastId = useCallback(() => {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 3000) => {
      const id = createToastId();
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    [createToastId],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ToastContext.Provider>
  );
}
