"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  Clock,
  Users,
  ShoppingBag,
  ChevronRight,
  Utensils,
  Leaf,
  Drumstick,
} from "lucide-react";
import confetti from "canvas-confetti";
import { usePosStore, TableItem } from "@/lib/store";
import { calculateRestaurantGST, formatINR } from "@/lib/gst";
import { FssaiDotBadge, CulinaryTags } from "@/components/DietaryBadge";

interface MenuItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  spiceLevel: string;
  dietaryTag: string;
  prepTimeMinutes: number;
  isAvailable: boolean;
  imageUrl?: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  items: MenuItemData[];
}

export default function PosPage() {
  const {
    selectedTable,
    setSelectedTable,
    orderType,
    setOrderType,
    cart,
    addItem,
    removeItem,
    updateQuantity,
    updateItemModifiers,
    clearCart,
    orderNotes,
    setOrderNotes,
    getCartSubtotal,
    getCartItemCount,
  } = usePosStore();

  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [dietaryFilter, setDietaryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showTableModal, setShowTableModal] = useState<boolean>(false);
  const [editingModifierId, setEditingModifierId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"menu" | "cart">("menu");

  useEffect(() => {
    fetchMenu();
    fetchTables();
  }, []);

  async function fetchMenu() {
    try {
      const res = await fetch("/api/menu");
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error("Failed to load menu:", err);
    }
  }

  async function fetchTables() {
    try {
      const res = await fetch("/api/tables");
      const json = await res.json();
      if (json.success) {
        setTables(json.data);
        if (!selectedTable && json.data.length > 0) {
          const defaultTable =
            json.data.find((t: TableItem) => t.status === "AVAILABLE") ||
            json.data[0];
          setSelectedTable(defaultTable);
        }
      }
    } catch (err) {
      console.error("Failed to load tables:", err);
    }
  }

  const allItems = categories.flatMap((c) => c.items);
  const filteredItems = allItems.filter((item) => {
    const matchesCategory =
      activeCategoryId === "all" || item.categoryId === activeCategoryId;
    const matchesDietary =
      dietaryFilter === "ALL" ||
      (dietaryFilter === "VEG" &&
        (item.dietaryTag === "VEG" || item.dietaryTag === "VEGAN")) ||
      (dietaryFilter === "NON_VEG" && item.dietaryTag === "NON_VEG");
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesDietary && matchesSearch;
  });

  const subtotal = getCartSubtotal();
  const taxDetails = calculateRestaurantGST(subtotal);

  async function handleSendToKitchen() {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: selectedTable?.id,
          orderType,
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            quantity: c.quantity,
            unitPrice: c.price,
            spicePreference: c.spicePreference,
            notes: c.notes,
          })),
          specialNotes: orderNotes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: ["#d97706", "#16a34a", "#ea580c"],
        });

        clearCart();
        fetchTables();
      } else {
        alert(json.error || "Failed to place order.");
      }
    } catch (err) {
      console.error("Order placement error:", err);
      alert("Error transmitting order to kitchen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-[#FAF9F6]">
      {/* LEFT / CENTER: Table Selector Bar + Category Filter + Dishes Grid */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200/80 overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          {/* Active Table Selector Pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTableModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 text-xs sm:text-sm font-bold shadow-2xs transition-all"
            >
              <Users className="h-4 w-4 text-amber-600" />
              <span>{selectedTable ? selectedTable.name : "Select Table"}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide ${
                  selectedTable?.status === "AVAILABLE"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {selectedTable?.status || "AVAILABLE"}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-amber-600" />
            </button>

            {/* Dine-In vs Takeaway Toggle */}
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
              <button
                onClick={() => setOrderType("DINE_IN")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  orderType === "DINE_IN"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Dine-In
              </button>
              <button
                onClick={() => setOrderType("TAKEAWAY")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  orderType === "TAKEAWAY"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Takeaway
              </button>
            </div>
          </div>

          {/* Search and Dietary Switchers */}
          <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Biryani, Porotta, Curries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-2xs"
              />
            </div>

            {/* Veg / Non-Veg Quick Pills */}
            <div className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
              <button
                onClick={() => setDietaryFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  dietaryFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setDietaryFilter("VEG")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  dietaryFilter === "VEG"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs"
                    : "text-slate-600 hover:text-emerald-700"
                }`}
              >
                <FssaiDotBadge dietaryTag="VEG" size="sm" />
                Veg
              </button>
              <button
                onClick={() => setDietaryFilter("NON_VEG")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  dietaryFilter === "NON_VEG"
                    ? "bg-rose-50 text-rose-800 border border-rose-300 shadow-xs"
                    : "text-slate-600 hover:text-rose-700"
                }`}
              >
                <FssaiDotBadge dietaryTag="NON_VEG" size="sm" />
                Non-Veg
              </button>
            </div>

            {/* Mobile Cart Tab Switcher */}
            <button
              onClick={() => setActiveTab(activeTab === "menu" ? "cart" : "menu")}
              className="lg:hidden relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-xs"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Cart ({getCartItemCount()})</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto border-b border-slate-200/80 bg-[#FFFDF9] scrollbar-none">
          <button
            onClick={() => setActiveCategoryId("all")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
              activeCategoryId === "all"
                ? "bg-amber-600 text-white shadow-xs scale-102"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-amber-50/50 hover:text-slate-900"
            }`}
          >
            All Specialties ({allItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                activeCategoryId === cat.id
                  ? "bg-amber-600 text-white shadow-xs scale-102"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-amber-50/50 hover:text-slate-900"
              }`}
            >
              {cat.name} ({cat.items.length})
            </button>
          ))}
        </div>

        {/* Dishes Grid — SLEEK TEXT-FIRST LAYOUT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Utensils className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-600 font-semibold">No dishes match your filter criteria.</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting the category or search keyword.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const inCart = cart.find((c) => c.menuItemId === item.id);
                return (
                  <div
                    key={item.id}
                    className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-4 transition-all duration-200 ${
                      item.isAvailable
                        ? "border-slate-200/90 hover:border-amber-400 hover:shadow-md warm-card-hover"
                        : "border-slate-200/60 bg-slate-50/80 opacity-60"
                    }`}
                  >
                    {/* Top Row: FSSAI Indicator + Dish Title + Badges */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {/* Indian FSSAI Standard Dot Badge */}
                          <div className="mt-0.5">
                            <FssaiDotBadge dietaryTag={item.dietaryTag} size="md" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-amber-800 transition-colors">
                              {item.name}
                            </h4>
                            {/* Badges: Chef's Special / Bestseller / Spicy */}
                            <div className="mt-1">
                              <CulinaryTags name={item.name} spiceLevel={item.spiceLevel} />
                            </div>
                          </div>
                        </div>

                        {!item.isAvailable && (
                          <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      {/* Appetizing Culinary Description */}
                      <p className="text-xs text-slate-500 mt-2.5 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom Row: Category, Prep Time, Price & Add Button */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="text-[11px] font-bold text-slate-400">
                          {item.category?.name?.split(" ")[0]}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {item.prepTimeMinutes}m
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-950 text-sm whitespace-nowrap">
                          {formatINR(item.price)}
                        </span>

                        {inCart ? (
                          <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-300 p-1">
                            <button
                              onClick={() => updateQuantity(inCart.id, -1)}
                              className="h-6 w-6 rounded-lg bg-amber-200/70 text-amber-900 hover:bg-amber-300 flex items-center justify-center transition-colors font-bold"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-black text-amber-950 px-1">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(inCart.id, 1)}
                              className="h-6 w-6 rounded-lg bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 transition-colors font-bold"
                            >
                              <Plus className="h-3 w-3 stroke-[2.5]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addItem(item)}
                            disabled={!item.isAvailable}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-2xs ${
                              item.isAvailable
                                ? "bg-amber-600 text-white hover:bg-amber-700 hover:shadow-xs active:scale-98"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            }`}
                          >
                            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Interactive Cart & KDS Dispatch Drawer */}
      <div
        className={`w-full lg:w-96 flex flex-col bg-white border-l border-slate-200 overflow-hidden shadow-sm ${
          activeTab === "cart" ? "block fixed inset-0 z-40 lg:static" : "hidden lg:flex"
        }`}
      >
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 bg-[#FFFDF9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100/70 border border-amber-200 text-amber-700">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                Current Ticket
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {getCartItemCount()} items
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {selectedTable ? `${selectedTable.name} • ${orderType}` : "No Table Selected"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Clear Cart"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setActiveTab("menu")}
              className="lg:hidden text-xs text-amber-700 font-bold px-2 py-1"
            >
              Back to Menu
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF9F6]">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-400">
              <div className="h-16 w-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-3 text-amber-600">
                <ShoppingBag className="h-8 w-8 stroke-[1.5]" />
              </div>
              <p className="text-sm font-bold text-slate-700">Ticket is empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                Click "+ Add" on authentic Kerala dishes to assemble an order.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col gap-2 shadow-2xs hover:border-amber-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <FssaiDotBadge dietaryTag={item.dietaryTag} size="sm" />
                      <h5 className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </h5>
                    </div>
                    <div className="text-xs text-amber-700 font-black mt-0.5">
                      {formatINR(item.price * item.quantity)}
                      <span className="text-slate-400 font-normal ml-1 text-[11px]">
                        ({formatINR(item.price)} each)
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="h-5 w-5 rounded bg-white text-slate-700 hover:text-slate-950 flex items-center justify-center shadow-2xs transition-colors font-bold"
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <span className="text-xs font-black text-slate-900 px-1.5">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="h-5 w-5 rounded bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 shadow-2xs transition-colors font-bold"
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>

                {/* Modifiers & Cooking Preferences */}
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                      🌶️ {item.spicePreference || item.spiceLevel}
                    </span>
                    {item.notes && (
                      <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded italic truncate max-w-[120px]">
                        "{item.notes}"
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setEditingModifierId(
                        editingModifierId === item.id ? null : item.id
                      )
                    }
                    className="text-[10px] text-amber-700 hover:text-amber-800 font-bold underline underline-offset-2"
                  >
                    {editingModifierId === item.id ? "Done" : "Customize"}
                  </button>
                </div>

                {/* Inline Modifier Editor */}
                {editingModifierId === item.id && (
                  <div className="mt-1 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 space-y-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-600 font-bold block mb-1">
                        Spice Preference:
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {["MILD", "MEDIUM", "SPICY", "VERY_SPICY"].map((spice) => (
                          <button
                            key={spice}
                            onClick={() =>
                              updateItemModifiers(item.id, { spicePreference: spice })
                            }
                            className={`py-1 px-1 rounded text-[9px] font-black truncate border transition-all ${
                              item.spicePreference === spice
                                ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {spice === "VERY_SPICY" ? "V.Hot" : spice}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-600 font-bold block mb-1">
                        Kitchen Instructions:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Extra gravy, well done, less oil"
                        value={item.notes || ""}
                        onChange={(e) =>
                          updateItemModifiers(item.id, { notes: e.target.value })
                        }
                        className="w-full rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Order Notes & GST Summary Footer */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white space-y-3">
            <div>
              <input
                type="text"
                placeholder="Overall ticket instructions for chef..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Indian GST Computation Preview */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">{formatINR(taxDetails.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>CGST (2.5%)</span>
                <span>{formatINR(taxDetails.cgstAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>SGST (2.5%)</span>
                <span>{formatINR(taxDetails.sgstAmount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-black text-slate-900">Estimated Total</span>
                <span className="text-lg font-black text-amber-700">
                  {formatINR(taxDetails.grandTotal)}
                </span>
              </div>
            </div>

            {/* Send to Kitchen Dispatch Button */}
            <button
              onClick={handleSendToKitchen}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 active:scale-98 transition-all disabled:opacity-50"
            >
              <Send className="h-4 w-4 stroke-[2.5]" />
              <span>{isSubmitting ? "Transmitting..." : "Send to Kitchen (KDS)"}</span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL: Floor / Table Selector */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-600" />
                  Select Floor Table / Counter
                </h3>
                <p className="text-xs text-slate-500">
                  Select seated dining table or express takeaway station
                </p>
              </div>
              <button
                onClick={() => setShowTableModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-5 max-h-96 overflow-y-auto">
              {tables.map((table) => {
                const isSelected = selectedTable?.id === table.id;
                return (
                  <button
                    key={table.id}
                    onClick={() => {
                      setSelectedTable(table);
                      setShowTableModal(false);
                    }}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-500 font-bold shadow-xs"
                        : table.status === "AVAILABLE"
                        ? "border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/40"
                        : table.status === "OCCUPIED"
                        ? "border-amber-200 bg-amber-50/40 text-amber-900 hover:border-amber-400"
                        : "border-purple-200 bg-purple-50/40 text-purple-900"
                    }`}
                  >
                    <span className="text-base font-black">{table.name}</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Cap: {table.capacity} guests
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        table.status === "AVAILABLE"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : table.status === "OCCUPIED"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-purple-100 text-purple-800 border border-purple-300"
                      }`}
                    >
                      {table.status}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowTableModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
