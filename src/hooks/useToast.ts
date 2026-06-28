import { useGlobalToast } from "@/lib/toast-context";

/**
 * Hook to display toast notifications globally.
 * @returns Object with toast methods (success, error)
 * @example
 * const { toast } = useToast();
 * toast.success("Operation completed!");
 * toast.error("Something went wrong");
 */
export function useToast() {
  return useGlobalToast();
}
