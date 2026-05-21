/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Category, Product } from "../types";
import { dbService } from "../lib/db";
import { Tag, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProductsGridProps {
  onAddItem: (product: Product) => void;
  categories: Category[];
  products: Product[];
}

export default function ProductsGrid({ onAddItem, categories, products }: ProductsGridProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");

  const formatPrice = (v: number): string => {
    return parseFloat(v.toFixed(2)).toString();
  };

  const filteredProducts = activeCategoryId === "all" 
    ? products 
    : products.filter(p => p.categoryId === activeCategoryId);

  // Pre-configured light colors if category doesn't have an intense color default set
  const getCatColorBorder = (colorClass: string) => {
    if (colorClass.includes("bg-emerald")) return "border-emerald-500/20 hover:border-emerald-500/80";
    if (colorClass.includes("bg-amber")) return "border-amber-500/20 hover:border-amber-500/80";
    if (colorClass.includes("bg-sky")) return "border-sky-500/20 hover:border-sky-500/80";
    if (colorClass.includes("bg-orange")) return "border-orange-500/20 hover:border-orange-500/80";
    if (colorClass.includes("bg-rose")) return "border-rose-500/20 hover:border-rose-500/80";
    return "border-zinc-800 hover:border-zinc-700";
  };

  return (
    <div id="product-grid-section" className="flex flex-col gap-4 animate-fade-in h-full">
      
      {/* 1. HORIZONTAL SCROLLABLE TABS FOR CATEGORIES */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-natural-border gap-2 overflow-x-auto select-none no-scrollbar shadow-sm">
        <button
          onClick={() => setActiveCategoryId("all")}
          className={`px-4.5 py-3 rounded-xl font-bold text-xs flex-shrink-0 transition active:scale-95 cursor-pointer ${
            activeCategoryId === "all"
              ? "bg-natural-accent text-white font-black shadow-sm"
              : "text-natural-muted hover:text-natural-text hover:bg-natural-light-bg"
          }`}
        >
          All Products
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={`px-4.5 py-3 rounded-xl font-bold text-xs flex-shrink-0 transition active:scale-95 cursor-pointer flex items-center gap-2 ${
              activeCategoryId === cat.id
                ? "bg-natural-accent text-white font-black shadow-sm"
                : "text-natural-muted hover:text-natural-text hover:bg-natural-light-bg"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${cat.color || "bg-natural-accent"}`} />
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* 2. PRODUCTS GRID PANEL */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-[50vh] max-h-[75vh]">
        {filteredProducts.length === 0 ? (
          <div className="h-64 border-2 border-dashed border-natural-border rounded-3xl flex flex-col items-center justify-center text-natural-muted gap-2 bg-white/40">
            <Tag className="w-8 h-8 text-natural-muted" />
            <span className="text-xs font-semibold">No items currently displayed in this category</span>
            <span className="text-[10px] font-mono">No products available. Add items in Settings tab.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <AnimatePresence>
              {filteredProducts.map((prod) => {
                const itemCatColor = categories.find(c => c.id === prod.categoryId)?.color || "bg-natural-accent text-white";
                return (
                  <motion.button
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onAddItem(prod)}
                    key={prod.id}
                    className="bg-white hover:bg-white justify-between flex flex-col items-stretch text-left p-4.5 rounded-2.5xl border border-natural-border hover:border-natural-accent hover:ring-2 hover:ring-natural-accent/15 transition h-40 group relative cursor-pointer shadow-sm"
                  >
                    {/* Tiny category accent pill */}
                    <span className={`self-start text-[9px] px-2 py-0.5 rounded-md font-bold text-[10px] leading-none mb-1 shadow-sm uppercase ${itemCatColor}`}>
                      {categories.find(c => c.id === prod.categoryId)?.name.split(" ")[0] || "Item"}
                    </span>

                    {/* Product Name */}
                    <div className="text-sm font-semibold text-natural-text group-hover:text-natural-accent transition leading-snug line-clamp-2 mt-1.5">
                      {prod.name}
                    </div>

                    {/* Extra calculations displays */}
                    <div className="flex justify-between items-baseline mt-auto pt-3">
                      <div>
                        <span className="text-lg font-bold font-mono text-natural-text block tracking-tight">
                          {formatPrice(prod.price)}
                        </span>
                        <span className="text-[9px] text-natural-muted font-sans block leading-none font-semibold">SAR (Saudi Riyal)</span>
                      </div>
                      
                      {/* Price Tax status display */}
                      {prod.isTaxInclusive ? (
                        <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-bold">Inc. VAT</span>
                      ) : (
                        <span className="text-[9px] text-natural-muted bg-natural-light-bg px-1.5 py-0.5 rounded border border-natural-border font-bold">+ 15% VAT</span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
