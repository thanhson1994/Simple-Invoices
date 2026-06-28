import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getAccessToken } from "@/lib/cookies";
import { ensureOrgToken } from "@/lib/org-token";

type InvoiceDetailRecord = Record<string, unknown>;

interface InvoiceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function fetchInvoiceDetail(
  invoiceId: string,
): Promise<InvoiceDetailRecord | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return null;
  }

  const orgToken = await ensureOrgToken();
  if (!orgToken) {
    return null;
  }

  const invoiceServiceUrl = process.env.INVOICE_SERVICE_URL;
  if (!invoiceServiceUrl) {
    return null;
  }

  const response = await fetch(
    `${invoiceServiceUrl}/invoice-service/1.0.0/invoices/${invoiceId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "org-token": orgToken,
        "Operation-Mode": "SYNC",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as Record<string, unknown>;

  if (payload.data && typeof payload.data === "object") {
    return payload.data as InvoiceDetailRecord;
  }

  return payload;
}

function display(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  await requireAuth();

  const { id } = await params;
  const detail = await fetchInvoiceDetail(id);

  if (!detail) {
    notFound();
  }

  const entries = Object.entries(detail);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Invoice Detail
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Invoice ID: {id}
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Back to Invoices
          </Link>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Raw Invoice Fields
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {key}
                </p>
                <p className="mt-1 break-words text-sm text-zinc-900 dark:text-zinc-100">
                  {display(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
