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

  const getCatColors = (catId: string) => {
    const index = categories.findIndex(c => c.id === catId);
    if (index === -1) return { bg: "bg-zinc-100", border: "border-zinc-200", text: "text-zinc-700", hover: "hover:border-zinc-400" };
    
    // Define a palette
    const colors = [
      { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", hover: "hover:border-sky-400" },
      { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", hover: "hover:border-amber-400" },
      { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", hover: "hover:border-emerald-400" },
      { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", hover: "hover:border-rose-400" },
      { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", hover: "hover:border-violet-400" }
    ];
    
    return colors[index % colors.length];
  };

  return (
    <div id="product-grid-section" className="flex flex-col gap-6 animate-fade-in h-full p-4">
      
      {/* 1. PRODUCT MENU HEADER */}
      <h2 className="text-2xl font-medium text-zinc-900">Our Menu</h2>

      {/* 2. CATEGORY BUTTONS */}
      <div className="flex gap-3 overflow-x-auto select-none no-scrollbar">
        <button
          onClick={() => setActiveCategoryId("all")}
          className={`px-4 py-2 border rounded text-sm font-medium transition ${
            activeCategoryId === "all"
              ? "bg-zinc-800 text-white border-zinc-800"
              : "bg-zinc-100 text-zinc-700 border-zinc-200 hover:border-zinc-400"
          }`}
        >
          All
        </button>

        {categories.map((cat) => {
          const colors = getCatColors(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-4 py-2 border rounded text-sm font-medium transition ${
                activeCategoryId === cat.id
                  ? `${colors.bg} ${colors.text} ${colors.border}`
                  : "bg-zinc-100 text-zinc-700 border-zinc-200 hover:border-zinc-400"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* 3. PRODUCTS GRID PANEL */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="h-64 border-2 border-dashed border-zinc-200 rounded-lg flex flex-col items-center justify-center text-zinc-400 gap-2">
            <span>No items currently available.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <AnimatePresence>
              {filteredProducts.map((prod) => {
                const colors = getCatColors(prod.categoryId);
                return (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAddItem(prod)}
                    key={prod.id}
                    className={`bg-white p-3 rounded border shadow-sm flex flex-col justify-between h-28 text-left transition ${colors.border} ${colors.hover}`}
                  >
                    {/* Product Name */}
                    <div className="text-xs font-semibold text-zinc-900 leading-tight">
                      {prod.name}
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-1 text-xs font-bold text-zinc-600 mt-2">
                      <span className={`text-sm ${colors.text}`}>☲</span>
                      {formatPrice(prod.price)}
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
