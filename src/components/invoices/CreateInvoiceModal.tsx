"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import { invoiceApi } from "@/lib/api-client";
import { invoiceValidationSchema } from "@/lib/validations/invoice-schema";
import { useToast } from "@/hooks/useToast";
import type { InvoiceCreatePayload } from "@/types";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const initialValues: InvoiceCreatePayload = {
  invoiceNumber: "",
  invoiceReference: "",
  currency: "GBP",
  invoiceDate: "",
  dueDate: "",
  description: "",
  customer: {
    firstName: "",
    lastName: "",
    contact: {
      email: "",
      mobileNumber: "",
    },
    addresses: [
      {
        premise: "",
        city: "",
        postcode: "",
        countryCode: "GB",
        county: "",
        addressType: "BILLING",
      },
    ],
  },
  bankAccount: {
    accountName: "",
    accountNumber: "",
    sortCode: "",
    bankId: "",
  },
  items: [
    {
      itemName: "",
      description: "",
      quantity: 1,
      rate: 0,
      itemReference: "",
      itemUOM: "",
    },
  ],
  extensions: [],
};

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateInvoiceModalProps) {
  const { toast } = useToast();

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (
    values: InvoiceCreatePayload,
    {
      setSubmitting,
      resetForm,
    }: {
      setSubmitting: (isSubmitting: boolean) => void;
      resetForm: () => void;
    },
  ) => {
    try {
      // Clean up optional fields
      const payload: InvoiceCreatePayload = {
        ...values,
        bankAccount:
          values.bankAccount?.accountNumber &&
          values.bankAccount?.sortCode &&
          values.bankAccount?.accountName
            ? values.bankAccount
            : undefined,
        invoiceReference: values.invoiceReference || undefined,
        description: values.description || undefined,
        customer: {
          ...values.customer,
          contact: {
            ...values.customer.contact,
            mobileNumber: values.customer.contact.mobileNumber || undefined,
          },
          addresses: values.customer.addresses.map((addr) => ({
            ...addr,
            county: addr.county || undefined,
          })),
        },
        items: values.items.map((item) => ({
          ...item,
          itemReference: item.itemReference || undefined,
          itemUOM: item.itemUOM || undefined,
        })),
      };

      const result = await invoiceApi.create({ invoices: [payload] });

      if (result.error) {
        toast.error(result.error);
        setSubmitting(false);
        return;
      }

      // Success!
      toast.success("Invoice created successfully!");
      onSuccess(); // Refresh the invoice list immediately
      resetForm();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create invoice";
      toast.error(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Create New Invoice
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              aria-label="Close"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={invoiceValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="p-6">
              {/* Invoice Details Section */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Invoice Details
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Invoice Number <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="invoiceNumber"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Enter invoice number"
                    />
                    <ErrorMessage
                      name="invoiceNumber"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Invoice Reference
                    </label>
                    <Field
                      name="invoiceReference"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Optional reference number"
                    />
                    <ErrorMessage
                      name="invoiceReference"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="select"
                      name="currency"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <option value="GBP">GBP - British Pound</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="VND">VND - Vietnamese Dong</option>
                    </Field>
                    <ErrorMessage
                      name="currency"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Invoice Date <span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="date"
                      name="invoiceDate"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <ErrorMessage
                      name="invoiceDate"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="date"
                      name="dueDate"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <ErrorMessage
                      name="dueDate"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Description
                    </label>
                    <Field
                      as="textarea"
                      name="description"
                      rows={2}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Optional invoice description"
                    />
                    <ErrorMessage
                      name="description"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Information Section */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Customer Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="customer.firstName"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Enter customer first name"
                    />
                    <ErrorMessage
                      name="customer.firstName"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="customer.lastName"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Enter customer last name"
                    />
                    <ErrorMessage
                      name="customer.lastName"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="email"
                      name="customer.contact.email"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Enter customer email address"
                    />
                    <ErrorMessage
                      name="customer.contact.email"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="customer.contact.mobileNumber"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Enter customer mobile number"
                    />
                    <ErrorMessage
                      name="customer.contact.mobileNumber"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Address Section */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Billing Address
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Building/Premise <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="customer.addresses[0].premise"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Enter street address"
                    />
                    <ErrorMessage
                      name="customer.addresses[0].premise"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="customer.addresses[0].city"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Enter city name"
                    />
                    <ErrorMessage
                      name="customer.addresses[0].city"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      County
                    </label>
                    <Field
                      name="customer.addresses[0].county"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Optional county or state"
                    />
                    <ErrorMessage
                      name="customer.addresses[0].county"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Postcode <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="customer.addresses[0].postcode"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Enter postcode"
                    />
                    <ErrorMessage
                      name="customer.addresses[0].postcode"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Country Code <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="select"
                      name="customer.addresses[0].countryCode"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <option value="GB">GB - United Kingdom</option>
                      <option value="US">US - United States</option>
                      <option value="VN">VN - Vietnam</option>
                      <option value="FR">FR - France</option>
                      <option value="DE">DE - Germany</option>
                    </Field>
                    <ErrorMessage
                      name="customer.addresses[0].countryCode"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Account Section (Optional) */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Bank Account{" "}
                  <span className="text-xs font-normal text-zinc-500">
                    (Optional)
                  </span>
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Account Name
                    </label>
                    <Field
                      name="bankAccount.accountName"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Optional account holder name"
                    />
                    <ErrorMessage
                      name="bankAccount.accountName"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Account Number
                    </label>
                    <Field
                      name="bankAccount.accountNumber"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Optional account number"
                    />
                    <ErrorMessage
                      name="bankAccount.accountNumber"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Sort Code
                    </label>
                    <Field
                      name="bankAccount.sortCode"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Optional sort code"
                    />
                    <ErrorMessage
                      name="bankAccount.sortCode"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Bank ID
                    </label>
                    <Field
                      name="bankAccount.bankId"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Optional"
                    />
                    <ErrorMessage
                      name="bankAccount.bankId"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>
                </div>
              </div>

              {/* Line Item Section */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Line Item
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="items[0].itemName"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Enter product or service name"
                    />
                    <ErrorMessage
                      name="items[0].itemName"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="textarea"
                      name="items[0].description"
                      rows={2}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Enter item description"
                    />
                    <ErrorMessage
                      name="items[0].description"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="number"
                      name="items[0].quantity"
                      min="1"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Enter quantity"
                    />
                    <ErrorMessage
                      name="items[0].quantity"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Rate <span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="number"
                      name="items[0].rate"
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Enter unit price"
                    />
                    <ErrorMessage
                      name="items[0].rate"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Item Reference <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="items[0].itemReference"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Enter item reference code"
                    />
                    <ErrorMessage
                      name="items[0].itemReference"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Unit of Measure
                    </label>
                    <Field
                      name="items[0].itemUOM"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Optional unit (e.g., KG, PCS)"
                    />
                    <ErrorMessage
                      name="items[0].itemUOM"
                      component="div"
                      className="mt-1 text-xs text-red-600"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  {isSubmitting ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
