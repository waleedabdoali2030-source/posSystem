import React, { useState, useEffect } from "react";
import { Transaction, StoreSettings } from "../types";
import { dbService } from "../lib/db";
import { FileText, Printer } from "lucide-react";

interface Props {
  onReprint: (tx: Transaction) => void;
  activeDayId?: string;
}

export default function TransactionHistory({ onReprint, activeDayId }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [activeDayId]);

  const loadTransactions = async () => {
    setLoading(true);
    if (!activeDayId) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    const txs = await dbService.getTransactions(activeDayId);
    setTransactions(txs);
    setLoading(false);
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-natural-border p-6 h-full overflow-y-auto">
      <h2 className="text-xl font-black mb-6 text-natural-text">Recent Invoices</h2>
      {transactions.length === 0 ? (
        <p className="text-sm text-natural-muted">No transactions found.</p>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex justify-between items-center p-4 rounded-xl bg-natural-light-bg border border-natural-border">
              <div>
                <p className="font-bold text-natural-text">Receipt #{tx.receiptNo}</p>
                <p className="text-xs text-natural-muted font-mono">{new Date(tx.timestamp).toLocaleString()}</p>
                <p className="font-semibold text-natural-accent">{tx.totalAmount.toFixed(2)} SAR</p>
              </div>
              <button
                onClick={() => onReprint(tx)}
                className="flex items-center gap-2 bg-natural-accent text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-natural-accent-hover transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Reprint
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
