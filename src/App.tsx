/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Category, Product, PaymentMethod, TransactionItem, WorkDay, StoreSettings, Transaction, PaymentDetail } from "./types";
import { dbService } from "./lib/db";
import { isFirebaseConfigured } from "./lib/firebase";
import KeypadLogin from "./components/KeypadLogin";
import ShiftManager from "./components/ShiftManager";
import CashKeypad from "./components/CashKeypad";
import ReceiptModal from "./components/ReceiptModal";
import ProductsGrid from "./components/ProductsGrid";
import Cart from "./components/Cart";
import SettingsPanel from "./components/SettingsPanel";
import TransactionHistory from "./components/TransactionHistory";
import Footer from "./components/Footer";
import { 
  ShoppingBag, 
  Clock, 
  Settings as SettingsIcon, 
  Power, 
  LogOut, 
  CheckCircle,
  AlertTriangle,
  Play,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"pos" | "shift" | "settings" | "history">("pos");
  
  // Data State Collections
  const [currentDay, setCurrentDay] = useState<WorkDay | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  // Active Billing
  const [cartItems, setCartItems] = useState<TransactionItem[]>([]);
  
  // Modals overlays
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [cashOverlayAmount, setCashOverlayAmount] = useState<number | null>(null);

  // Load state on startup
  useEffect(() => {
    loadAppState();
  }, []);

  // Update document title
  useEffect(() => {
    if (storeSettings?.storeName) {
      document.title = storeSettings.storeName;
    } else {
      document.title = "POS System";
    }
  }, [storeSettings]);

  const loadAppState = async () => {
    const s = await dbService.getSettings();
    setStoreSettings(s);

    const activeDay = await dbService.getCurrentDay();
    setCurrentDay(activeDay);

    const cats = await dbService.getCategories();
    setCategories(cats);

    const prods = await dbService.getProducts();
    setProducts(prods);

    const pays = await dbService.getPaymentMethods();
    setPayments(pays);
  };

  // Billing Operations
  const handleAddItemToCart = (prod: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === prod.id);
      if (existing) {
        return prev.map((item) => 
          item.productId === prod.id 
            ? { ...item, quantity: item.quantity + 1, totalAmount: (item.quantity + 1) * prod.price } 
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: prod.id,
            name: prod.name,
            price: prod.price,
            quantity: 1,
            isTaxInclusive: prod.isTaxInclusive,
            taxAmount: 0, // calculated on final cart summation/totals
            totalAmount: prod.price
          }
        ];
      }
    });
  };

  const handleUpdateQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.productId !== productId));
    } else {
      setCartItems((prev) => 
        prev.map((item) => 
          item.productId === productId 
            ? { ...item, quantity, totalAmount: quantity * item.price } 
            : item
        )
      );
    }
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Checkout Operations
  const handleInitiateCheckout = (payments: PaymentDetail[]) => {
    if (cartItems.length === 0) return;

    // Calculate invoice totals
    const vatRate = (storeSettings?.taxRate || 15) / 100;
    let computedNet = 0;
    let computedTax = 0;

    const finalizeItemTax = cartItems.map((item) => {
      const itemTotal = item.price * item.quantity;
      let itemTax = 0;
      if (item.isTaxInclusive) {
        itemTax = itemTotal - (itemTotal / (1 + vatRate));
      } else {
        itemTax = itemTotal * vatRate;
      }
      return {
        ...item,
        taxAmount: parseFloat(itemTax.toFixed(2))
      };
    });

    finalizeItemTax.forEach((item) => {
      computedTax += item.taxAmount;
      if (item.isTaxInclusive) {
        computedNet += (item.price * item.quantity) - item.taxAmount;
      } else {
        computedNet += (item.price * item.quantity);
      }
    });

    const totalBillSum = computedNet + computedTax;

    // Simply finalize with the payments provided
    handleFinalizeTransaction(payments, totalBillSum);
  };

  const handleFinalizeTransaction = async (
    payments: PaymentDetail[],
    totalBill: number
  ) => {
    if (!currentDay) return;

    const vatRate = (storeSettings?.taxRate || 15) / 100;
    let netSum = 0;
    let taxSum = 0;

    const finalizedItems = cartItems.map((item) => {
      const totalAmount = item.price * item.quantity;
      let taxAmount = 0;
      if (item.isTaxInclusive) {
        taxAmount = totalAmount - (totalAmount / (1 + vatRate));
      } else {
        taxAmount = totalAmount * vatRate;
      }
      return {
        ...item,
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2))
      };
    });

    finalizedItems.forEach((it) => {
      taxSum += it.taxAmount;
      if (it.isTaxInclusive) {
        netSum += it.totalAmount - it.taxAmount;
      } else {
        netSum += it.totalAmount;
      }
    });

    // Generate transaction receipt scoped to today's work ledger count
    const receiptNo = (currentDay.transactionCount || 0) + 1;

    // Calculate main payment (first one)
    const mainPayment = payments[0];
    
    // Check if cash was part of payments to handle old logic (cashAmountReceived/Given) - simplistic for now
    const cashPayment = payments.find(p => p.methodName.toLowerCase().includes("cash"));

    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      receiptNo,
      items: finalizedItems,
      netAmount: parseFloat(netSum.toFixed(2)),
      taxAmount: parseFloat(taxSum.toFixed(2)),
      totalAmount: parseFloat(totalBill.toFixed(2)),
      payments: payments,
      cashAmountReceived: cashPayment?.amount,
      cashChangeGiven: 0, // Simplify
      timestamp: new Date().toISOString(),
      dayId: currentDay.id
    };

    setIsUnlocked(true);
    await dbService.addTransaction(transaction);
    setReceiptTx(transaction);
    setCartItems([]);
    setCashOverlayAmount(null);
    loadAppState(); // Refresh shift states limits
  };

  const handleLockSession = () => {
    setIsUnlocked(false);
  };

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text flex flex-col font-sans select-none antialiased selection:bg-natural-accent selection:text-white">
      
      {/* 1. LOCK SCREEN PASSCODE */}
      {!isUnlocked ? (
        <KeypadLogin onUnlock={() => setIsUnlocked(true)} />
      ) : (
        <>
          {/* Main Top Header Controls */}
          <header className="bg-white border-b border-natural-border px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-natural-accent rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-md">
                {storeSettings?.storeName?.charAt(0) || "W"}
              </div>
              <div>
                <h1 className="text-md font-bold tracking-tight text-natural-text">{storeSettings?.storeName || "POS Terminal"}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${isFirebaseConfigured ? "bg-emerald-500 animate-pulse" : "bg-sky-500"}`} />
                  <span className="text-[10px] uppercase font-semibold text-natural-muted font-mono">
                    {isFirebaseConfigured ? "Firebase Firestore Online" : "Sandbox Local Mode (Offline-Safe)"}
                  </span>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR & SHIFT BADGES */}
            <div className="flex items-center gap-3">
              <nav className="flex bg-natural-light-bg p-1 rounded-xl border border-natural-border">
                <button
                  onClick={() => setActiveTab("pos")}
                  className={`px-4.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition ${
                    activeTab === "pos" ? "bg-white text-natural-accent shadow-sm" : "text-natural-muted hover:text-natural-text"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>POS Terminal</span>
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-4.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition ${
                    activeTab === "history" ? "bg-white text-natural-accent shadow-sm" : "text-natural-muted hover:text-natural-text"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Invoices</span>
                </button>
                <button
                  onClick={() => setActiveTab("shift")}
                  className={`px-4.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition ${
                    activeTab === "shift" ? "bg-white text-natural-accent shadow-sm" : "text-natural-muted hover:text-natural-text"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Shift & Register</span>
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`px-4.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition ${
                    activeTab === "settings" ? "bg-white text-natural-accent shadow-sm" : "text-natural-muted hover:text-natural-text"
                  }`}
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </nav>

              {/* LOCK SYSTEM BUTTON */}
              <button 
                onClick={handleLockSession}
                className="bg-natural-light-bg hover:bg-natural-border text-natural-muted hover:text-natural-text rounded-xl p-2.5 transition active:scale-95 cursor-pointer"
                title="Lock POS Session"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </header>

          {/* 2. CHOSEN SUBVIEW LOADER */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col justify-stretch">
            {activeTab === "pos" ? (
              // terminal view
              !currentDay ? (
                // Locked terminal shift screen if register is closed
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-12 bg-white border border-natural-border rounded-3xl gap-5 shadow-md">
                  <div className="w-14 h-14 bg-natural-coral/10 border border-natural-coral/20 text-natural-coral rounded-full flex items-center justify-center animate-bounce">
                    <Power className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-natural-text mb-2">Terminal Locked</h2>
                    <p className="text-xs text-natural-muted leading-relaxed">
                      You cannot process bills or enter the POS section because the daily register is closed. Please navigate to the Shift tab to open a new work session and begin receipt numbering from 1.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("shift")}
                    className="bg-natural-accent hover:bg-natural-accent-hover text-white font-bold py-3.5 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                  >
                    <Play className="w-4.5 h-4.5 text-white font-black fill-current" />
                    <span>Go to Open Shift</span>
                  </button>
                </div>
              ) : (
                // Active Interactive Grid / Cart POS
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
                  
                  {/* Category Filter and Products Grid */}
                  <div className="lg:col-span-7 xl:col-span-8 self-stretch h-full flex flex-col justify-start">
                    <ProductsGrid 
                      products={products}
                      categories={categories}
                      onAddItem={handleAddItemToCart} 
                    />
                  </div>

                  {/* Active Sale Bill on right */}
                  <div className="lg:col-span-5 xl:col-span-4 sticky top-24 self-start">
                    {storeSettings && (
                      <Cart
                        cartItems={cartItems}
                        paymentMethods={payments}
                        storeSettings={storeSettings}
                        onUpdateQty={handleUpdateQty}
                        onClearCart={handleClearCart}
                        onCheckout={handleInitiateCheckout}
                      />
                    )}
                  </div>
                </div>
              )
            ) : activeTab === "shift" ? (
              <ShiftManager 
                currentDay={currentDay} 
                onShiftChange={loadAppState} 
              />
            ) : activeTab === "history" ? (
              <TransactionHistory onReprint={setReceiptTx} activeDayId={currentDay?.id} />
            ) : (
              <SettingsPanel onSettingsUpdate={loadAppState} />
            )}
          </main>

          {/* 3. CASH PAYMENT CALCULATOR POPUP */}
          {cashOverlayAmount !== null && (
            <CashKeypad 
              totalAmount={cashOverlayAmount}
              onClose={() => setCashOverlayAmount(null)}
              onConfirm={(recv, change) => {
                const cashMethod = payments.find(p => p.name.toLowerCase().includes("cash")) || payments[0];
                handleFinalizeTransaction([{
                    methodId: cashMethod.id,
                    methodName: cashMethod.name,
                    amount: cashOverlayAmount
                }], cashOverlayAmount);
              }}
            />
          )}

          {/* 4. POS SMALL PAPER THERMAL RECEIPT PREVIEWER */}
          {receiptTx && storeSettings && (
            <ReceiptModal 
              transaction={receiptTx}
              settings={storeSettings}
              onClose={() => setReceiptTx(null)}
            />
          )}

          {/* 5. GORGEOUS FOOTER REGISTER CLOCK */}
          <Footer />
        </>
      )}
    </div>
  );
}
