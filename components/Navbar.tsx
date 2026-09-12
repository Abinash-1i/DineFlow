"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  UtensilsCrossed,
  LayoutGrid,
  ChefHat,
  MenuSquare,
  Receipt,
  Sparkles,
  QrCode,
  Shield,
  Radio,
  ChevronDown,
} from "lucide-react";
import { usePosStore, UserRole } from "@/lib/store";

export default function Navbar() {
  const pathname = usePathname();
  const { currentRole, setRole } = usePosStore();
  const [activeTicketsCount, setActiveTicketsCount] = useState<number>(3);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Poll or listen for active KDS tickets count
  useEffect(() => {
    async function checkActiveOrders() {
      try {
        const res = await fetch("/api/orders?active=true");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setActiveTicketsCount(json.data.length);
        }
      } catch {
        // Ignore network glitches
      }
    }
    checkActiveOrders();
    const interval = setInterval(checkActiveOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    {
      name: "POS Floor",
      href: "/pos",
      icon: LayoutGrid,
      badge: null,
      allowedRoles: ["ADMIN", "CASHIER"],
    },
    {
      name: "Kitchen Display (KDS)",
      href: "/kds",
      icon: ChefHat,
      badge: activeTicketsCount > 0 ? activeTicketsCount : null,
      allowedRoles: ["ADMIN", "KITCHEN_STAFF"],
    },
    {
      name: "Menu",
      href: "/menu",
      icon: MenuSquare,
      badge: null,
      allowedRoles: ["ADMIN", "CASHIER"],
    },
    {
      name: "Billing & GST",
      href: "/billing",
      icon: Receipt,
      badge: null,
      allowedRoles: ["ADMIN", "CASHIER"],
    },
    {
      name: "AI Sales Intelligence",
      href: "/analytics",
      icon: Sparkles,
      badge: "Gemini",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      allowedRoles: ["ADMIN"],
    },
  ];

  const rolesList: { role: UserRole; title: string; color: string }[] = [
    { role: "ADMIN", title: "Admin (Manager)", color: "text-amber-800 bg-amber-50 border-amber-300" },
    { role: "CASHIER", title: "Cashier", color: "text-emerald-800 bg-emerald-50 border-emerald-300" },
    { role: "KITCHEN_STAFF", title: "Kitchen Staff", color: "text-blue-800 bg-blue-50 border-blue-300" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber-200/70 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <Link href="/pos" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 shadow-md group-hover:scale-105 transition-transform duration-200">
              <UtensilsCrossed className="h-5 w-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900 font-sans">
                  Dine<span className="text-amber-600">Flow</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  <Radio className="h-2.5 w-2.5 animate-pulse text-amber-600" />
                  KDS Live
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-slate-500 font-medium tracking-wide">
                AI-Powered Restaurant Order & Sales Intelligence
              </p>
            </div>
          </Link>
        </div>

        {/* Main Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            const isRestricted = !link.allowedRoles.includes(currentRole);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                  isActive
                    ? "bg-amber-50 text-amber-800 shadow-xs border border-amber-300/80"
                    : isRestricted
                    ? "text-slate-400 hover:text-slate-500 opacity-60"
                    : "text-slate-600 hover:bg-amber-50/50 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-amber-600" : "text-slate-400"}`} />
                <span>{link.name}</span>

                {link.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black border ${
                      link.badgeColor || "bg-rose-500 text-white border-rose-400"
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Table QR Mobile View Preview */}
          <Link
            href="/table/4"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition-colors"
            title="Preview Guest Mobile QR Order Page for Table 4"
          >
            <QrCode className="h-3.5 w-3.5 text-amber-600" />
            <span>Table 4 QR</span>
          </Link>

          {/* RBAC Role Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-amber-600" />
              <span className="hidden sm:inline text-slate-400">Role:</span>
              <span className="font-bold text-amber-700 capitalize">
                {currentRole.replace("_", " ")}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50">
                <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active Role (RBAC)
                </div>
                {rolesList.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      setRole(r.role);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                      currentRole === r.role
                        ? "bg-amber-50 text-amber-900 font-bold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{r.title}</span>
                    {currentRole === r.role && (
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-200 bg-white px-2 py-2 text-xs">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-md ${
                isActive ? "text-amber-600 font-bold" : "text-slate-500"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px]">{link.name.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
