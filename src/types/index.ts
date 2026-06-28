export type InvoiceOrdering = "ASCENDING" | "DESCENDING";

export type InvoiceSortBy =
  | "INVOICE_DATE"
  | "STATUS"
  | "TOTAL_AMOUNT"
  | "DUE_AMOUNT"
  | "DUE_DATE"
  | "CREATED_DATE";

export interface InvoiceQueryParams {
  fromDate?: string;
  toDate?: string;
  pageSize?: number;
  pageNum?: number;
  ordering?: InvoiceOrdering;
  sortBy?: InvoiceSortBy;
  status?: string;
  keyword?: string;
}

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  status: string;
  customerName: string;
  currency: string;
  totalAmount: number;
  createdDate?: string;
  dueDate?: string;
}

export interface InvoiceListResult {
  items: InvoiceRow[];
  pageNum: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface UserProfileResponse {
  memberships?: Array<{
    token?: string;
    organisationId?: string;
    userId?: string;
    roleId?: string;
  }>;
  data?: {
    memberships?: Array<{
      token?: string;
      organisationId?: string;
      userId?: string;
      roleId?: string;
    }>;
  };
}

// Invoice creation types
export interface BankAccount {
  bankId?: string;
  sortCode: string;
  accountNumber: string;
  accountName: string;
}

export interface CustomerContact {
  email: string;
  mobileNumber?: string;
}

export interface CustomerAddress {
  premise: string;
  countryCode: string;
  postcode: string;
  county?: string;
  city: string;
  addressType: "BILLING" | "SHIPPING";
}

export interface Customer {
  firstName: string;
  lastName: string;
  contact: CustomerContact;
  addresses: CustomerAddress[];
}

export interface CustomField {
  key: string;
  value: string;
}

export interface InvoiceExtension {
  addDeduct: "ADD" | "DEDUCT";
  value: number;
  type: "PERCENTAGE" | "FIXED_VALUE";
  name: string;
}

export interface InvoiceItem {
  itemReference?: string;
  description: string;
  quantity: number;
  rate: number;
  itemName: string;
  itemUOM?: string;
  customFields?: CustomField[];
  extensions?: InvoiceExtension[];
}

export interface InvoicePaging {
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
}

export interface InvoiceResponse {
  data: InvoiceItem[];
  paging: InvoicePaging;
}

export interface InvoiceDocument {
  documentId: string;
  documentName: string;
  documentUrl: string;
}

export interface InvoiceCreatePayload {
  bankAccount?: BankAccount;
  customer: Customer;
  documents?: InvoiceDocument[];
  invoiceReference?: string;
  invoiceNumber: string;
  currency: string;
  invoiceDate: string;
  dueDate: string;
  description?: string;
  customFields?: CustomField[];
  extensions?: InvoiceExtension[];
  items: InvoiceItem[];
}

export interface InvoiceCreateRequest {
  invoices: InvoiceCreatePayload[];
}

export interface InvoiceCreateResponse {
  status?: string;
  data?: unknown;
  message?: string;
}
