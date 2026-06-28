import InvoiceListView from "@/components/invoices/InvoiceListView";
import { requireAuth } from "@/lib/auth";

export default async function Home() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Simple Invoice
            </h1>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <InvoiceListView />
      </main>
    </div>
  );
}
