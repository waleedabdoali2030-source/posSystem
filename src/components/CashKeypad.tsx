/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Delete, Coins, ArrowRight, X } from "lucide-react";
import { motion } from "motion/react";

interface CashKeypadProps {
  totalAmount: number;
  onConfirm: (cashReceived: number, changeGiven: number) => void;
  onClose: () => void;
}

export default function CashKeypad({ totalAmount, onConfirm, onClose }: CashKeypadProps) {
  const [cashInput, setCashInput] = useState<string>("");

  const cashVal = parseFloat(cashInput) || 0;
  const changeDue = Math.max(0, cashVal - totalAmount);

  // Shortcut cash buttons matching standard Saudi Riyal bills
  const bills = [10, 20, 50, 100, 200, 500];

  const handleKeyPress = (char: string) => {
    if (char === "." && cashInput.includes(".")) return;
    setCashInput(prev => prev + char);
  };

  const handleBillSelect = (billAmount: number) => {
    setCashInput(billAmount.toString());
  };

  const handleBackspace = () => {
    setCashInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setCashInput("");
  };

  const formatPrice = (v: number): string => {
    return parseFloat(v.toFixed(2)).toString();
  };

  const canSubmit = cashVal >= totalAmount;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm(cashVal, changeDue);
  };

  // Bind physical keyboard to numerical cash inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key >= "0" && e.key <= "9") || e.key === ".") {
        handleKeyPress(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && canSubmit) {
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cashInput, canSubmit]);

  return (
    <div id="cash-keypad-overlay" className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white border border-natural-border p-6 rounded-3xl w-full max-w-md flex flex-col gap-5 relative shadow-md"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-natural-light-bg hover:bg-natural-border text-natural-muted hover:text-natural-text rounded-full p-2 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Coins className="w-5 h-5 text-natural-teal animate-bounce" />
          <h3 className="text-md font-bold text-natural-text">Cash Payment (Cash Register)</h3>
        </div>

        {/* Amount Displays */}
        <div className="grid grid-cols-2 gap-3.5 mb-1.5 font-mono">
          <div className="bg-natural-light-bg p-3 rounded-2xl border border-natural-border">
            <span className="text-[10px] text-natural-muted block uppercase font-bold">Total Bill Amount</span>
            <span className="text-lg font-bold text-natural-text">{formatPrice(totalAmount)} <span className="text-xs text-natural-accent font-sans">SAR</span></span>
          </div>
          <div className={`p-3 rounded-2xl border transition ${canSubmit ? "bg-emerald-50 border-emerald-300" : "bg-natural-light-bg border-natural-border"}`}>
            <span className="text-[10px] text-natural-muted block uppercase font-bold">Change Due</span>
            <span className={`text-lg font-bold ${canSubmit ? "text-emerald-700" : "text-natural-text/40"}`}>
              {canSubmit ? formatPrice(changeDue) : "0"} <span className="text-xs font-sans">SAR</span>
            </span>
          </div>
        </div>

        {/* Cash Received Text Area */}
        <div className="bg-natural-light-bg border border-natural-border rounded-2xl p-4 flex flex-col">
          <span className="text-[11px] text-natural-muted font-semibold mb-1 uppercase tracking-wide">Cash Tendered</span>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold font-mono text-emerald-600">
              {cashInput || "0.00"}
            </span>
            <span className="text-sm font-semibold text-natural-muted">SAR</span>
          </div>
        </div>

        {/* Saudi Bill Quick Selection Shortcuts */}
        <div className="grid grid-cols-3 gap-2">
          {bills.map((bill) => (
            <button
              key={bill}
              onClick={() => handleBillSelect(bill)}
              className="bg-natural-light-bg hover:bg-natural-border text-emerald-700 font-mono font-bold py-2 px-3 rounded-xl border border-natural-border flex flex-col items-center justify-center text-xs transition active:scale-95 cursor-pointer"
            >
              <span>{bill} SAR</span>
              <span className="text-[10px] text-natural-muted font-medium">SAR {bill}</span>
            </button>
          ))}
        </div>

        {/* Numerical Keypad grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-11 rounded-xl bg-natural-light-bg hover:bg-natural-border text-natural-text font-mono font-bold text-md flex items-center justify-center border border-natural-border transition active:bg-natural-accent active:text-white cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-11 rounded-xl bg-natural-muted-accent/20 hover:bg-natural-muted-accent/40 text-xs font-semibold text-natural-text hover:text-natural-text flex items-center justify-center cursor-pointer transition"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress("0")}
            className="h-11 rounded-xl bg-natural-light-bg hover:bg-natural-border text-natural-text font-mono font-bold text-md flex items-center justify-center border border-natural-border cursor-pointer transition"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-11 rounded-xl bg-natural-muted-accent/20 hover:bg-natural-muted-accent/40 text-natural-text flex items-center justify-center cursor-pointer transition"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        {/* Confirmation Button */}
        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={`w-full font-bold py-3 px-5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition active:scale-98 ${
            canSubmit 
              ? "bg-natural-teal hover:bg-natural-teal-hover text-white cursor-pointer" 
              : "bg-natural-light-bg text-natural-muted cursor-not-allowed border border-natural-border"
          }`}
        >
          <span>Confirm & Print Invoice</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
