"use client";

import { Flame, Sparkles, ChefHat, Star, Leaf } from "lucide-react";

interface DietaryBadgeProps {
  dietaryTag: "VEG" | "NON_VEG" | "VEGAN" | string;
  size?: "sm" | "md";
}

/**
 * Standard Indian FSSAI Veg / Non-Veg Indicator:
 * - Veg: Green square border with solid green circle
 * - Non-Veg: Deep brown/red square border with solid brown/red circle
 * - Vegan: Green square border with solid green circle + leaf badge
 */
export function FssaiDotBadge({ dietaryTag, size = "md" }: DietaryBadgeProps) {
  const isVeg = dietaryTag === "VEG" || dietaryTag === "VEGAN";
  const boxSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 rounded-xs border p-0.5 ${boxSize} ${
        isVeg
          ? "border-emerald-700 bg-emerald-50/50"
          : "border-red-800 bg-red-50/50"
      }`}
      title={isVeg ? (dietaryTag === "VEGAN" ? "Pure Vegan" : "Vegetarian") : "Non-Vegetarian"}
    >
      <span
        className={`rounded-full ${dotSize} ${
          isVeg ? "bg-emerald-700" : "bg-red-800"
        }`}
      />
    </div>
  );
}

interface CulinaryBadgeProps {
  name: string;
  spiceLevel?: string;
}

export function CulinaryTags({ name, spiceLevel }: CulinaryBadgeProps) {
  const isChefsSpecial =
    name.includes("Dum Biryani") ||
    name.includes("Beef Roast") ||
    name.includes("Karimeen") ||
    name.includes("Fish Moilee") ||
    name.includes("Sadya") ||
    name.includes("Pradhaman Payasam");

  const isBestseller =
    name.includes("Porotta") ||
    name.includes("Appam") ||
    name.includes("Butter Chicken") ||
    name.includes("Sulaimani") ||
    name.includes("Paneer Butter");

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isChefsSpecial && (
        <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
          <ChefHat className="h-2.5 w-2.5 text-rose-700" />
          Chef's Special
        </span>
      )}

      {isBestseller && (
        <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300">
          <Star className="h-2.5 w-2.5 text-amber-600 fill-amber-500" />
          Bestseller
        </span>
      )}

      {spiceLevel && spiceLevel !== "MILD" && (
        <span
          className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
            spiceLevel === "VERY_SPICY"
              ? "bg-red-100 text-red-900 border border-red-300"
              : "bg-orange-50 text-orange-900 border border-orange-200"
          }`}
          title={`Spice Level: ${spiceLevel}`}
        >
          <Flame className="h-2.5 w-2.5 text-red-600 fill-red-600" />
          {spiceLevel === "VERY_SPICY" ? "Extra Hot" : "Spicy"}
        </span>
      )}
    </div>
  );
}
