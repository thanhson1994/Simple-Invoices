"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { invoiceApi } from "@/lib/api-client";
import CreateInvoiceModal from "@/components/invoices/CreateInvoiceModal";
import type {
  InvoiceListResult,
  InvoiceOrdering,
  InvoiceQueryParams,
  InvoiceRow,
  InvoiceSortBy,
} from "@/types";

const DEFAULT_QUERY: Required<
  Pick<InvoiceQueryParams, "sortBy" | "ordering" | "pageNum" | "pageSize">
> = {
  sortBy: "CREATED_DATE",
  ordering: "DESCENDING",
  pageNum: 1,
  pageSize: 10,
};

function normalizeInvoiceItem(
  raw: Record<string, unknown>,
  index: number,
): InvoiceRow {
  const getStatus = () => {
    const statusValue = raw.status ?? raw.invoiceStatus;

    if (typeof statusValue === "string") {
      return statusValue;
    }

    if (Array.isArray(statusValue)) {
      const firstStatus = statusValue[0];
      if (firstStatus && typeof firstStatus === "object") {
        const firstStatusObj = firstStatus as Record<string, unknown>;
        if (
          typeof firstStatusObj.key === "string" &&
          firstStatusObj.key.trim()
        ) {
          return firstStatusObj.key.trim();
        }
      }
    }

    if (statusValue && typeof statusValue === "object") {
      const statusObj = statusValue as Record<string, unknown>;

      if (typeof statusObj.key === "string" && statusObj.key.trim()) {
        return statusObj.key.trim();
      }

      if (typeof statusObj.label === "string" && statusObj.label.trim()) {
        return statusObj.label.trim();
      }

      // Some payloads send status as a dynamic map, e.g. { Due: true }.
      const truthyEntry = Object.entries(statusObj).find(([, value]) =>
        Boolean(value),
      );
      if (truthyEntry && truthyEntry[0].trim()) {
        return truthyEntry[0].trim();
      }

      const firstEntry = Object.keys(statusObj)[0];
      if (typeof firstEntry === "string" && firstEntry.trim()) {
        return firstEntry.trim();
      }
    }

    return "Unknown";
  };

  const getCustomerName = () => {
    const customerValue =
      raw.customerName ?? raw.customer ?? raw.buyerName ?? raw.customerDetails;

    if (typeof customerValue === "string") {
      return customerValue;
    }

    if (customerValue && typeof customerValue === "object") {
      const customer = customerValue as Record<string, unknown>;
      const firstName =
        typeof customer.firstName === "string" ? customer.firstName.trim() : "";
      const lastName =
        typeof customer.lastName === "string" ? customer.lastName.trim() : "";
      const fullName = `${firstName} ${lastName}`.trim();

      if (fullName) {
        return fullName;
      }

      if (typeof customer.name === "string" && customer.name.trim()) {
        return customer.name.trim();
      }
    }

    return "Unknown customer";
  };

  const amountRaw =
    raw.totalAmount || raw.total || raw.invoiceTotal || raw.amount || 0;

  const amount =
    typeof amountRaw === "number" ? amountRaw : Number(amountRaw || 0);

  return {
    id: String(raw.id || raw.invoiceId || raw.uid || `invoice-${index}`),
    invoiceNumber: String(
      raw.invoiceNumber || raw.invoiceNo || raw.number || "N/A",
    ),
    status: getStatus(),
    customerName: getCustomerName(),
    currency: String(raw.currency || raw.currencyCode || "GBP"),
    totalAmount: Number.isFinite(amount) ? amount : 0,
    createdDate:
      typeof raw.createdDate === "string"
        ? raw.createdDate
        : typeof raw.createdAt === "string"
          ? raw.createdAt
          : undefined,
    dueDate: typeof raw.dueDate === "string" ? raw.dueDate : undefined,
  };
}

function parseInvoiceResponse(
  payload: unknown,
  fallbackPageNum: number,
  fallbackPageSize: number,
): InvoiceListResult {
  // Expected structure: { data: InvoiceItem[], paging: { pageNumber, pageSize, totalRecords } }
  const response =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  // Extract data array
  const dataArray = Array.isArray(response.data) ? response.data : [];
  const rows: InvoiceRow[] = dataArray
    .filter((item) => item && typeof item === "object")
    .map((item, idx) =>
      normalizeInvoiceItem(item as Record<string, unknown>, idx),
    );

  // Extract paging information
  const paging =
    response.paging && typeof response.paging === "object"
      ? (response.paging as Record<string, unknown>)
      : {};

  const pageNumRaw = paging.pageNumber ?? fallbackPageNum;
  const pageSizeRaw = paging.pageSize ?? fallbackPageSize;
  const totalRaw = paging.totalRecords ?? rows.length;

  const parsedPageNum = Number(pageNumRaw);
  const parsedPageSize = Number(pageSizeRaw);
  const parsedTotal = Number(totalRaw);

  const pageNum =
    Number.isFinite(parsedPageNum) && parsedPageNum > 0
      ? parsedPageNum
      : fallbackPageNum;
  const pageSize =
    Number.isFinite(parsedPageSize) && parsedPageSize > 0
      ? parsedPageSize
      : fallbackPageSize;
  const totalRecords =
    Number.isFinite(parsedTotal) && parsedTotal >= 0
      ? parsedTotal
      : rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  return {
    items: rows,
    pageNum,
    pageSize,
    totalRecords,
    totalPages,
  };
}

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-GB");
}

function getStatusBadgeClasses(status: string): string {
  const normalizedStatus = status.toLowerCase();

  switch (normalizedStatus) {
    case "paid":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "due":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "overdue":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "cancelled":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    case "rejected":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";
  }
}

