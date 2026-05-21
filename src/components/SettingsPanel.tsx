/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { StoreSettings, Category, Product, PaymentMethod } from "../types";
import { dbService } from "../lib/db";
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  CreditCard, 
  Coins, 
  Wallet, 
  Tag, 
  BadgePercent, 
  Smartphone, 
  MapPin,
  Check
} from "lucide-react";
import { motion } from "motion/react";

interface SettingsPanelProps {
  onSettingsUpdate: () => void;
}

export default function SettingsPanel({ onSettingsUpdate }: SettingsPanelProps) {
  // Config States
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);

  // Editing Forms States
  const [settingsForm, setSettingsForm] = useState<StoreSettings | null>(null);

  // Category State Editor
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({ id: "", name: "", color: "bg-emerald-500 text-white" });
  // Product State Editor
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({ id: "", name: "", price: 0, isTaxInclusive: true, categoryId: "" });
  // Payment Type State Editor
  const [currentPayment, setCurrentPayment] = useState<Partial<PaymentMethod>>({ id: "", name: "", icon: "CreditCard", color: "bg-emerald-600 text-white" });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const s = await dbService.getSettings();
    setSettings(s);
    setSettingsForm(s);

    const c = await dbService.getCategories();
    setCategories(c);
    if (c.length > 0) {
      setCurrentProduct(prev => ({ ...prev, categoryId: c[0].id }));
    }

    const p = await dbService.getProducts();
    setProducts(p);

    const pay = await dbService.getPaymentMethods();
    setPayments(pay);
  };

  // 1. STORE CONFIG SAVE
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    await dbService.saveSettings(settingsForm);
    setSettings(settingsForm);
    onSettingsUpdate();
    alert("Store Settings updated successfully!");
  };

  // 2. CATEGORY CRUD HANDLERS
  const handleSaveCategory = async () => {
    if (!currentCategory.name) return;
    const catToSave: Category = {
      id: currentCategory.id || `cat-${Date.now()}`,
      name: currentCategory.name,
      color: currentCategory.color || "bg-zinc-700 text-white"
    };

    await dbService.saveCategory(catToSave);
    setCurrentCategory({ id: "", name: "", color: "bg-emerald-500 text-white" });
    loadAllData();
  };

  const handleEditCategory = (c: Category) => {
    setCurrentCategory(c);
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm("Confirm delete Category? This may affect the display of associated products.")) {
      await dbService.deleteCategory(id);
      loadAllData();
    }
  };

  // 3. PRODUCT CRUD HANDLERS
  const handleSaveProduct = async () => {
    if (!currentProduct.name || currentProduct.price === undefined || !currentProduct.categoryId) return;
    const prodToSave: Product = {
      id: currentProduct.id || `prod-${Date.now()}`,
      name: currentProduct.name,
      price: parseFloat(currentProduct.price.toString()),
      isTaxInclusive: !!currentProduct.isTaxInclusive,
      categoryId: currentProduct.categoryId
    };

    await dbService.saveProduct(prodToSave);
    setCurrentProduct(prev => ({ id: "", name: "", price: 0, isTaxInclusive: true, categoryId: categories[0]?.id || "" }));
    loadAllData();
  };

  const handleEditProduct = (p: Product) => {
    setCurrentProduct(p);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await dbService.deleteProduct(id);
      loadAllData();
    }
  };

  // 4. PAYMENT INTERFACES CRUD HANDLERS
  const handleSavePayment = async () => {
    if (!currentPayment.name) return;
    const payToSave: PaymentMethod = {
      id: currentPayment.id || `pay-${Date.now()}`,
      name: currentPayment.name,
      icon: currentPayment.icon || "CreditCard",
      color: currentPayment.color || "bg-zinc-700 text-white"
    };

    await dbService.savePaymentMethod(payToSave);
    setCurrentPayment({ id: "", name: "", icon: "CreditCard", color: "bg-emerald-600 text-white" });
    loadAllData();
  };

  const handleEditPayment = (p: PaymentMethod) => {
    setCurrentPayment(p);
  };

  const handleDeletePayment = async (id: string) => {
    if (payments.length <= 1) {
      alert("Must retain at least one payment channel.");
      return;
    }
    if (window.confirm("Confirm delete payment channel?")) {
      await dbService.deletePaymentMethod(id);
      loadAllData();
    }
  };

  // Predefined gorgeous colors for POS buttons
  const bgColorsList = [
    "bg-emerald-500 text-white",
    "bg-teal-500 text-white",
    "bg-sky-500 text-white",
    "bg-blue-500 text-white",
    "bg-indigo-500 text-white",
    "bg-violet-500 text-white",
    "bg-fuchsia-500 text-white",
    "bg-rose-500 text-white",
    "bg-orange-500 text-white",
    "bg-amber-500 text-white",
    "bg-yellow-500 text-zinc-950",
    "bg-zinc-700 text-white"
  ];

  const payIconsList = ["CreditCard", "Coins", "Wallet", "Smartphone", "Tag"];

  return (
    <div id="settings-pannel" className="max-w-7xl mx-auto p-4 space-y-8 animate-fade-in">
      
      {/* SECTION 1: SYSTEM GLOBAL VALUES */}
      {settingsForm && (
        <fieldset className="bg-white border border-natural-border rounded-3xl p-6 shadow-sm">
          <legend className="px-3 text-sm font-bold text-natural-accent uppercase tracking-widest flex items-center gap-1.5 font-sans">
            <Settings className="w-5 h-5" />
            <span>Store & Receipt Config</span>
          </legend>

          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-natural-muted font-semibold flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-natural-teal" />
                  <span>Phone Number</span>
                </label>
                <input 
                  type="text" 
                  value={settingsForm.phone}
                  onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="bg-natural-light-bg border border-natural-border rounded-xl px-4 py-3 text-natural-text font-mono text-sm focus:border-natural-accent focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-natural-muted font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-natural-accent" />
                  <span>Store Address</span>
                </label>
                <input 
                  type="text" 
                  value={settingsForm.address}
                  onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="bg-natural-light-bg border border-natural-border rounded-xl px-4 py-3 text-natural-text text-sm focus:border-natural-accent focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-natural-muted font-semibold flex items-center gap-1">
                    <BadgePercent className="w-3.5 h-3.5 text-natural-coral" />
                    <span>VAT Registration ID (15 Digits)</span>
                  </label>
                  <input 
                    type="text" 
                    value={settingsForm.taxNumber}
                    onChange={e => setSettingsForm({ ...settingsForm, taxNumber: e.target.value })}
                    className="bg-natural-light-bg border border-natural-border rounded-xl px-4 py-3 text-natural-text font-mono text-sm focus:border-natural-accent focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-natural-muted font-semibold">VAT Rate (%)</label>
                  <input 
                    type="number" 
                    value={settingsForm.taxRate}
                    onChange={e => setSettingsForm({ ...settingsForm, taxRate: parseFloat(e.target.value) || 0 })}
                    className="bg-natural-light-bg border border-natural-border rounded-xl px-4 py-3 text-natural-text font-mono text-sm focus:border-natural-accent focus:outline-none"
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-natural-muted font-semibold">Receipt Header (Company, Address, Tax Info)</label>
                <textarea 
                  value={settingsForm.receiptHeader}
                  onChange={e => setSettingsForm({ ...settingsForm, receiptHeader: e.target.value })}
                  className="bg-natural-light-bg border border-natural-border rounded-xl px-4 py-3 text-natural-text text-sm h-22 font-sans focus:border-natural-accent focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-natural-muted font-semibold">Receipt Footer Message</label>
                <textarea 
                  value={settingsForm.receiptFooter}
                  onChange={e => setSettingsForm({ ...settingsForm, receiptFooter: e.target.value })}
                  className="bg-natural-light-bg border border-natural-border rounded-xl px-4 py-3 text-natural-text text-sm h-22 font-sans focus:border-natural-accent focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <motion.button 
                whileTap={{ scale: 0.97 }}
                type="submit" 
                className="bg-natural-teal hover:bg-natural-teal-hover text-white font-bold py-3 px-8 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Store Settings</span>
              </motion.button>
            </div>
          </form>
        </fieldset>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION 2: CATEGORY MANAGER CRUD */}
        <div className="bg-white border border-natural-border p-6 rounded-3xl shadow-sm space-y-5">
          <h3 className="text-md font-bold text-natural-text flex items-center gap-2">
            <Tag className="w-5 h-5 text-natural-accent" />
            <span>Product Categories</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-natural-border/60">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-natural-muted font-semibold">Category Name</label>
              <input 
                type="text"
                placeholder="e.g., Hot Beverages"
                value={currentCategory.name || ""}
                onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                className="bg-white border border-natural-border rounded-xl px-3.5 py-2.5 text-natural-text text-xs focus:border-natural-accent focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-natural-muted font-semibold">Theme Color Accent</label>
              <div className="grid grid-cols-6 gap-2">
                {bgColorsList.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setCurrentCategory({ ...currentCategory, color: bg })}
                    className={`h-7 rounded-lg border transition cursor-pointer relative ${bg} ${
                      currentCategory.color === bg ? "border-white ring-2 ring-natural-accent" : "border-transparent"
                    }`}
                  >
                    {currentCategory.color === bg && <Check className="w-3.5 h-3.5 mx-auto text-current drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2.5 mt-2">
              {currentCategory.id && (
                <button 
                  onClick={() => setCurrentCategory({ id: "", name: "", color: "bg-emerald-500 text-white" })}
                  className="bg-natural-light-bg hover:bg-natural-border text-natural-text font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={handleSaveCategory}
                className="bg-natural-accent hover:bg-natural-accent-hover text-white font-bold text-xs py-2 px-5 rounded-xl flex items-center gap-1 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{currentCategory.id ? "Update Category" : "Create Category"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-[#FAF8F5] p-3 rounded-xl border border-natural-border/50 flex justify-between items-center text-xs">
                <span className={`px-3 py-1.5 rounded-lg font-bold ${cat.color}`}>
                  {cat.name}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditCategory(cat)}
                    className="p-2 bg-white border border-natural-border text-natural-muted hover:text-natural-accent rounded-lg transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2 bg-white border border-natural-border text-natural-muted hover:text-natural-coral rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: PAYMENT METHOD CRUD */}
        <div className="bg-white border border-natural-border p-6 rounded-3xl shadow-sm space-y-5">
          <h3 className="text-md font-bold text-natural-text flex items-center gap-2">
            <Coins className="w-5 h-5 text-natural-accent" />
            <span>Payment Gateways</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-natural-border/60">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-natural-muted font-semibold">Payment Gateway Name</label>
              <input 
                type="text"
                placeholder="e.g., mada, Cash, Apple Pay"
                value={currentPayment.name || ""}
                onChange={(e) => setCurrentPayment({ ...currentPayment, name: e.target.value })}
                className="bg-white border border-natural-border rounded-xl px-3.5 py-2.5 text-natural-text text-xs focus:border-natural-accent focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-natural-muted font-semibold">Lucide Icon name</label>
              <div className="flex gap-3">
                {payIconsList.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setCurrentPayment({ ...currentPayment, icon: ic })}
                    className={`p-2.5 rounded-xl border text-natural-text transition cursor-pointer ${
                      currentPayment.icon === ic ? "bg-natural-accent/10 border-natural-accent text-natural-accent scale-105" : "bg-white border-natural-border"
                    }`}
                  >
                    {ic === "CreditCard" && <CreditCard className="w-4 h-4" />}
                    {ic === "Coins" && <Coins className="w-4 h-4" />}
                    {ic === "Wallet" && <Wallet className="w-4 h-4" />}
                    {ic === "Smartphone" && <Smartphone className="w-4 h-4" />}
                    {ic === "Tag" && <Tag className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs text-natural-muted font-semibold">Tailwind Theme Accent</label>
              <div className="grid grid-cols-6 gap-2">
                {bgColorsList.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setCurrentPayment({ ...currentPayment, color: bg })}
                    className={`h-7 rounded-lg border transition cursor-pointer relative ${bg} ${
                      currentPayment.color === bg ? "border-white ring-2 ring-natural-accent" : "border-transparent"
                    }`}
                  >
                    {currentPayment.color === bg && <Check className="w-3.5 h-3.5 mx-auto text-current" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2.5 mt-2">
              {currentPayment.id && (
                <button 
                  onClick={() => setCurrentPayment({ id: "", name: "", icon: "CreditCard", color: "bg-emerald-600 text-white" })}
                  className="bg-natural-light-bg hover:bg-natural-border text-natural-text font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={handleSavePayment}
                className="bg-natural-accent hover:bg-natural-accent-hover text-white font-bold text-xs py-2 px-5 rounded-xl flex items-center gap-1 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{currentPayment.id ? "Update Gateway" : "Create Gateway"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto w-full">
            {payments.map((p) => (
              <div key={p.id} className="bg-[#FAF8F5] p-3 rounded-xl border border-natural-border/50 flex justify-between items-center text-xs">
                <span className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${p.color}`}>
                  {p.icon === "CreditCard" && <CreditCard className="w-4 h-4" />}
                  {p.icon === "Coins" && <Coins className="w-4 h-4" />}
                  {p.icon === "Wallet" && <Wallet className="w-4 h-4" />}
                  {p.icon === "Smartphone" && <Smartphone className="w-4 h-4" />}
                  {p.icon === "Tag" && <Tag className="w-4 h-4" />}
                  <span>{p.name}</span>
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditPayment(p)}
                    className="p-2 bg-white border border-natural-border text-natural-muted hover:text-natural-accent rounded-lg transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeletePayment(p.id)}
                    className="p-2 bg-white border border-natural-border text-natural-muted hover:text-natural-coral rounded-lg transition cursor-pointer animate-fade-in"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: MASTER CATEGORY INVENTORY CATALOG CRUD */}
      <div className="bg-white border border-natural-border p-6 rounded-3xl shadow-sm space-y-5">
        <h3 className="text-md font-bold text-natural-text flex items-center gap-2">
          <Tag className="w-5 h-5 text-natural-teal" />
          <span>Products Master Catalog</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-natural-border/60">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-natural-muted font-semibold">Product/Item Name</label>
            <input 
              type="text"
              placeholder="e.g., Gourmet Beef Burger"
              value={currentProduct.name || ""}
              onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
              className="bg-white border border-natural-border rounded-xl px-3.5 py-2.5 text-natural-text text-xs focus:border-natural-teal focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5 font-mono">
            <label className="text-xs text-natural-muted font-sans font-semibold">Retail Price (SAR)</label>
            <input 
              type="number"
              step="0.01"
              value={currentProduct.price || ""}
              onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) || 0 })}
              className="bg-white border border-natural-border rounded-xl px-3.5 py-2.5 text-natural-text text-xs focus:border-natural-teal focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-natural-muted font-semibold">Product Category</label>
            <select
              value={currentProduct.categoryId || ""}
              onChange={(e) => setCurrentProduct({ ...currentProduct, categoryId: e.target.value })}
              className="bg-white border border-natural-border rounded-xl px-3.5 py-2.5 text-natural-text text-xs focus:border-natural-teal focus:outline-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-natural-muted font-semibold">VAT Status Mode</label>
            <select
              value={currentProduct.isTaxInclusive ? "inclusive" : "exclusive"}
              onChange={(e) => setCurrentProduct({ ...currentProduct, isTaxInclusive: e.target.value === "inclusive" })}
              className="bg-white border border-natural-border rounded-xl px-3.5 py-2.5 text-natural-text text-xs focus:border-natural-teal focus:outline-none cursor-pointer"
            >
              <option value="inclusive">Tax Inclusive (inclusive of 15% VAT)</option>
              <option value="exclusive">Tax Exclusive (15% VAT added on checkout)</option>
            </select>
          </div>
          <div className="md:col-span-4 flex justify-end gap-2.5 mt-2">
            {currentProduct.id && (
              <button 
                onClick={() => setCurrentProduct({ id: "", name: "", price: 0, isTaxInclusive: true, categoryId: categories[0]?.id || "" })}
                className="bg-natural-light-bg hover:bg-natural-border text-natural-text font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
              >
                إلغاء (Cancel)
              </button>
            )}
            <button 
              onClick={handleSaveProduct}
              className="bg-natural-teal hover:bg-natural-teal-hover text-white font-bold text-xs py-2.5 px-6 rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{currentProduct.id ? "Update Product" : "Create Product"}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full border border-natural-border rounded-2xl">
          <table className="w-full text-left border-collapse bg-white text-xs">
            <thead>
              <tr className="bg-[#433E3A] border-b border-natural-border text-[#F8F5F2] font-semibold text-left">
                <th className="p-4 text-left">Item/Product Name</th>
                <th className="p-4 text-left">Price</th>
                <th className="p-4 text-left">VAT Configuration</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const catName = categories.find(c => c.id === p.categoryId)?.name || "Uncategorized";
                return (
                  <tr key={p.id} className="border-b border-natural-border/60 text-natural-text hover:bg-natural-light-bg/40 text-left">
                    <td className="p-4 font-semibold text-natural-text text-left">{p.name}</td>
                    <td className="p-4 font-mono font-bold text-natural-accent text-left">{p.price.toFixed(2)} SAR</td>
                    <td className="p-4 text-left">
                      {p.isTaxInclusive ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-natural-teal/15 text-natural-teal border border-natural-teal/20">Tax Inclusive</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-natural-accent/15 text-natural-accent border border-natural-accent/20">Tax Exclusive</span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-left">{catName}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleEditProduct(p)}
                          className="p-1.5 bg-white border border-natural-border text-natural-muted hover:text-natural-teal rounded-lg transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 bg-white border border-natural-border text-natural-muted hover:text-natural-coral rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
