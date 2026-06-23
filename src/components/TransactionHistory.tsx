import React, { useState, useEffect, useMemo } from "react";
import { Transaction } from "../types";
import { dbService } from "../lib/db";
import { Printer, Wallet, DollarSign, Receipt, Tag } from "lucide-react";

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

  const summary = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      acc.totalSales += tx.totalAmount;
      acc.netSales += tx.netAmount;
      acc.tax += tx.taxAmount;
      (tx.payments || []).forEach(p => {
        acc.paymentMethods[p.methodName] = (acc.paymentMethods[p.methodName] || 0) + p.amount;
      });
      return acc;
    }, { totalSales: 0, netSales: 0, tax: 0, paymentMethods: {} as Record<string, number> });
  }, [transactions]);

  const getPaymentMeta = (name: string) => {
    const low = name.toLowerCase();
    if (low.includes('cash')) return { color: 'text-emerald-500', icon: DollarSign };
    if (low.includes('visa')) return { color: 'text-blue-500', icon: Tag };
    if (low.includes('master')) return { color: 'text-orange-500', icon: Tag };
    if (low.includes('mada')) return { color: 'text-zinc-600', icon: Tag };
    return { color: 'text-purple-500', icon: Wallet };
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  const handleReprint = (tx: Transaction) => {
    onReprint(tx);
  };

  const SummaryCard = () => (
    <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-6 mb-8 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Day Summary</h3>
        <button 
          onClick={() => onReprint(transactions[0])}
          className="bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-semibold py-2 px-3 rounded-lg border border-zinc-200 flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Reprint Day Bill</span>
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Sales", value: summary.totalSales, icon: Receipt, color: 'text-zinc-900' },
          { label: "Net Sales", value: summary.netSales, icon: Tag, color: 'text-zinc-900' },
          { label: "Tax", value: summary.tax, icon: Wallet, color: 'text-zinc-900' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">{label}</span>
            </div>
            <p className={`text-xl font-black ${color}`}>{value.toFixed(2)}</p>
          </div>
        ))}
        {Object.entries(summary.paymentMethods).map(([name, amount]: [string, number]) => {
          const { color, icon: Icon } = getPaymentMeta(name);
          return (
            <div key={name} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-500 mb-2">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase">{name}</span>
              </div>
              <p className={`text-xl font-black ${color}`}>{amount.toFixed(2)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-natural-border p-6 h-full overflow-y-auto">
      <h2 className="text-xl font-black mb-6 text-natural-text">Recent Invoices</h2>
      {transactions.length > 0 && <SummaryCard />}
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
