// Auth types
export interface User {
  userID: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Company {
  companyID: number;
  companyName: string;
  currencySymbol: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  company: Company;
}

// Item types
export interface Item {
  primaryKeyID: number;
  itemID: number;
  itemName: string;
  description: string | null;
  salesRate: number;
  discountPct: number;
  createdByUserName: string;
  createdOn: string;
  updatedByUserName: string;
  updatedOn: string | null;
}

export interface ItemLookup {
  itemID: number;
  itemName: string;
}

// Invoice types
export interface InvoiceLine {
  rowNo: number;
  itemID: number;
  description: string;
  quantity: number;
  rate: number;
  discountPct: number;
}

export interface Invoice {
  primaryKeyID: number;
  invoiceID: number;
  invoiceNo: number | string;
  invoiceDate: string;
  customerName: string;
  address: string | null;
  city: string | null;
  taxPercentage: number;
  notes: string | null;
  lines: InvoiceLine[];
  subTotal: number;
  taxAmount: number;
  invoiceAmount: number;
  createdByUserName: string;
  createdOn: string;
  updatedByUserName: string;
  updatedOn: string | null;
}

export interface InvoiceListItem {
  primaryKeyID: number;
  invoiceID: number;
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  subTotal: number;
  taxPercentage: number;
  taxAmount: number;
  invoiceAmount: number;
  createdByUserName: string;
  createdOn: string;
  updatedByUserName: string;
  updatedOn: string | null;
}

export interface InvoiceSummary {
  invoiceCount: number;
  totalAmount: number;
}

export interface InvoiceTrend {
  monthStart: string;
  invoiceCount: number;
  amountSum: number;
}

// API Response types
export interface ApiResponse<T = any> {
  primaryKeyID: number;
  updatedOn: string | null;
  additionalResponseData: T;
  nofRecordsEffected: number;
}
