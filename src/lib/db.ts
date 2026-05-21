/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { StoreSettings, Category, Product, PaymentMethod, WorkDay, Transaction, DaySummary } from '../types';

// Helper to recursively strip undefined properties so Firestore doesn't reject writes
function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as any;
  }
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      cleaned[key] = cleanUndefined(val);
    }
  }
  return cleaned as T;
}

// Let's declare our default Saudi Arabia store constants
const DEFAULT_SETTINGS: StoreSettings = {
  phone: "0503189758",
  address: "King Fahd Rd, Al Olaya District, Riyadh 12211, Saudi Arabia",
  receiptHeader: "Waleed Alqadasi Retail Stores\nSimplified Tax Invoice\nTax Registration Number (VAT TRN): 300503189758003",
  receiptFooter: "Thank you for shopping with us! We look forward to seeing you again!\nDeveloped by Waleed Alqadasi | Call 0503189758",
  taxNumber: "300503189758003", // Standard 15-digit Saudi VAT ID
  taxRate: 15 // 15% Standard VAT
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Food & Drink", color: "bg-emerald-500 text-white" },
  { id: "cat-2", name: "Coffee & Sweets", color: "bg-amber-500 text-white" },
  { id: "cat-3", name: "Groceries", color: "bg-sky-500 text-white" },
  { id: "cat-4", name: "Bakery", color: "bg-orange-500 text-white" },
  { id: "cat-5", name: "Special Offers", color: "bg-rose-500 text-white" }
];

const DEFAULT_PRODUCTS: Product[] = [
  // Category 1 - Food & Drink
  { id: "prod-1", name: "Chicken Shawarma", price: 13.04, isTaxInclusive: false, categoryId: "cat-1" }, // Tax excl: 13.04 + 1.96 VAT = 15.00 SAR
  { id: "prod-2", name: "Fresh Orange Juice", price: 12.00, isTaxInclusive: true, categoryId: "cat-1" },  // Tax incl
  { id: "prod-3", name: "Gourmet Beef Burger", price: 25.00, isTaxInclusive: true, categoryId: "cat-1" },  // Tax incl

  // Category 2 - Coffee & Sweets
  { id: "prod-4", name: "Saudi Coffee Dallah", price: 17.39, isTaxInclusive: false, categoryId: "cat-2" }, // Tax excl: 17.39 + 2.61 VAT = 20.00 SAR
  { id: "prod-5", name: "Pistachio Basbousa", price: 15.00, isTaxInclusive: true, categoryId: "cat-2" }, // Tax incl
  { id: "prod-6", name: "Riyadh Date Cake", price: 18.00, isTaxInclusive: true, categoryId: "cat-2" },    // Tax incl

  // Category 3 - Groceries
  { id: "prod-7", name: "Almarai Milk 2L", price: 11.00, isTaxInclusive: true, categoryId: "cat-3" }, // Tax incl

  // Category 4 - Bakery
  { id: "prod-8", name: "Croissant Plain", price: 6.96, isTaxInclusive: false, categoryId: "cat-4" } // Tax excl: 6.96 + 1.04 VAT = 8.00 SAR
];

const DEFAULT_PAYMENTS: PaymentMethod[] = [
  { id: "pay-1", name: "mada", icon: "CreditCard", color: "bg-gradient-to-r from-blue-600 to-cyan-500 text-white", isDefault: true },
  { id: "pay-2", name: "Cash", icon: "Coins", color: "bg-emerald-600 text-white", isDefault: false },
  { id: "pay-3", name: "Visa/Mastercard", icon: "Wallet", color: "bg-indigo-600 text-white", isDefault: false }
];