export default function InvoiceListView() {
  const [items, setItems] = useState<InvoiceRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<InvoiceSortBy>(DEFAULT_QUERY.sortBy);
  const [ordering, setOrdering] = useState<InvoiceOrdering>(
    DEFAULT_QUERY.ordering,
  );
  const [pageNum, setPageNum] = useState(DEFAULT_QUERY.pageNum);
  const [pageSize, setPageSize] = useState(DEFAULT_QUERY.pageSize);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const query = useMemo<InvoiceQueryParams>(
    () => ({
      keyword: keyword || undefined,
      status: status || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      sortBy,
      ordering,
      pageNum,
      pageSize,
    }),
    [fromDate, keyword, ordering, pageNum, pageSize, sortBy, status, toDate],
  );

  useEffect(() => {
    let cancelled = false;

    const loadInvoices = async () => {
      setLoading(true);
      setError(null);

      const result = await invoiceApi.getAllWithQuery<unknown>(query);

      if (cancelled) {
        return;
      }

      if (result.error) {
        setError(result.error);
        setItems([]);
        setLoading(false);
        return;
      }

      const parsed = parseInvoiceResponse(result.data, pageNum, pageSize);
      setItems(parsed.items);
      setTotalPages(parsed.totalPages);
      setTotalRecords(parsed.totalRecords);
      setLoading(false);
    };

    loadInvoices().catch((err) => {
      if (!cancelled) {
        setError(
          err instanceof Error ? err.message : "Failed to load invoices",
        );
        setItems([]);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pageNum, pageSize, query, refreshTrigger]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPageNum(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (pageNum > 3) pages.push("...");
    const start = Math.max(2, pageNum - 1);
    const end = Math.min(totalPages - 1, pageNum + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (pageNum < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const clearFilters = () => {
    setKeywordInput("");
    setKeyword("");
    setStatus("");
    setFromDate("");
    setToDate("");
    setSortBy(DEFAULT_QUERY.sortBy);
    setOrdering(DEFAULT_QUERY.ordering);
    setPageNum(1);
    setPageSize(DEFAULT_QUERY.pageSize);
  };

  const applyHeaderSort = (column: InvoiceSortBy) => {
    if (sortBy === column) {
      setOrdering((prev) =>
        prev === "ASCENDING" ? "DESCENDING" : "ASCENDING",
      );
    } else {
      setSortBy(column);
      setOrdering("ASCENDING");
    }
    setPageNum(1);
  };

  const renderSortButtons = (column: InvoiceSortBy) => (
    <span className="ml-2 inline-flex items-center gap-1 align-middle">
      <button
        type="button"
        aria-label={`Toggle ${column} sort order`}
        onClick={() => applyHeaderSort(column)}
        className={`cursor-pointer rounded px-1 text-[10px] leading-none transition ${
          sortBy === column
            ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
        }`}
      >
        {sortBy === column ? (
          ordering === "ASCENDING" ? (
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="h-3.5 w-3.5"
            >
              <path
                d="M10 4l-4 4m4-4l4 4M10 4v12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="h-3.5 w-3.5"
            >
              <path
                d="M10 16l-4-4m4 4l4-4M10 16V4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )
        ) : (
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className="h-3.5 w-3.5"
          >
            <path
              d="M10 4l-3 3m3-3l3 3M10 4v12M10 16l-3-3m3 3l3-3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </span>
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Invoices
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Search, filter, and view your previously created invoices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Create Invoice
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Search by invoice number
          </label>
          <input
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="e.g. IV1649318870503"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Status
          </label>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPageNum(1);
            }}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">All</option>
            <option value="Due">Due</option>
            <option value="Overdue">Overdue</option>
            <option value="Paid">Paid</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            From date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setPageNum(1);
            }}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            To date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setPageNum(1);
            }}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={clearFilters}
            className="cursor-pointer w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Invoice #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <span className="inline-flex items-center">
                    Status
                    {renderSortButtons("STATUS")}
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <span className="inline-flex items-center">
                    Created
                    {renderSortButtons("CREATED_DATE")}
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <span className="inline-flex items-center">
                    Due
                    {renderSortButtons("DUE_DATE")}
                  </span>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <span className="inline-flex items-center justify-end">
                    Total
                    {renderSortButtons("TOTAL_AMOUNT")}
                  </span>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-900 dark:bg-zinc-950">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    Loading invoices...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-red-600 dark:text-red-400"
                  >
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    No invoices found for the current filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/70"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {item.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                      {item.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClasses(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                      {formatDate(item.createdDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                      {formatDate(item.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-zinc-900 dark:text-zinc-100">
                      {formatMoney(item.totalAmount, item.currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <Link
                        href={`/invoices/${item.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Page {pageNum} of {totalPages} &middot; {totalRecords} total
          </p>
          <select
            value={String(pageSize)}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPageNum(1);
            }}
            className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={pageNum <= 1 || loading}
            onClick={() => setPageNum((prev) => Math.max(1, prev - 1))}
            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 enabled:hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:enabled:hover:bg-zinc-900"
          >
            Previous
          </button>
          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-2 text-sm text-zinc-400"
              >
                &hellip;
              </span>
            ) : (
              <button
                key={page}
                type="button"
                disabled={loading}
                onClick={() => setPageNum(page)}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  pageNum === page
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                }`}
              >
                {page}
              </button>
            ),
          )}
          <button
            type="button"
            disabled={pageNum >= totalPages || loading}
            onClick={() => setPageNum((prev) => Math.min(totalPages, prev + 1))}
            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 enabled:hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:enabled:hover:bg-zinc-900"
          >
            Next
          </button>
        </div>
      </div>

      <CreateInvoiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
        }}
      />
    </section>
  );
}
