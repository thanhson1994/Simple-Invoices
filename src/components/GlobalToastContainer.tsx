"use client";

import { ToastContainer } from "./Toast";
import { useToastContext } from "@/lib/toast-context";

export function GlobalToastContainer() {
  const { toasts, dismiss } = useToastContext();
  return <ToastContainer toasts={toasts} onDismiss={dismiss} />;
}