// Helper to interact with Local Storage in sandboxed and offline mode
const localDb = {
  get: (key: string) => {
    try {
      const v = localStorage.getItem(`pos_${key}`);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, data: any) => {
    try {
      localStorage.setItem(`pos_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error("Local storage set fail:", e);
    }
  }
};

// INITIALIZATION
if (!localDb.get("settings")) {
  localDb.set("settings", DEFAULT_SETTINGS);
  localDb.set("categories", DEFAULT_CATEGORIES);
  localDb.set("products", DEFAULT_PRODUCTS);
  localDb.set("paymentMethods", DEFAULT_PAYMENTS);
  localDb.set("workDays", []);
  localDb.set("transactions", []);
}

// POS DATABASE SERVICES EXPORTS
export const dbService = {
  // Store Settings
  async getSettings(): Promise<StoreSettings> {
    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, "settings", "store");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data() as StoreSettings;
        } else {
          // pre-bootstrap into Firebase
          const settings = localDb.get("settings") || DEFAULT_SETTINGS;
          await setDoc(docRef, cleanUndefined(settings));
          return settings;
        }
      } catch (err) {
        console.warn("Firestore error reading settings, falling back to local storage:", err);
      }
    }
    return localDb.get("settings") || DEFAULT_SETTINGS;
  },

  async saveSettings(settings: StoreSettings): Promise<void> {
    localDb.set("settings", settings);
    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, "settings", "store");
        await setDoc(docRef, cleanUndefined(settings));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "settings/store");
      }
    }
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    if (isFirebaseConfigured) {
      try {
        const collRef = collection(db, "categories");
        const snapshot = await getDocs(collRef);
        const list: Category[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Category);
        });
        if (list.length > 0) {
          localDb.set("categories", list);
          return list;
        }
      } catch (err) {
        console.warn("Firestore error categories list, using local state:", err);
      }
    }
    return localDb.get("categories") || DEFAULT_CATEGORIES;
  },

  async saveCategory(category: Category): Promise<void> {
    const categories = await this.getCategories();
    const index = categories.findIndex(c => c.id === category.id);
    if (index >= 0) {
      categories[index] = category;
    } else {
      categories.push(category);
    }
    localDb.set("categories", categories);

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, "categories", category.id);
        const { id, ...data } = category;
        await setDoc(docRef, cleanUndefined(data));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `categories/${category.id}`);
      }
    }
  },

  async deleteCategory(id: string): Promise<void> {
    const categories = await this.getCategories();
    const updated = categories.filter(c => c.id !== id);
    localDb.set("categories", updated);

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, "categories", id);
        await deleteDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
      }
    }
  },

  // Products
  async getProducts(): Promise<Product[]> {
    if (isFirebaseConfigured) {
      try {
        const collRef = collection(db, "products");
        const snapshot = await getDocs(collRef);
        const list: Product[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Product);
        });
        if (list.length > 0) {
          localDb.set("products", list);
          return list;
        }
      } catch (err) {
        console.warn("Firestore error products list, using local state:", err);
      }
    }
    return localDb.get("products") || DEFAULT_PRODUCTS;
  },

  async saveProduct(product: Product): Promise<void> {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localDb.set("products", products);

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, "products", product.id);
        const { id, ...data } = product;
        await setDoc(docRef, cleanUndefined(data));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `products/${product.id}`);
      }
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const products = await this.getProducts();
    const updated = products.filter(p => p.id !== id);
    localDb.set("products", updated);

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, "products", id);
        await deleteDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      }
    }
  },

  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    if (isFirebaseConfigured) {
      try {
        const collRef = collection(db, "paymentMethods");
        const snapshot = await getDocs(collRef);
        const list: PaymentMethod[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as PaymentMethod);
        });
        if (list.length > 0) {
          localDb.set("paymentMethods", list);
          return list;
        }
      } catch (err) {
        console.warn("Firestore error paymentMethods list, using local state:", err);
      }
    }
    return localDb.get("paymentMethods") || DEFAULT_PAYMENTS;
  },

  async savePaymentMethod(method: PaymentMethod): Promise<void> {
    const payments = await this.getPaymentMethods();
    const index = payments.findIndex(p => p.id === method.id);
    if (index >= 0) {
      payments[index] = method;
    } else {
      payments.push(method);
    }
    localDb.set("paymentMethods", payments);

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, "paymentMethods", method.id);
        const { id, ...data } = method;
        await setDoc(docRef, cleanUndefined(data));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `paymentMethods/${method.id}`);
      }
    }
  },

  async deletePaymentMethod(id: string): Promise<void> {
    const payments = await this.getPaymentMethods();
    const updated = payments.filter(p => p.id !== id);
    localDb.set("paymentMethods", updated);

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, "paymentMethods", id);
        await deleteDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `paymentMethods/${id}`);
      }
    }
  },

  // Work Shifts (WorkDay)
  async getWorkDays(): Promise<WorkDay[]> {
    if (isFirebaseConfigured) {
      try {
        const collRef = collection(db, "workDays");
        const snapshot = await getDocs(collRef);
        const list: WorkDay[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as WorkDay);
        });
        list.sort((a, b) => b.openedAt.localeCompare(a.openedAt));
        localDb.set("workDays", list);
        return list;
      } catch (err) {
        console.warn("Firestore error workDays list, using local state:", err);
      }
    }
    const localDays = localDb.get("workDays") || [];
    localDays.sort((a: WorkDay, b: WorkDay) => b.openedAt.localeCompare(a.openedAt));
    return localDays;
  },

  async getCurrentDay(): Promise<WorkDay | null> {
    const list = await this.getWorkDays();
    const openDay = list.find(d => d.status === 'open');
    return openDay || null;
  },

  async openDay(dateStr: string): Promise<WorkDay> {
    const list = await this.getWorkDays();
    const openDay = list.find(d => d.status === 'open');
    if (openDay) {
      return openDay; // already open
    }

    const newDay: WorkDay = {
      id: `day-${Date.now()}`,
      dateStr,
      openedAt: new Date().toISOString(),
      closedAt: null,
      status: 'open',
      transactionCount: 0
    };

    list.unshift(newDay);
    localDb.set("workDays", list);

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, "workDays", newDay.id);
        const { id, ...data } = newDay;
        await setDoc(docRef, cleanUndefined(data));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workDays/${newDay.id}`);
      }
    }

    return newDay;
  },

  async closeDay(dayId: string): Promise<void> {
    const list = await this.getWorkDays();
    const dayIndex = list.findIndex(d => d.id === dayId);
    if (dayIndex >= 0) {
      list[dayIndex].status = 'closed';
      list[dayIndex].closedAt = new Date().toISOString();
      localDb.set("workDays", list);

      if (isFirebaseConfigured) {
        try {
          const docRef = doc(db, "workDays", dayId);
          const { id, ...data } = list[dayIndex];
          await setDoc(docRef, cleanUndefined(data));
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `workDays/${dayId}`);
        }
      }
    }
  },

  // Transactions (Receipts)
  async getTransactions(dayId?: string): Promise<Transaction[]> {
    if (isFirebaseConfigured) {
      try {
        const collRef = collection(db, "transactions");
        const snapshot = await getDocs(collRef);
        const list: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
        });
        if (list.length > 0) {
          list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          localDb.set("transactions", list);
          return dayId ? list.filter(t => t.dayId === dayId) : list;
        }
      } catch (err) {
        console.warn("Firestore error transactions list, using local state:", err);
      }
    }
    const localTx = localDb.get("transactions") || [];
    localTx.sort((a: Transaction, b: Transaction) => b.timestamp.localeCompare(a.timestamp));
    return dayId ? localTx.filter((t: Transaction) => t.dayId === dayId) : localTx;
  },

  async addTransaction(transaction: Transaction): Promise<void> {
    // 1. Add to localTransactions
    const txs = await this.getTransactions();
    txs.unshift(transaction);
    localDb.set("transactions", txs);

    // 2. Increment transaction counter in workday
    const list = await this.getWorkDays();
    const dayIndex = list.findIndex(d => d.id === transaction.dayId);
    if (dayIndex >= 0) {
      list[dayIndex].transactionCount = Math.max(list[dayIndex].transactionCount, transaction.receiptNo);
      localDb.set("workDays", list);

      // Save workday in firebase
      if (isFirebaseConfigured) {
        try {
          const dayDocRef = doc(db, "workDays", transaction.dayId);
          const { id, ...dayData } = list[dayIndex];
          await setDoc(dayDocRef, cleanUndefined(dayData));
        } catch (e) {
          console.error("Warn: Failed to update workday transactions count:", e);
        }
      }
    }

    // 3. Save Transaction document in Firebase
    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, "transactions", transaction.id);
        const { id, ...data } = transaction;
        await setDoc(docRef, cleanUndefined(data));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `transactions/${transaction.id}`);
      }
    }
  },

  // Summarize shifts
  async getDaySummary(dayId: string): Promise<DaySummary | null> {
    const list = await this.getWorkDays();
    const shift = list.find(d => d.id === dayId);
    if (!shift) return null;

    const txs = await this.getTransactions(dayId);
    
    let netSales = 0;
    let taxSales = 0;
    let totalSales = 0;
    const salesByPayment: { [paymentMethodName: string]: number } = {};

    txs.forEach((tx) => {
      netSales += tx.netAmount;
      taxSales += tx.taxAmount;
      totalSales += tx.totalAmount;

      const pName = tx.paymentMethodName || "Cash";
      salesByPayment[pName] = (salesByPayment[pName] || 0) + tx.totalAmount;
    });

    return {
      dayId: shift.id,
      dateStr: shift.dateStr,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt || new Date().toISOString(),
      totalTransactions: txs.length,
      netSales: parseFloat(netSales.toFixed(2)),
      taxSales: parseFloat(taxSales.toFixed(2)),
      totalSales: parseFloat(totalSales.toFixed(2)),
      salesByPayment
    };
  }
};
