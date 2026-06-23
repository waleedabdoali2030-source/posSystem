/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { WorkDay, DaySummary } from "../types";
import { dbService } from "../lib/db";
import { Play, Power, FileText, Printer, CheckCircle, Clock } from "lucide-react";
import { motion } from "motion/react";

interface ShiftManagerProps {
  currentDay: WorkDay | null;
  onShiftChange: () => void;
}

export default function ShiftManager({ currentDay, onShiftChange }: ShiftManagerProps) {
  const [days, setDays] = useState<WorkDay[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<DaySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCloseDayConfirmOpen, setIsCloseDayConfirmOpen] = useState(false);

  const formatPrice = (v: number): string => {
    return parseFloat(v.toFixed(2)).toString();
  };

  useEffect(() => {
    loadShifts();
  }, [currentDay]);

  const loadShifts = async () => {
    const list = await dbService.getWorkDays();
    setDays(list);
    if (list.length > 0 && !currentDay) {
      // Load summary of the last closed day by default
      const lastClosed = list.find(d => d.status === 'closed');
      if (lastClosed) {
        viewSummary(lastClosed.id);
      }
    } else if (currentDay) {
      // Load current open day summary
      viewSummary(currentDay.id);
    }
  };

  const viewSummary = async (dayId: string) => {
    setIsLoading(true);
    const summary = await dbService.getDaySummary(dayId);
    setSelectedSummary(summary);
    setIsLoading(false);
  };

  const handleOpenDay = async () => {
    const today = new Date().toISOString().split("T")[0];
    await dbService.openDay(today);
    onShiftChange();
  };

  const handleCloseDay = async () => {
    if (!currentDay) return;
    await dbService.closeDay(currentDay.id);
    setIsCloseDayConfirmOpen(false);
    onShiftChange();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="shift-manager" className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 max-w-7xl mx-auto">
      <style>{`
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body * { visibility: hidden; }
          #shift-print-area, #shift-print-area * { visibility: visible; }
          #shift-print-area {
            position: absolute;
            left: 0; top: 0;
            width: 72mm;
            padding: 5mm;
            font-size: 10px;
          }
        }
      `}</style>
      
      {/* 1. SHIFT ACTION SWITCH */}
      <div className="lg:col-span-1 bg-white border border-natural-border rounded-3xl p-6 flex flex-col justify-between shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-natural-text mb-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-natural-accent" />
            <span>Daily Shift Management</span>
          </h3>
          <p className="text-xs text-natural-muted leading-relaxed mb-6">
            Open and close the daily work shift to process transactions and issue tax-compliant invoices. Opening a new shift resets the receipt sequence to number 1.
          </p>

          <div className="bg-natural-light-bg rounded-2xl p-5 border border-natural-border mb-6">
            <div className="text-xs text-natural-muted uppercase tracking-widest font-mono mb-1">REGISTER STATUS</div>
            <div className="flex items-center gap-3">
              {currentDay ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full bg-natural-teal animate-pulse" />
                  <div>
                    <span className="text-natural-teal font-bold text-lg">Open Day</span>
                    <div className="text-natural-muted font-mono text-[11px] mt-0.5">
                      Shift Started: {new Date(currentDay.openedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-3.5 h-3.5 rounded-full bg-natural-coral" />
                  <div>
                    <span className="text-natural-coral font-bold text-lg">Day Closed</span>
                    <div className="text-natural-muted text-xs mt-0.5">
                      Open register to start transactions.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {currentDay ? (
            isCloseDayConfirmOpen ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in text-center shadow-inner">
                <span className="text-xs text-red-700 font-bold leading-relaxed">
                  Are you sure you want to CLOSE the register today? Next receipt sequence starts from 1.
                </span>
                <div className="flex gap-2.5">
                  <button
                    onClick={handleCloseDay}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    Confirm Close
                  </button>
                  <button
                    onClick={() => setIsCloseDayConfirmOpen(false)}
                    className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold py-2.5 px-4 rounded-xl text-xs transition active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsCloseDayConfirmOpen(true)}
                className="w-full bg-natural-coral hover:bg-natural-coral-hover text-white font-bold py-4 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Power className="w-5 h-5" />
                <span>Close Register</span>
              </motion.button>
            )
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleOpenDay}
              className="w-full bg-natural-teal hover:bg-natural-teal-hover text-white font-bold py-4 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Play className="w-5 h-5" />
              <span>Open Day Shift</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* 2. Z-REPORT SUMMARIES PANEL */}
      <div className="lg:col-span-2 bg-white border border-natural-border rounded-3xl p-6 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-natural-text flex items-center gap-2">
              <FileText className="w-5 h-5 text-natural-accent" />
              <span>Daily Summary Report (Z-Report)</span>
            </h3>
            {selectedSummary && (
              <button 
                onClick={handlePrint}
                className="bg-natural-light-bg hover:bg-natural-border text-natural-text text-xs font-semibold py-2 px-3.5 rounded-xl border border-natural-border flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-natural-accent" />
                <span>Print Z-Report</span>
              </button>
            )}
          </div>

          {selectedSummary ? (
              <div id="shift-print-area" className="bg-white p-2 text-black font-mono">
                <div className="text-center mb-4">
                  <h4 className="font-bold text-sm">Waleed POS</h4>
                  <p className="text-[10px]">Z-REPORT</p>
                  <p className="text-[10px]">Date: {selectedSummary.dateStr} | Time: {new Date().toLocaleTimeString()}</p>
                </div>

                <div className="border-t border-b border-black py-2 mb-2">
                  <div className="flex justify-between"><span>Gross Sales:</span><span>{formatPrice(selectedSummary.totalSales + selectedSummary.taxSales)}</span></div>
                  <div className="flex justify-between"><span>Tax (VAT 15%):</span><span>{formatPrice(selectedSummary.taxSales)}</span></div>
                  <div className="flex justify-between font-bold text-xs mt-1"><span>Net Sales:</span><span>{formatPrice(selectedSummary.netSales)}</span></div>
                  <div className="flex justify-between mt-1"><span>Bills Count:</span><span>{selectedSummary.totalTransactions}</span></div>
                </div>

                <div className="mb-2">
                  <h5 className="font-bold text-[10px] border-b border-black mb-1">Payments</h5>
                  {Object.entries(selectedSummary.salesByPayment).map(([pName, data]) => {
                    const typedData = data as { total: number, count: number };
                    return (
                        <div key={pName} className="flex justify-between text-[10px]">
                            <span>{pName} ({typedData.count}):</span>
                            <span>{formatPrice(typedData.total)}</span>
                        </div>
                    );
                  })}
                </div>

                <div className="mb-2">
                  <h5 className="font-bold text-[10px] border-b border-black mb-1">Sales by Category</h5>
                  {Object.entries(selectedSummary.salesByCategory).map(([cName, amt]) => (
                    <div key={cName} className="flex justify-between text-[10px]">
                      <span>{cName}:</span>
                      <span>{formatPrice(amt as number)}</span>
                    </div>
                  ))}
                </div>
              </div>
          ) : (
            <div className="h-48 border border-dashed border-natural-border rounded-2xl flex items-center justify-center text-natural-muted text-xs">
              Select a shift ledger from historical logs to view settlement details.
            </div>
          )}
        </div>

        {/* Chronological list of past dates */}
        <div className="mt-6 border-t border-natural-border pt-4">
          <h4 className="text-xs font-bold text-natural-muted uppercase tracking-widest mb-3">Historical Ledgers</h4>
          {days.length === 0 ? (
            <span className="text-xs text-natural-muted font-mono">No historical shifts created yet.</span>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-natural-border text-natural-muted font-bold text-[10px] uppercase">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Bills</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day, index) => (
                    <tr
                      key={day.id}
                      onClick={() => viewSummary(day.id)}
                      className={`border-b border-natural-border last:border-none cursor-pointer transition ${
                        day.id === selectedSummary?.dayId
                          ? "bg-natural-accent/10"
                          : "hover:bg-natural-light-bg"
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-natural-muted">{index + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-natural-text">{day.dateStr}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          day.status === "open" 
                            ? "bg-natural-teal/15 text-natural-teal" 
                            : "bg-neutral-100 text-neutral-600"
                        }`}>
                          {day.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-natural-muted font-mono">{day.transactionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
