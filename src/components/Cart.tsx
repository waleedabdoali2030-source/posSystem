/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Product, PaymentMethod, TransactionItem, StoreSettings } from "../types";
import { Trash2, ShoppingBag, Plus, Minus, CreditCard, Coins, Wallet, Smartphone, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CartProps {
  cartItems: TransactionItem[];
  paymentMethods: PaymentMethod[];
  storeSettings: StoreSettings;
  onUpdateQty: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  onCheckout: (method: PaymentMethod) => void;
}

export default function Cart({
  cartItems,
  paymentMethods,
  storeSettings,
  onUpdateQty,
  onClearCart,
  onCheckout
}: CartProps) {
  
  const formatPrice = (v: number): string => {
    return parseFloat(v.toFixed(2)).toString();
  };

  // Computations for active items considering Saudi 15% VAT Tax inclusive vs exclusive rules
  const calculateCartTotals = () => {
    let subtotalNoTax = 0; // Exclude tax for calculation
    let accumulatedTax = 0;
    
    // Default VAT rate (Customizable via settings, e.g., 15)
    const vatRate = storeSettings.taxRate / 100;

    cartItems.forEach((item) => {
      const totalAmount = item.price * item.quantity;
      if (item.isTaxInclusive) {
        // Price already contains tax. Extract tax.
        // Tax = Total - (Total / (1 + Rate))
        const taxShare = totalAmount - (totalAmount / (1 + vatRate));
        accumulatedTax += taxShare;
        subtotalNoTax += (totalAmount - taxShare);
      } else {
        // Price does not contain tax. Add tax.
        // Tax = Total * Rate
        const taxShare = totalAmount * vatRate;
        accumulatedTax += taxShare;
        subtotalNoTax += totalAmount;
      }
    });

    const grandTotal = subtotalNoTax + accumulatedTax;

    return {
      netAmount: parseFloat(subtotalNoTax.toFixed(2)),
      taxAmount: parseFloat(accumulatedTax.toFixed(2)),
      totalAmount: parseFloat(grandTotal.toFixed(2))
    };
  };

  const totals = calculateCartTotals();
  const isEmpty = cartItems.length === 0;

  // Render associated pay icon based on string
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Coins": return <Coins className="w-4.5 h-4.5" />;
      case "Wallet": return <Wallet className="w-4.5 h-4.5" />;
      case "Smartphone": return <Smartphone className="w-4.5 h-4.5" />;
      default: return <CreditCard className="w-4.5 h-4.5" />;
    }
  };

  return (
    <div id="shopping-cart-panel" className="bg-white border border-natural-border rounded-3xl p-5 flex flex-col h-full h-[70vh] lg:h-[80vh] shadow-sm">
      
      {/* 1. CART HEADER */}
      <div className="flex justify-between items-center border-b border-natural-border pb-3 mb-3">
        <h3 className="text-sm font-bold text-natural-text flex items-center gap-2 font-sans">
          <ShoppingBag className="w-4.5 h-4.5 text-natural-accent" />
          <span>Current Active Bill</span>
        </h3>
        {!isEmpty && (
          <button 
            onClick={onClearCart}
            className="text-natural-muted hover:text-rose-500 p-1.5 hover:bg-natural-light-bg rounded-lg transition active:scale-95 text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* 2. CHRONOLOGICAL LIST OF ITEMS SELECTED */}
      <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[25vh]">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-natural-muted gap-2">
            <ShoppingBag className="w-8 h-8 text-natural-border animate-pulse" />
            <span className="text-xs font-semibold">Your shopping cart is empty</span>
            <span className="text-[10px] text-natural-muted font-mono">Tap products on the left to fill billing list.</span>
          </div>
        ) : (
          <AnimatePresence>
            {cartItems.map((item) => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                key={item.productId}
                className="bg-natural-light-bg/50 p-2.5 rounded-xl border border-natural-border flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 space-y-1 text-right">
                  <span className="font-semibold text-natural-text line-clamp-1">{item.name}</span>
                  <div className="flex gap-2 text-[10px] text-natural-muted">
                    <span className="font-mono">{formatPrice(item.price)} SAR</span>
                    <span>&bull;</span>
                    {item.isTaxInclusive ? (
                      <span className="text-emerald-600 font-bold">No extra VAT</span>
                    ) : (
                      <span className="text-natural-muted">+ VAT</span>
                    )}
                  </div>
                </div>

                {/* Qty controller inputs */}
                <div className="flex items-center gap-2 bg-white border border-natural-border rounded-lg px-2 py-1 self-center shadow-sm">
                  <button 
                    onClick={() => onUpdateQty(item.productId, item.quantity - 1)}
                    className="text-natural-muted hover:text-natural-text transition cursor-pointer p-0.5"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-natural-text font-mono text-center w-5">{item.quantity}</span>
                  <button 
                    onClick={() => onUpdateQty(item.productId, item.quantity + 1)}
                    className="text-natural-muted hover:text-natural-text transition cursor-pointer p-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right font-mono font-bold text-natural-text min-w-[50px]">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 3. INVOICE AGGREGATIONS SECTION */}
      <div className="border-t border-natural-border pt-3.5 mt-3 space-y-2.5">
        <div className="flex justify-between items-center text-xs text-natural-muted">
          <span>Taxable Net:</span>
          <span className="font-mono text-sm font-semibold text-natural-text">{formatPrice(totals.netAmount)} SAR</span>
        </div>
        <div className="flex justify-between items-center text-xs text-natural-muted">
          <span>VAT (15%):</span>
          <span className="font-mono text-sm font-semibold text-natural-coral">+{formatPrice(totals.taxAmount)} SAR</span>
        </div>
        <div className="border-t border-dashed border-natural-border my-1" />
        <div className="flex justify-between items-center text-sm font-bold text-natural-text">
          <span>Total Sales (Incl. VAT):</span>
          <span className="font-mono text-natural-accent text-lg font-black tracking-tight">{formatPrice(totals.totalAmount)} <span className="text-xs">SAR</span></span>
        </div>
      </div>

      {/* 4. PAYMENT PATHWAYS FOR POS CHEKCOUT */}
      <div className="mt-4.5 space-y-2 pb-1 relative">
        <span className="text-[10px] text-natural-muted uppercase tracking-widest font-bold block mb-1">Select Payment Method & Invoice</span>
        {isEmpty ? (
          <div className="bg-natural-light-bg rounded-xl p-3 border border-natural-border text-[11px] text-natural-muted font-medium flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5 text-natural-muted" />
            <span>Add products to current bill to complete the sale</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {paymentMethods.map((pm) => {
              const isCash = pm.name.toLowerCase().includes("cash");
              const btnColor = isCash 
                ? "bg-natural-accent hover:bg-natural-accent-hover text-white shadow-sm"
                : "bg-natural-teal hover:bg-natural-teal-hover text-white shadow-sm";
              return (
                <button
                  key={pm.id}
                  onClick={() => onCheckout(pm)}
                  className={`w-full font-bold py-3.5 px-4 rounded-xl flex items-center justify-between shadow transition active:scale-98 cursor-pointer ${btnColor}`}
                >
                  <span className="text-xs text-right font-bold ml-1">{pm.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest bg-black/10 px-1.5 py-0.5 rounded leading-none">TAP CH</span>
                    {getIcon(pm.icon)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
