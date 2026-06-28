"use client";

import { useEffect, useRef, useState } from "react";

export type ToastVariant = "success" | "error";

export interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Trigger enter animation on next tick
    const enterFrame = requestAnimationFrame(() => setVisible(true));

    // Start exit after 3s
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => {
      cancelAnimationFrame(enterFrame);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleTransitionEnd = () => {
    if (!visible) onDismiss(toast.id);
  };

  const isSuccess = toast.variant === "success";

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      style={{
        transition: "opacity 300ms ease, transform 300ms ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-12px)",
      }}
      className={`flex items-start gap-3 mx-auto max-w-96 px-4 py-3 rounded-lg shadow-lg border ${
        isSuccess
          ? "bg-white dark:bg-zinc-900 border-green-200 dark:border-green-800"
          : "bg-white dark:bg-zinc-900 border-red-200 dark:border-red-800"
      }`}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <span
        className={`mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold ${
          isSuccess ? "bg-green-500" : "bg-red-500"
        }`}
      >
        {isSuccess ? "✓" : "✕"}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm text-zinc-800 dark:text-zinc-100 leading-snug">
        {toast.message}
      </p>

      {/* Dismiss button */}
      <button
        onClick={() => setVisible(false)}
        className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-base leading-none cursor-pointer -mt-0.5"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col gap-0 items-stretch px-4 py-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
