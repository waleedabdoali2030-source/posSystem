/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from "react";
import { Transaction, StoreSettings } from "../types";
import { generateZatcaB64, generateQrSvg } from "../utils/qr";
import { Printer, Download, X, Check } from "lucide-react";
import { motion } from "motion/react";

interface ReceiptModalProps {
  transaction: Transaction;
  settings: StoreSettings;
  onClose: () => void;
}

export default function ReceiptModal({ transaction, settings, onClose }: ReceiptModalProps) {
  const receiptConfigRef = useRef<HTMLDivElement>(null);

  const b64Zatca = generateZatcaB64(
    settings.receiptHeader.split("\n")[0] || "Waleed Stores",
    settings.taxNumber,
    transaction.timestamp,
    transaction.totalAmount,
    transaction.taxAmount
  );

  const qrSvg = generateQrSvg(b64Zatca);

  const handlePrint = () => {
    // Elegant printing mechanism that isolated the receipt structure for thermal rolls
    const printContent = receiptConfigRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Setup printable window context
    const windowPrint = window.open("", "", "width=600,height=800");
    if (windowPrint) {
      windowPrint.document.write(`
        <html>
          <head>
            <title>Simplified Tax Invoice - Waleed POS</title>
            <style>
              body { 
                font-family: 'Inter', 'JetBrains Mono', sans-serif; 
                padding: 10px; 
                margin: 0;
                width: 76mm; /* Default 80mm thermal receipt roll width */
                color: #000;
              }
              .receipt-wrapper { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
              th, td { text-align: left; padding: 4px 0; border-bottom: 1px dashed #666; }
              th.ar, td.ar { text-align: right; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .divider { border-top: 1px dashed #000; margin: 10px 0; }
              .total-row { font-weight: bold; font-size: 13px; }
              .qr-container { display: flex; justify-content: center; margin: 15px 0; }
              .qr-container svg { width: 120px; height: 120px; }
              pre { font-family: inherit; font-size: 10px; white-space: pre-wrap; margin: 0; }
            </style>
          </head>
          <body>
            <div class="receipt-wrapper">
              ${printContent}
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `);
      windowPrint.document.close();
    }
  };

  return (
    <div id="receipt-modal-overlay" className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm shadow-xl animate-fade-in">
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="bg-white border border-natural-border p-6 rounded-3xl w-full max-w-sm flex flex-col gap-4 shadow-md overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center text-natural-text border-b border-natural-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-natural-teal" />
            <h4 className="text-sm font-bold">Invoice Saved Successfully</h4>
          </div>
          <button 
            onClick={onClose}
            className="hover:bg-natural-light-bg text-natural-muted hover:text-natural-text rounded-full p-1.5 transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* RECEIPT ROLLED PAPER MOCKUP */}
        <div className="bg-[#FAF8F5] text-zinc-950 p-5 rounded-xl font-mono text-[11px] leading-relaxed shadow-sm border border-natural-border" ref={receiptConfigRef}>
          
          {/* Header */}
          <div className="text-center space-y-1">
            <pre className="font-bold text-center leading-relaxed text-zinc-900 block font-sans whitespace-pre-wrap">
              {settings.receiptHeader || "Waleed Point Of Sale"}
            </pre>
            <div className="text-[10px] text-zinc-650 font-mono">
              Tel: {settings.phone} <br />
              {settings.address}
            </div>
          </div>

          <div className="border-t border-dashed border-zinc-400 my-3.5" />

          {/* Metadata Block */}
          <div className="space-y-1 font-mono text-[10px] text-zinc-700">
            <div className="flex justify-between">
              <span>Receipt No:</span>
              <span className="font-bold">#{transaction.receiptNo}</span>
            </div>
            <div className="flex justify-between">
              <span>Date/Time:</span>
              <span>{new Date(transaction.timestamp).toLocaleString("en-US", { hour12: true })}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT Reg. No:</span>
              <span>{settings.taxNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Type:</span>
              <span>{transaction.paymentMethodName}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-zinc-400 my-3.5" />

          {/* Items Table */}
          <table className="w-full text-left font-sans text-[10.5px]">
            <thead>
              <tr className="border-b border-dashed border-zinc-400 text-zinc-700 font-bold">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Unit Price</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {transaction.items.map((item, idx) => (
                <tr key={idx} className="border-b border-dashed border-zinc-200 text-zinc-950">
                  <td className="py-2.5 font-medium leading-tight">
                    {item.name}
                    {item.isTaxInclusive ? (
                      <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded block mt-0.5 w-fit font-semibold">15% VAT Included</span>
                    ) : (
                      <span className="text-[9px] text-blue-600 bg-blue-50 px-1 rounded block mt-0.5 w-fit font-semibold">15% VAT Exclusive</span>
                    )}
                  </td>
                  <td className="py-2.5 text-center font-mono font-medium">{item.quantity}</td>
                  <td className="py-2.5 text-right font-mono">{(item.price).toFixed(2)}</td>
                  <td className="py-2.5 text-right font-mono">{(item.totalAmount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-zinc-400 my-3.5" />

          {/* Calculations Totals list */}
          <div className="space-y-2.5 font-sans">
            <div className="flex justify-between text-zinc-700">
              <span>Taxable Net (Excl. VAT):</span>
              <span className="font-mono">{transaction.netAmount.toFixed(2)} SAR</span>
            </div>
            <div className="flex justify-between text-zinc-700">
              <span>VAT Amount (15%):</span>
              <span className="font-mono text-red-600">+{transaction.taxAmount.toFixed(2)} SAR</span>
            </div>
            
            <div className="border-t border-zinc-300 my-2" />
            
            <div className="flex justify-between items-center text-zinc-950 font-bold text-[13px]">
              <span>Invoice Total:</span>
              <span className="font-mono text-emerald-600">{(transaction.totalAmount).toFixed(2)} SAR</span>
            </div>

            {/* Cash transactions Change computations display */}
            {transaction.cashAmountReceived !== undefined && transaction.cashAmountReceived > 0 && (
              <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100 font-mono text-[10px] space-y-1">
                <div className="flex justify-between text-zinc-600">
                  <span>Cash Tendered:</span>
                  <span>{transaction.cashAmountReceived.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Change Given:</span>
                  <span>{transaction.cashChangeGiven?.toFixed(2)} SAR</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-zinc-400 my-3.5" />

          {/* ZATCA COMPLIANT QR CODE BLOCK */}
          <div className="flex flex-col items-center justify-center my-3 gap-1">
            <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-semibold">Simplified Tax Invoice QR</span>
            <div className="w-28 h-28 border border-zinc-200 p-1 bg-white rounded-lg flex items-center justify-center" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          </div>

          <div className="border-t border-dashed border-zinc-400 my-3.5" />

          {/* Receipt custom Footer specified by setting */}
          <div className="text-center">
            <pre className="font-medium text-[9px] text-zinc-650 text-center font-sans tracking-wide leading-relaxed whitespace-pre-wrap">
              {settings.receiptFooter || "Thank you!"}
            </pre>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3.5 mt-2">
          <button
            onClick={handlePrint}
            className="bg-natural-accent hover:bg-natural-accent-hover text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="bg-natural-teal hover:bg-natural-teal-hover text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
