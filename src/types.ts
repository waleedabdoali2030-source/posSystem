/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StoreSettings {
  phone: string;
  address: string;
  receiptHeader: string;
  receiptFooter: string;
  taxNumber: string; // KSA VAT Number (15 digits)
  taxRate: number;   // KSA VAT Rate: default 15%
}

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind bg color class or HEX (e.g., 'bg-rose-500')
}

export interface Product {
  id: string;
  name: string;
  price: number;
  isTaxInclusive: boolean; // VAT calculation flag
  categoryId: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;  // Lucide Icon name (e.g., 'CreditCard', 'Coins')
  color: string; // Tailwind text or bg color
  isDefault?: boolean;
}

export interface TransactionItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  isTaxInclusive: boolean;
  taxAmount: number;   // Computed tax size in SAR
  totalAmount: number; // Gross amount in SAR (price * qty)
}

export interface Transaction {
  id: string;
  receiptNo: number; // Daily sequence starting at 1
  items: TransactionItem[];
  netAmount: number;   // Cumulative net before tax (SAR)
  taxAmount: number;   // Cumulative tax amount (SAR)
  totalAmount: number; // Total invoice amount with tax (SAR)
  paymentMethodId: string;
  paymentMethodName: string;
  cashAmountReceived?: number; // Nullable if payment != cash
  cashChangeGiven?: number;    // Nullable if payment != cash
  timestamp: string; // ISO String
  dayId: string; // Associated shift ID
}

export interface WorkDay {
  id: string;
  dateStr: string;   // Today's date e.g., '2026-05-21'
  openedAt: string;  // ISO timestamp
  closedAt: string | null; // ISO timestamp
  status: 'open' | 'closed';
  transactionCount: number; // Transaction counter for receipt numbers
}

export interface DaySummary {
  dayId: string;
  dateStr: string;
  openedAt: string;
  closedAt: string;
  totalTransactions: number;
  netSales: number;
  taxSales: number;
  totalSales: number;
  salesByPayment: { [paymentMethodName: string]: number };
}
