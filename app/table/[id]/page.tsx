"use client";

import { useState, useEffect, use } from "react";
import {
  UtensilsCrossed,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Search,
  Send,
} from "lucide-react";
import confetti from "canvas-confetti";
import { formatINR, calculateRestaurantGST } from "@/lib/gst";
import { FssaiDotBadge, CulinaryTags } from "@/components/DietaryBadge";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  spiceLevel: string;
  dietaryTag: string;
  prepTimeMinutes: number;
  isAvailable: boolean;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

export default function TableQRPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const tableIdOrNumber = resolvedParams.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<
    { item: MenuItem; quantity: number; notes: string }[]
  >([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [dietary, setDietary] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [orderPlaced, setOrderPlaced] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [guestNotes, setGuestNotes] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [menuRes, tablesRes] = await Promise.all([
          fetch("/api/menu"),
          fetch("/api/tables"),
        ]);
        const menuJson = await menuRes.json();
        const tablesJson = await tablesRes.json();

        if (menuJson.success) setCategories(menuJson.data);
        if (tablesJson.success && Array.isArray(tablesJson.data)) {
          const found = tablesJson.data.find(
            (t: any) =>
              t.id === tableIdOrNumber ||
              t.number.toString() === tableIdOrNumber
          );
          setTableInfo(
            found || {
              id: tableIdOrNumber,
              number: parseInt(tableIdOrNumber) || 1,
              name: `Table ${tableIdOrNumber}`,
            }
          );
        }
      } catch (err) {
        console.error("Failed to load table ordering data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tableIdOrNumber]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === item.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, { item, quantity: 1, notes: "" }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === itemId) {
            const n = c.quantity + delta;
            return n > 0 ? { ...c, quantity: n } : null;
          }
          return c;
        })
        .filter((c): c is { item: MenuItem; quantity: number; notes: string } => c !== null)
    );
  };

  const allItems = categories.flatMap((c) => c.items);
  const filteredItems = allItems.filter((i) => {
    const matchesCat = activeCategory === "all" || i.categoryId === activeCategory;
    const matchesDiet =
      dietary === "ALL" ||
      (dietary === "VEG" && (i.dietaryTag === "VEG" || i.dietaryTag === "VEGAN")) ||
      (dietary === "NON_VEG" && i.dietaryTag === "NON_VEG");
    const matchesSearch =
      search === "" ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesDiet && matchesSearch;
  });

  const subtotal = cart.reduce((s, c) => s + c.item.price * c.quantity, 0);
  const tax = calculateRestaurantGST(subtotal);
  const totalItemsCount = cart.reduce((s, c) => s + c.quantity, 0);

  async function handlePlaceGuestOrder() {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: tableInfo?.id,
          orderType: "DINE_IN",
          items: cart.map((c) => ({
            menuItemId: c.item.id,
            quantity: c.quantity,
            unitPrice: c.item.price,
            spicePreference: c.item.spiceLevel,
            notes: c.notes,
          })),
          specialNotes: guestNotes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#d97706", "#16a34a", "#ea580c"],
        });
        setOrderPlaced(json.data);
        setCart([]);
        setIsCartOpen(false);
      } else {
        alert(json.error || "Failed to submit order");
      }
    } catch (err) {
      console.error("Guest order placement error:", err);
      alert("Error submitting order to kitchen");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-800 max-w-lg mx-auto pb-24 border-x border-slate-200 shadow-xl">
      {/* Mobile Restaurant Header */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center text-white font-black shadow-xs">
              <UtensilsCrossed className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">
                Dine<span className="text-amber-600">Flow</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Authentic Kerala Dining</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black">
            <span>{tableInfo ? tableInfo.name : `Table ${tableIdOrNumber}`}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Porotta, Biryani, Curries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Dietary Filter Buttons */}
        <div className="flex items-center gap-2 mt-2.5 overflow-x-auto text-xs">
          <button
            onClick={() => setDietary("ALL")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              dietary === "ALL" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setDietary("VEG")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
              dietary === "VEG"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            <FssaiDotBadge dietaryTag="VEG" size="sm" />
            Pure Veg
          </button>
          <button
            onClick={() => setDietary("NON_VEG")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
              dietary === "NON_VEG"
                ? "bg-rose-50 text-rose-800 border border-rose-300"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            <FssaiDotBadge dietaryTag="NON_VEG" size="sm" />
            Non-Veg
          </button>
        </div>
      </div>

      {/* Categories Horizontal Carousel */}
      <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto border-b border-slate-200 bg-[#FFFDF9] scrollbar-none">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeCategory === "all"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600"
          }`}
        >
          All Categories
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === c.id
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Dishes Mobile List — SLEEK TEXT-FIRST LAYOUT */}
      <div className="flex-1 p-4 space-y-3.5 overflow-y-auto">
        {orderPlaced && (
          <div className="p-4 rounded-3xl border border-emerald-300 bg-emerald-50 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Order Transmitted to Kitchen!</span>
            </div>
            <p className="text-xs text-slate-700">
              Ticket <span className="font-bold text-slate-900 font-mono">{orderPlaced.orderNumber}</span> is
              now being prepared for {tableInfo?.name}.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-800 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Status: {orderPlaced.status}</span>
            </div>
          </div>
        )}

        {filteredItems.map((item) => {
          const inCart = cart.find((c) => c.item.id === item.id);
          return (
            <div
              key={item.id}
              className={`rounded-2xl border bg-white p-4 flex flex-col justify-between gap-3 transition-all shadow-2xs ${
                item.isAvailable
                  ? "border-slate-200 hover:border-amber-300"
                  : "border-slate-200/60 bg-slate-50 opacity-60"
              }`}
            >
              {/* Header & Badges */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5">
                      <FssaiDotBadge dietaryTag={item.dietaryTag} size="md" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {item.name}
                      </h3>
                      <div className="mt-1">
                        <CulinaryTags name={item.name} spiceLevel={item.spiceLevel} />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Price & Add Control */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span className="font-medium">{item.prepTimeMinutes}m</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-amber-700 text-sm">
                    {formatINR(item.price)}
                  </span>

                  {inCart ? (
                    <div className="flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-300 p-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="h-6 w-6 rounded bg-amber-200/70 text-amber-900 flex items-center justify-center font-bold"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-black text-amber-950 px-1.5">
                        {inCart.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="h-6 w-6 rounded bg-amber-600 text-white flex items-center justify-center font-bold"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      disabled={!item.isAvailable}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs flex items-center gap-1"
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

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 shadow-lg">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 text-white font-black text-sm flex items-center justify-between shadow-md shadow-amber-600/20 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              <span>{totalItemsCount} items</span>
            </div>
            <div className="flex items-center gap-2">
              <span>View Ticket</span>
              <span className="font-mono text-base font-black">{formatINR(tax.grandTotal)}</span>
            </div>
          </button>
        </div>
      )}

      {/* Cart Review Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-t-3xl border-t border-slate-200 bg-white p-5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Your Dining Order</h3>
                <p className="text-xs text-slate-500">
                  {tableInfo?.name} • Chef will start preparation immediately
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {cart.map((c) => (
                <div
                  key={c.item.id}
                  className="p-3 rounded-xl border border-slate-200 bg-[#FFFDF9] flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900">{c.item.name}</h4>
                    <span className="text-xs font-black text-amber-700 font-mono">
                      {formatINR(c.item.price * c.quantity)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                    <button
                      onClick={() => updateQuantity(c.item.id, -1)}
                      className="h-6 w-6 rounded bg-white text-slate-700 flex items-center justify-center font-bold shadow-2xs"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-black text-slate-900 px-1">
                      {c.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(c.item.id, 1)}
                      className="h-6 w-6 rounded bg-amber-600 text-white flex items-center justify-center font-bold shadow-2xs"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Special instructions for chef (e.g. less spicy)..."
                  value={guestNotes}
                  onChange={(e) => setGuestNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* GST 5% Details */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatINR(tax.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Restaurant GST (5%)</span>
                  <span>{formatINR(tax.totalTax)}</span>
                </div>
                <div className="pt-2 border-t border-amber-200 flex justify-between font-bold text-sm">
                  <span className="text-slate-900">Total Amount</span>
                  <span className="text-amber-700 font-black">{formatINR(tax.grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={handlePlaceGuestOrder}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 active:scale-98 transition-all disabled:opacity-50"
              >
                <Send className="h-4 w-4 stroke-[2.5]" />
                <span>{isSubmitting ? "Transmitting..." : "Send Order to Kitchen"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
