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

  // Inline Notification and Confirmation States
  const [showSettingsSaved, setShowSettingsSaved] = useState(false);
  const [categoryDeleteConfirmId, setCategoryDeleteConfirmId] = useState<string | null>(null);
  const [productDeleteConfirmId, setProductDeleteConfirmId] = useState<string | null>(null);
  const [paymentDeleteConfirmId, setPaymentDeleteConfirmId] = useState<string | null>(null);
  const [paymentDeleteError, setPaymentDeleteError] = useState<string | null>(null);

  // Advanced CRUD Validation & Inline Toast States (ZATCA/Professional Level validation)
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null);
  
  const [productError, setProductError] = useState<string | null>(null);
  const [productSuccess, setProductSuccess] = useState<string | null>(null);

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const [settingsError, setSettingsError] = useState<string | null>(null);

  const formatPrice = (v: number): string => {
    return parseFloat(v.toFixed(2)).toString();
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const s = await dbService.getSettings();
    const defaults = {
      storeName: s?.storeName || "",
      phone: s?.phone || "",
      address: s?.address || "",
      receiptHeader: s?.receiptHeader || "",
      receiptFooter: s?.receiptFooter || "",
      taxNumber: s?.taxNumber || "",
      taxRate: s?.taxRate ?? 15,
    };
    setSettings(s || defaults);
    setSettingsForm(s || defaults);

    const c = await dbService.getCategories();
    setCategories(c);
    if (c.length > 0) {
      setCurrentProduct(prev => ({ 
        ...prev, 
        categoryId: prev.categoryId || c[0].id 
      }));
    }

    const p = await dbService.getProducts();
    setProducts(p);

    const pay = await dbService.getPaymentMethods();
    setPayments(pay);
  };

  // Helper clear-outs
  const clearCategoryForm = () => {
    setCurrentCategory({ id: "", name: "", color: "bg-emerald-500 text-white" });
    setCategoryError(null);
  };

  const clearProductForm = () => {
    setCurrentProduct({ 
      id: "", 
      name: "", 
      price: 0, 
      isTaxInclusive: true, 
      categoryId: categories[0]?.id || "" 
    });
    setProductError(null);
  };

  const clearPaymentForm = () => {
    setCurrentPayment({ id: "", name: "", icon: "CreditCard", color: "bg-emerald-600 text-white" });
    setPaymentError(null);
  };

  // 1. STORE CONFIG SAVE
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;

    setSettingsError(null);
    setShowSettingsSaved(false);

    // Business Logic Validations
    if (!settingsForm.storeName?.trim()) {
      setSettingsError("Store name is required.");
      return;
    }
    if (!settingsForm.phone?.trim()) {
      setSettingsError("Primary contact mobile/phone number is required.");
      return;
    }
    if (!settingsForm.address?.trim()) {
      setSettingsError("Store dispatch/physical address is required.");
      return;
    }

    const cleanTaxNo = settingsForm.taxNumber?.replace(/\s+/g, "") || "";
    if (cleanTaxNo.length !== 15 || !/^\d+$/.test(cleanTaxNo)) {
      setSettingsError("ZATCA Compliance: VAT Registration ID must be exactly 15 digits.");
      return;
    }

    if (settingsForm.taxRate === undefined || settingsForm.taxRate < 0 || settingsForm.taxRate > 100) {
      setSettingsError("Invalid VAT percentage. Must be a valid rate between 0 and 100%.");
      return;
    }

    await dbService.saveSettings(settingsForm);
    setSettings(settingsForm);
    onSettingsUpdate();
    setShowSettingsSaved(true);
    setTimeout(() => setShowSettingsSaved(false), 4500);
  };

  // 2. CATEGORY CRUD HANDLERS
  const handleSaveCategory = async () => {
    setCategoryError(null);
    setCategorySuccess(null);

    const targetName = currentCategory.name?.trim();
    if (!targetName) {
      setCategoryError("Please enter a non-empty Category Name.");
      return;
    }

    if (targetName.length > 35) {
      setCategoryError("Category Name is too long (limit 35 characters).");
      return;
    }

    // Check configuration uniqueness
    const dupExists = categories.some(
      cat => cat.name.toLowerCase() === targetName.toLowerCase() && cat.id !== currentCategory.id
    );
    if (dupExists) {
      setCategoryError(`A category named "${targetName}" already exists.`);
      return;
    }

    const catToSave: Category = {
      id: currentCategory.id || `cat-${Date.now()}`,
      name: targetName,
      color: currentCategory.color || "bg-zinc-700 text-white"
    };

    await dbService.saveCategory(catToSave);
    const op = currentCategory.id ? "upgraded & saved" : "created brand new";
    setCategorySuccess(`Category "${targetName}" successfully ${op}!`);
    clearCategoryForm();
    loadAllData();
    setTimeout(() => setCategorySuccess(null), 4000);
  };

  const handleEditCategory = (c: Category) => {
    setCategoryError(null);
    setCurrentCategory(c);
  };

  const handleDeleteCategory = async (id: string) => {
    setCategoryError(null);
    setCategorySuccess(null);

    const matchCat = categories.find(c => c.id === id);
    const catName = matchCat ? matchCat.name : "Category";

    // Warn if associated products may be affected
    const activeProductsWithCat = products.filter(p => p.categoryId === id);
    let warningSuffix = "";
    if (activeProductsWithCat.length > 0) {
      warningSuffix = ` Notice: ${activeProductsWithCat.length} products are now uncategorized.`;
    }

    await dbService.deleteCategory(id);
    setCategorySuccess(`Category "${catName}" removed.${warningSuffix}`);
    loadAllData();
    setTimeout(() => setCategorySuccess(null), 4000);
  };

  // 3. PRODUCT CRUD HANDLERS
  const handleSaveProduct = async () => {
    setProductError(null);
    setProductSuccess(null);

    const targetName = currentProduct.name?.trim();
    if (!targetName) {
      setProductError("Please enter a valid Item/Product Name.");
      return;
    }

    if (targetName.length > 60) {
      setProductError("Product Name has exceeded 60 characters limit.");
      return;
    }

    const priceVal = currentProduct.price;
    if (priceVal === undefined || isNaN(priceVal) || priceVal < 0) {
      setProductError("Retail price cannot be negative or invalid number.");
      return;
    }

    if (!currentProduct.categoryId) {
      setProductError("A valid Product Category must be selected.");
      return;
    }

    // Check duplicate product code/name
    const dupExists = products.some(
      p => p.name.toLowerCase() === targetName.toLowerCase() && p.id !== currentProduct.id
    );
    if (dupExists) {
      setProductError(`An item with the name "${targetName}" is already registered.`);
      return;
    }

    const prodToSave: Product = {
      id: currentProduct.id || `prod-${Date.now()}`,
      name: targetName,
      price: parseFloat(priceVal.toString()),
      isTaxInclusive: !!currentProduct.isTaxInclusive,
      categoryId: currentProduct.categoryId
    };

    await dbService.saveProduct(prodToSave);
    const op = currentProduct.id ? "updated" : "cataloged";
    setProductSuccess(`Product "${targetName}" ${op} successfully!`);
    
    // Reset but preserve selected category for faster multi-item entries
    setCurrentProduct(prev => ({ 
      id: "", 
      name: "", 
      price: 0, 
      isTaxInclusive: true, 
      categoryId: prev.categoryId || categories[0]?.id || "" 
    }));
    loadAllData();
    setTimeout(() => setProductSuccess(null), 4000);
  };

  const handleEditProduct = (p: Product) => {
    setProductError(null);
    setCurrentProduct(p);
  };

  const handleDeleteProduct = async (id: string) => {
    setProductError(null);
    setProductSuccess(null);

    const matchPrd = products.find(p => p.id === id);
    const prdName = matchPrd ? matchPrd.name : "Product";

    await dbService.deleteProduct(id);
    setProductSuccess(`Product "${prdName}" deleted from registry.`);
    loadAllData();
    setTimeout(() => setProductSuccess(null), 4000);
  };

  // 4. PAYMENT INTERFACES CRUD HANDLERS
  const handleSavePayment = async () => {
    setPaymentError(null);
    setPaymentSuccess(null);

    const targetName = currentPayment.name?.trim();
    if (!targetName) {
      setPaymentError("Gateway/Method display name is required.");
      return;
    }

    if (targetName.length > 25) {
      setPaymentError("Gateway Name is too long (limit 25 characters).");
      return;
    }

    // Uniqueness
    const dupExists = payments.some(
      pay => pay.name.toLowerCase() === targetName.toLowerCase() && pay.id !== currentPayment.id
    );
    if (dupExists) {
      setPaymentError(`A gateway configured as "${targetName}" already exists.`);
      return;
    }

    const payToSave: PaymentMethod = {
      id: currentPayment.id || `pay-${Date.now()}`,
      name: targetName,
      icon: currentPayment.icon || "CreditCard",
      color: currentPayment.color || "bg-[#10b981] text-white"
    };

    await dbService.savePaymentMethod(payToSave);
    const op = currentPayment.id ? "updated" : "deployed live";
    setPaymentSuccess(`Payment Gateway "${targetName}" ${op}!`);
    clearPaymentForm();
    loadAllData();
    setTimeout(() => setPaymentSuccess(null), 4000);
  };

  const handleEditPayment = (p: PaymentMethod) => {
    setPaymentError(null);
    setCurrentPayment(p);
  };

  const handleDeletePayment = async (id: string) => {
    setPaymentError(null);
    setPaymentSuccess(null);

    if (payments.length <= 1) {
      setPaymentDeleteError("ZATCA compliance error: POS registers must retain at least one configured payment method.");
      setTimeout(() => setPaymentDeleteError(null), 4500);
      return;
    }

    const matchPay = payments.find(p => p.id === id);
    const payName = matchPay ? matchPay.name : "Gateway";

    await dbService.deletePaymentMethod(id);
    setPaymentSuccess(`Gateway "${payName}" deactivated.`);
    loadAllData();
    setTimeout(() => setPaymentSuccess(null), 4000);
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

          {settingsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-xs font-semibold leading-relaxed flex items-center gap-2 mt-4 animate-fade-in">
              <span className="text-base select-none">⚠️</span>
              <span>{settingsError}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-natural-muted font-semibold flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-natural-teal" />
                  <span>Store Name</span>
                </label>
                <input 
                  type="text" 
                  value={settingsForm.storeName}
                  onChange={e => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                  className="bg-natural-light-bg border border-natural-border rounded-xl px-4 py-3 text-natural-text font-mono text-sm focus:border-natural-accent focus:outline-none"
                  required
                />
              </div>
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

            <div className="md:col-span-2 flex justify-end items-center gap-4">
              {showSettingsSaved && (
                <span className="text-sm text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl animate-fade-in">
                  ✓ Store settings updated successfully!
                </span>
              )}
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

          {categoryError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold leading-relaxed animate-fade-in">
              ⚠️ {categoryError}
            </div>
          )}
          {categorySuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold leading-relaxed animate-fade-in">
              ✓ {categorySuccess}
            </div>
          )}

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
                <div className="flex gap-2 items-center">
                  <button 
                    onClick={() => handleEditCategory(cat)}
                    className="p-2 bg-white border border-natural-border text-natural-muted hover:text-natural-accent rounded-lg transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {categoryDeleteConfirmId === cat.id ? (
                    <div className="flex items-center gap-1 select-none">
                      <button
                        onClick={() => {
                          handleDeleteCategory(cat.id).then(() => {
                            setCategoryDeleteConfirmId(null);
                          });
                        }}
                        className="px-2 py-1.5 bg-red-600 text-white font-bold rounded-lg transition hover:bg-red-700 text-[10px] cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setCategoryDeleteConfirmId(null)}
                        className="px-2 py-1.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg transition hover:bg-gray-300 text-[10px] cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setCategoryDeleteConfirmId(cat.id)}
                      className="p-2 bg-white border border-natural-border text-natural-muted hover:text-natural-coral rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: PAYMENT METHOD CRUD */}
        <div className="bg-white border border-natural-border p-6 rounded-3xl shadow-sm space-y-5">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-md font-bold text-natural-text flex items-center gap-2">
              <Coins className="w-5 h-5 text-natural-accent" />
              <span>Payment Gateways</span>
            </h3>
            {paymentDeleteError && (
              <span className="text-xs text-red-600 font-bold bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl animate-fade-in">
                {paymentDeleteError}
              </span>
            )}
          </div>

          {paymentError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold leading-relaxed animate-fade-in">
              ⚠️ {paymentError}
            </div>
          )}
          {paymentSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold leading-relaxed animate-fade-in">
              ✓ {paymentSuccess}
            </div>
          )}

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
                <div className="flex gap-2 items-center">
                  <button 
                    onClick={() => handleEditPayment(p)}
                    className="p-2 bg-white border border-natural-border text-natural-muted hover:text-natural-accent rounded-lg transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {paymentDeleteConfirmId === p.id ? (
                    <div className="flex items-center gap-1 select-none">
                      <button
                        onClick={() => {
                          handleDeletePayment(p.id).then(() => {
                            setPaymentDeleteConfirmId(null);
                          });
                        }}
                        className="px-2 py-1.5 bg-red-600 text-white font-bold rounded-lg transition hover:bg-red-700 text-[10px] cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setPaymentDeleteConfirmId(null)}
                        className="px-2 py-1.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg transition hover:bg-gray-300 text-[10px] cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setPaymentDeleteConfirmId(p.id)}
                      className="p-2 bg-white border border-natural-border text-natural-muted hover:text-natural-coral rounded-lg transition cursor-pointer animate-fade-in"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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

        {productError && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold leading-relaxed animate-fade-in">
            ⚠️ {productError}
          </div>
        )}
        {productSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold leading-relaxed animate-fade-in">
            ✓ {productSuccess}
          </div>
        )}

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
            {currentProduct.isTaxInclusive && currentProduct.price > 0 && (
              <span className="text-[10px] text-natural-teal font-sans">
                Base Price (ex-VAT): {(currentProduct.price / (1 + ((settings?.taxRate || 15) / 100))).toFixed(2)} SAR
              </span>
            )}
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
                Cancel
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
                    <td className="p-4 font-mono font-bold text-natural-accent text-left">{formatPrice(p.price)} SAR</td>
                    <td className="p-4 text-left">
                      {p.isTaxInclusive ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-natural-teal/15 text-natural-teal border border-natural-teal/20">Tax Inclusive</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-natural-accent/15 text-natural-accent border border-natural-accent/20">Tax Exclusive</span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-left">{catName}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2 items-center">
                        <button 
                          onClick={() => handleEditProduct(p)}
                          className="p-1.5 bg-white border border-natural-border text-natural-muted hover:text-natural-teal rounded-lg transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {productDeleteConfirmId === p.id ? (
                          <div className="flex items-center gap-1 select-none">
                            <button
                              onClick={() => {
                                handleDeleteProduct(p.id).then(() => {
                                  setProductDeleteConfirmId(null);
                                });
                              }}
                              className="px-2 py-1 bg-red-600 text-white font-bold rounded-md transition hover:bg-red-700 text-[9px] cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setProductDeleteConfirmId(null)}
                              className="px-1.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-md transition hover:bg-gray-200 text-[9px] cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setProductDeleteConfirmId(p.id)}
                            className="p-1.5 bg-white border border-natural-border text-natural-muted hover:text-natural-coral rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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
