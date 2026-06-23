import React, { useState } from "react";
import { Product, PaymentMethod, TransactionItem, StoreSettings, PaymentDetail } from "../types";
import { Trash2, ShoppingBag, Plus, Minus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PaymentModal from "./PaymentModal";

interface CartProps {
  cartItems: TransactionItem[];
  paymentMethods: PaymentMethod[];
  storeSettings: StoreSettings;
  onUpdateQty: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  onCheckout: (payments: PaymentDetail[]) => void;
}

export default function Cart({
  cartItems,
  paymentMethods,
  storeSettings,
  onUpdateQty,
  onClearCart,
  onCheckout
}: CartProps) {
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const formatPrice = (v: number): string => {
    return parseFloat(v.toFixed(2)).toString();
  };

  const calculateCartTotals = () => {
    let subtotalNoTax = 0; 
    let accumulatedTax = 0;
    
    const vatRate = storeSettings.taxRate / 100;

    cartItems.forEach((item) => {
      const totalAmount = item.price * item.quantity;
      if (item.isTaxInclusive) {
        const taxShare = totalAmount - (totalAmount / (1 + vatRate));
        accumulatedTax += taxShare;
        subtotalNoTax += (totalAmount - taxShare);
      } else {
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

  return (
    <div id="shopping-cart-panel" className="bg-white border border-stone-200 rounded-lg p-5 flex flex-col h-full shadow-sm">
      
      <div className="flex justify-between items-center border-b border-stone-200 pb-3 mb-3">
        <h3 className="text-lg font-bold text-stone-800">Order Summary</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-stone-400 gap-2">
            <ShoppingBag className="w-8 h-8" />
            <span className="text-xs">Your shopping cart is empty</span>
          </div>
        ) : (
          <div className="w-full text-sm">
            <div className="grid grid-cols-5 py-2 border-b border-stone-200 text-stone-600 font-medium bg-stone-100 px-2">
                <div>Item</div>
                <div>Price</div>
                <div>Quantity</div>
                <div>Total</div>
                <div className="text-right">Actions</div>
            </div>
            {cartItems.map((item) => (
                <div key={item.productId} className="grid grid-cols-5 py-3 border-b border-stone-100 items-center px-2">
                    <div className="font-medium text-stone-800">{item.name}</div>
                    <div className="font-mono">{formatPrice(item.price)}</div>
                    <div>{item.quantity}</div>
                    <div className="font-mono font-bold">{formatPrice(item.price * item.quantity)}</div>
                    <div className="text-right flex justify-end">
                        <button onClick={() => onUpdateQty(item.productId, 0)} className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-stone-200 pt-3 mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span className="font-mono font-bold">☲ {formatPrice(totals.netAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT (15.0%):</span>
          <span className="font-mono font-bold">☲ {formatPrice(totals.taxAmount)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t border-stone-200 pt-2">
          <span>Total:</span>
          <span className="font-mono">☲ {formatPrice(totals.totalAmount)}</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button 
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded flex items-center justify-center gap-2"
        >
            Pay
        </button>
        <button 
            onClick={onClearCart}
            className="w-full bg-orange-800 hover:bg-orange-900 text-white font-bold py-3 rounded"
        >
            Clear / New Order
        </button>
      </div>

      <PaymentModal 
        total={totals.totalAmount}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPay={(method, cashAmount) => { 
            const payments: PaymentDetail[] = [];
            if (cashAmount && cashAmount > 0) {
                const cashMethod = paymentMethods.find(p => p.name.toLowerCase().includes("cash"));
                payments.push({
                    methodId: cashMethod?.id || 'cash',
                    methodName: 'Cash',
                    amount: cashAmount
                });
                if (totals.totalAmount > cashAmount) {
                     payments.push({
                        methodId: method.id,
                        methodName: method.name,
                        amount: totals.totalAmount - cashAmount
                    });
                }
            } else {
                payments.push({
                    methodId: method.id,
                    methodName: method.name,
                    amount: totals.totalAmount
                });
            }
            onCheckout(payments); 
            setIsPaymentModalOpen(false); 
        }}
        paymentMethods={paymentMethods}
      />
    </div>
  );
}
