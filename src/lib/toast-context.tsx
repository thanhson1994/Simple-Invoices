"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  ReactNode,
} from "react";
import { ToastMessage, ToastVariant } from "@/components/Toast";

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (message: string, variant: ToastVariant) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useGlobalToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useGlobalToast must be used within ToastProvider");
  }

  return {
    toast: {
      success: (message: string) => context.addToast(message, "success"),
      error: (message: string) => context.addToast(message, "error"),
    },
  };
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToastContext must be used within ToastProvider");
  }
  return context;
}
