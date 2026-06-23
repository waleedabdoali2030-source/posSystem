import React, { useState } from "react";
import { X, Tag, CreditCard, Wallet, Smartphone, Coins } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PaymentMethod } from "../types";
import CashKeypad from "./CashKeypad";

interface PaymentModalProps {
  total: number;
  isOpen: boolean;
  onClose: () => void;
  onPay: (method: PaymentMethod, cashAmount?: number) => void;
  paymentMethods: PaymentMethod[];
}

export default function PaymentModal({ total, isOpen, onClose, onPay, paymentMethods }: PaymentModalProps) {
  const [isSplit, setIsSplit] = useState(false);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [step, setStep] = useState<'cash' | 'remainder'>('cash');
  const [showCashKeypad, setShowCashKeypad] = useState(false);
  
  if (!isOpen) return null;

  const remainingAmount = isSplit ? Math.max(0, total - cashAmount) : total;

  const resetSplit = () => {
      setIsSplit(false);
      setStep('cash');
      setCashAmount(0);
      setShowCashKeypad(false);
  };

  const handleCashToggle = (val: boolean) => {
    setIsSplit(val);
    setStep('cash');
    setCashAmount(0);
  };

  const handlePaySelection = (pm: PaymentMethod) => {
    if (pm.name.toLowerCase().includes("cash") || pm.name.includes("نقد")) {
      setShowCashKeypad(true);
    } else {
      onPay(pm, isSplit ? cashAmount : undefined);
    }
  };

  const handleCashConfirm = (cashReceived: number, changeGiven: number) => {
      // In a real app we might need to handle changeGiven
      const cashMethod = paymentMethods.find(pm => pm.name.toLowerCase().includes("cash") || pm.name.includes("نقد"));
      if (cashMethod) {
          onPay(cashMethod, cashReceived);
      }
      setShowCashKeypad(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-medium text-stone-700 mb-6">Payment</h2>
          
          <div className="flex gap-2 mb-6">
            <button className="bg-cyan-400 hover:bg-cyan-500 text-white font-medium px-4 py-2 rounded flex items-center gap-2 text-sm">
              <Tag className="w-4 h-4" /> Apply Discount
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4 text-sm text-zinc-700">
            <input 
              type="checkbox" 
              checked={isSplit}
              onChange={(e) => handleCashToggle(e.target.checked)}
              className="w-4 h-4" 
            />
            <span>Split Payment (Cash + Other)</span>
          </div>

          {isSplit && step === 'cash' && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Cash Amount</label>
              <input 
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                className="w-full border rounded p-2 mb-4"
                placeholder="Enter cash amount"
              />
              <button 
                onClick={() => setStep('remainder')}
                disabled={cashAmount <= 0 || cashAmount >= total}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded disabled:bg-zinc-300"
              >
                  Next: Select Remainder Method ({remainingAmount.toFixed(2)})
              </button>
            </div>
          )}

          {(!isSplit || step === 'remainder') && (
            <div className="grid grid-cols-2 gap-3 mb-6">
                {(isSplit ? paymentMethods.filter(pm => !pm.name.toLowerCase().includes("cash") && !pm.name.includes("نقد")) : paymentMethods).map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => handlePaySelection(pm)}
                    className="border border-zinc-200 rounded p-4 flex flex-col items-center justify-center gap-2 hover:border-zinc-400 transition"
                  >
                    {pm.name.includes("Cash") || pm.name.includes("نقد") && <Coins className="w-8 h-8 text-green-600" />}
                    {pm.name.includes("Visa") && <CreditCard className="w-8 h-8 text-blue-600" />}
                    {pm.name.includes("Mastercard") && <CreditCard className="w-8 h-8 text-orange-400" />}
                    {pm.name.includes("Mada") && <Wallet className="w-8 h-8 text-zinc-600" />}
                    <span className="text-sm font-medium">{pm.name}</span>
                  </button>
                ))}
            </div>
          )}

          {isSplit && step === 'remainder' && (
               <button onClick={() => setStep('cash')} className="w-full text-blue-600 text-sm font-medium mb-6 underline">Back to Cash Entry</button>
          )}

          { !isSplit && (
            <button
              onClick={() => onPay(paymentMethods[0])} // Default take first for now
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded flex items-center justify-center gap-2"
            >
              <span>PAY ({total})</span>
            </button>
          )}

          {isSplit && (
              <div className="font-bold text-lg text-center mt-2">
                  Remaining: {remainingAmount.toFixed(2)}
              </div>
          )}
          
          {showCashKeypad && (
              <CashKeypad totalAmount={isSplit ? cashAmount : total} onConfirm={handleCashConfirm} onClose={() => setShowCashKeypad(false)} />
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
