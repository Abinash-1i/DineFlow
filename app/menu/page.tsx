"use client";

import { useState, useEffect } from "react";
import {
  MenuSquare,
  Plus,
  Edit2,
  Trash2,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Utensils,
  Sparkles,
} from "lucide-react";
import { formatINR } from "@/lib/gst";
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
  category?: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  items: MenuItem[];
}

export default function MenuManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [dietaryFilter, setDietaryFilter] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formSpiceLevel, setFormSpiceLevel] = useState("MEDIUM");
  const [formDietaryTag, setFormDietaryTag] = useState("NON_VEG");
  const [formPrepTime, setFormPrepTime] = useState("15");

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    try {
      setLoading(true);
      const res = await fetch("/api/menu");
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error("Failed to load menu:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedDatabase() {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed");
      const json = await res.json();
      if (json.success) {
        await fetchMenu();
      } else {
        alert(json.error || "Failed to seed menu. Make sure database tables are pushed.");
      }
    } catch (err: any) {
      alert("Error seeding menu: " + err.message);
    } finally {
      setIsSeeding(false);
    }
  }

  function openAddModal() {
    setEditingItem(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormCategoryId(categories[0]?.id || "");
    setFormSpiceLevel("MEDIUM");
    setFormDietaryTag("NON_VEG");
    setFormPrepTime("15");
    setIsModalOpen(true);
  }

  function openEditModal(item: MenuItem) {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormPrice(item.price.toString());
    setFormCategoryId(item.categoryId);
    setFormSpiceLevel(item.spiceLevel);
    setFormDietaryTag(item.dietaryTag);
    setFormPrepTime(item.prepTimeMinutes.toString());
    setIsModalOpen(true);
  }

  async function handleToggleStock(item: MenuItem) {
    const newStatus = !item.isAvailable;
    try {
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: cat.items.map((i) =>
            i.id === item.id ? { ...i, isAvailable: newStatus } : i
          ),
        }))
      );

      await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          isAvailable: newStatus,
        }),
      });
    } catch (err) {
      console.error("Failed to toggle availability:", err);
      fetchMenu();
    }
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!formName || !formPrice || !formCategoryId) {
      alert("Name, price, and category are required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formName,
        description: formDescription,
        price: parseFloat(formPrice),
        categoryId: formCategoryId,
        spiceLevel: formSpiceLevel,
        dietaryTag: formDietaryTag,
        prepTimeMinutes: parseInt(formPrepTime) || 15,
      };

      if (editingItem) {
        const res = await fetch("/api/menu", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingItem.id, ...payload }),
        });
        const json = await res.json();
        if (json.success) {
          setIsModalOpen(false);
          fetchMenu();
        }
      } else {
        const res = await fetch("/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          setIsModalOpen(false);
          fetchMenu();
        }
      }
    } catch (err) {
      console.error("Failed to save menu item:", err);
      alert("Error saving item.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm("Are you sure you want to delete this menu dish?")) return;
    try {
      const res = await fetch(`/api/menu?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchMenu();
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  }

  const allItems = categories.flatMap((c) =>
    c.items.map((i) => ({ ...i, category: { id: c.id, name: c.name } }))
  );

  const filteredItems = allItems.filter((item) => {
    const matchesCategory =
      selectedCategoryId === "ALL" || item.categoryId === selectedCategoryId;
    const matchesDietary =
      dietaryFilter === "ALL" || item.dietaryTag === dietaryFilter;
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDietary && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F6] overflow-y-auto text-slate-800">
      {/* Header Bar */}
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8 shadow-2xs">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700">
              <MenuSquare className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Menu Management</h1>
              <p className="text-xs text-slate-500">
                Text-first digital catalog with FSSAI indicators, stock toggles, and culinary metadata
              </p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs transition-all"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add New Dish</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="mx-auto max-w-7xl mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={dietaryFilter}
              onChange={(e) => setDietaryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Dietary Tags</option>
              <option value="VEG">Vegetarian</option>
              <option value="NON_VEG">Non-Vegetarian</option>
              <option value="VEGAN">Vegan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dishes Cards Grid — SLEEK TEXT-FIRST LAYOUT */}
      <div className="mx-auto max-w-7xl w-full p-4 sm:p-8">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-white border border-dashed border-slate-300 shadow-2xs max-w-md mx-auto my-12">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mb-3.5">
              <Utensils className="h-8 w-8" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              {categories.length === 0 ? "Your Menu is Empty" : "No Dishes Found"}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mb-5 leading-relaxed">
              {categories.length === 0
                ? "Your database is connected, but dishes haven't been seeded yet. Click below to load the authentic Kerala menu."
                : "No dishes matched your current search and dietary filter."}
            </p>
            {categories.length === 0 && (
              <button
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs transition-all disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isSeeding ? "Seeding Menu..." : "Seed 24 Kerala Dishes"}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border bg-white p-4 transition-all duration-200 flex flex-col justify-between shadow-xs ${
                  item.isAvailable
                    ? "border-slate-200 hover:border-amber-300 warm-card-hover"
                    : "border-slate-200/70 bg-slate-50 opacity-75"
                }`}
              >
                {/* Top: FSSAI indicator + Dish Title + Badges + Stock Toggle */}
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

                    {/* Stock Status Button Toggle */}
                    <button
                      onClick={() => handleToggleStock(item)}
                      className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                        item.isAvailable
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100"
                      }`}
                      title="Click to toggle availability"
                    >
                      {item.isAvailable ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                          <span>In Stock</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          <span>Out of Stock</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Culinary Description */}
                  <p className="text-xs text-slate-500 mt-2.5 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Row: Category, Price, Prep Time, and Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-950">
                      {formatINR(item.price)}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {item.category?.name?.split(" ")[0]}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-0.5">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {item.prepTimeMinutes}m
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                      title="Edit Dish"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Dish"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Add / Edit Dish (Text-Only Metadata) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Utensils className="h-5 w-5 text-amber-600" />
                {editingItem ? "Edit Menu Dish" : "Add Authentic Dish"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Malabar Chicken Dum Biryani"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price (INR ₹) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="320"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Spice Level
                  </label>
                  <select
                    value={formSpiceLevel}
                    onChange={(e) => setFormSpiceLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="MILD">Mild</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="SPICY">Spicy</option>
                    <option value="VERY_SPICY">Very Spicy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dietary Tag
                  </label>
                  <select
                    value={formDietaryTag}
                    onChange={(e) => setFormDietaryTag(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="NON_VEG">Non-Veg</option>
                    <option value="VEG">Vegetarian</option>
                    <option value="VEGAN">Vegan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Culinary Description & Ingredients
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the dish preparation style, whole spices, and ingredients..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs"
                >
                  {isSaving ? "Saving..." : editingItem ? "Update Dish" : "Save Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
