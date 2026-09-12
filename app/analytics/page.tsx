"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  ChefHat,
  ShoppingBag,
  DollarSign,
  Clock,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  Utensils,
  Flame,
  PackageCheck,
  Send,
  Bot,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatINR } from "@/lib/gst";

interface AnalyticsData {
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    peakHour: string;
    topDishes: { name: string; quantity: number; revenue: number; category: string }[];
    categoryBreakdown: { category: string; count: number; revenue: number }[];
    hourlySales: { hour: string; orders: number; revenue: number }[];
  };
  ai: {
    source: string;
    summary: {
      headline: string;
      narrative: string;
      keyHighlight: string;
      performanceScore: number;
    };
    demandForecast: {
      peakTimeRange: string;
      expectedLoad: string;
      prepRecommendations: {
        ingredient: string;
        action: string;
        reason: string;
        urgency: "HIGH" | "MEDIUM" | "LOW";
      }[];
    };
    menuOptimization: {
      starPerformer: string;
      underperformer: string;
      suggestedCombo: {
        name: string;
        items: string[];
        suggestedPrice: number;
        estimatedMarginIncrease: string;
        rationale: string;
      };
    };
    wastageReductionTip: string;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<string>("all");

  const [userQuery, setUserQuery] = useState<string>("");
  const [copilotResponse, setCopilotResponse] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState<boolean>(false);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics/ai-insights?range=${timeRange}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshAI() {
    setIsRegenerating(true);
    await fetchAnalytics();
    setIsRegenerating(false);
  }

  async function handleAskCopilot(queryToAsk?: string) {
    const question = queryToAsk || userQuery;
    if (!question.trim()) return;

    setIsAsking(true);
    setCopilotResponse(null);
    try {
      const res = await fetch("/api/analytics/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          metrics: data?.metrics,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCopilotResponse(json.answer);
      }
    } catch (err) {
      console.error("Failed to ask Copilot:", err);
    } finally {
      setIsAsking(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#FAF9F6] text-slate-500 gap-3">
        <Sparkles className="h-8 w-8 text-amber-600 animate-spin" />
        <p className="text-sm font-bold text-slate-700">
          Synthesizing Gemini AI Sales Intelligence & Kitchen Forecast...
        </p>
      </div>
    );
  }

  const metrics = data?.metrics;
  const ai = data?.ai;

  const quickPrompts = [
    "How do I prevent dough bottlenecks during Friday dinner rush?",
    "Suggest a high-margin Kerala seafood combo for Sunday",
    "Tactics to reduce wastage on fresh coconut milk and fish",
    "How can I lift average order value above ₹400?",
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F6] text-slate-800 overflow-y-auto">
      {/* Top AI Header */}
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8 shadow-2xs">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 shadow-2xs">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">
                  AI Sales Intelligence & Operations
                </h1>
                <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {ai?.source === "gemini-2.5-flash" ? "Google Gemini 2.5 Flash" : "DineFlow Copilot Engine"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Predictive demand modeling, ingredient prep schedules, and real-time revenue optimization
              </p>
            </div>
          </div>

          {/* Time Range Selector & Refresh */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setTimeRange("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeRange === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setTimeRange("7days")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeRange === "7days"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Past 7 Days
              </button>
              <button
                onClick={() => setTimeRange("today")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeRange === "today"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Today
              </button>
            </div>

            <button
              onClick={handleRefreshAI}
              disabled={isRegenerating}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-amber-600 ${isRegenerating ? "animate-spin" : ""}`} />
              <span>{isRegenerating ? "Synthesizing..." : "Refresh Insights"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl w-full p-4 sm:p-8 space-y-7">
        {/* KPI Top Stat Cards */}
        {metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">Total Revenue</span>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                {formatINR(metrics.totalRevenue)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <TrendingUp className="h-3 w-3" />
                <span>GST Compliant Sales</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">Total Orders Billed</span>
                <ShoppingBag className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                {metrics.totalOrders}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 font-medium">
                Dine-In & Takeaway
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">Average Order Value (AOV)</span>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                {formatINR(metrics.averageOrderValue)}
              </div>
              <div className="mt-1 text-[11px] text-emerald-700 font-bold">
                +14% vs benchmark
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">Peak Rush Hour</span>
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-amber-700">
                {metrics.peakHour}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 font-medium">
                Highest table turnover
              </div>
            </div>
          </div>
        )}

        {/* INTERACTIVE GEMINI COPILOT ASSISTANT */}
        <div className="rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-amber-100/50 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-600 text-white shadow-xs">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  Ask DineFlow Gemini Copilot
                  <span className="text-[10px] bg-white border border-amber-300 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    Live Operational Advisory
                  </span>
                </h3>
                <p className="text-xs text-slate-600">
                  Ask strategic questions on Kerala culinary prep, rush hours, menu margins, or staffing
                </p>
              </div>
            </div>
          </div>

          {/* Prompt Suggestion Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setUserQuery(q);
                  handleAskCopilot(q);
                }}
                className="text-[11px] bg-white hover:bg-amber-100/60 text-slate-700 hover:text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl transition-colors text-left font-medium shadow-2xs"
              >
                💬 {q}
              </button>
            ))}
          </div>

          {/* Interactive Chat Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask anything (e.g. How to prepare for Onam rush, or reduce fish spoilage)..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskCopilot()}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-2xs"
            />
            <button
              onClick={() => handleAskCopilot()}
              disabled={isAsking || !userQuery.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-all"
            >
              <Send className="h-4 w-4" />
              <span>{isAsking ? "Analyzing..." : "Ask Copilot"}</span>
            </button>
          </div>

          {/* Response Container */}
          {copilotResponse && (
            <div className="p-4 rounded-2xl border border-amber-200 bg-white space-y-2 text-xs text-slate-800 leading-relaxed shadow-xs">
              <div className="flex items-center gap-2 text-amber-700 font-black">
                <Sparkles className="h-4 w-4" />
                <span>Gemini Copilot Analysis:</span>
              </div>
              <div className="whitespace-pre-wrap font-sans text-slate-700">
                {copilotResponse}
              </div>
            </div>
          )}
        </div>

        {/* AI CORE INTELLIGENCE MODULES */}
        {ai && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Sales Copilot Narrative */}
            <div className="lg:col-span-2 rounded-3xl border border-amber-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" />
                    <span>Gemini Sales Copilot</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-black">
                    <span>Performance Score:</span>
                    <span className="text-sm">{ai.summary.performanceScore}/100</span>
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-900 mt-3 leading-snug">
                  {ai.summary.headline}
                </h3>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  {ai.summary.narrative}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5">
                <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider block">
                    Strategic Operational Lever
                  </span>
                  <p className="text-xs text-slate-700 mt-0.5">
                    {ai.summary.keyHighlight}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Wastage Reduction & Perishables Tip */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-xs space-y-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-black uppercase tracking-wider">
                  <PackageCheck className="h-4 w-4" />
                  <span>Wastage & Perishables</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-3">
                  Fresh Catch & Coconut Milk Preservation
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {ai.wastageReductionTip}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-bold">
                <span>Estimated Spoilage Reduction:</span>
                <span className="font-mono text-sm">~18% saved</span>
              </div>
            </div>
          </div>
        )}

        {/* Predictive Demand Prep Schedule & Smart Combo Bundles */}
        {ai && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Predictive Demand & Kitchen Prep */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-orange-700 text-xs font-black uppercase tracking-wider">
                  <ChefHat className="h-4 w-4" />
                  <span>Predictive Prep Schedule</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-rose-50 text-rose-800 border border-rose-300">
                  Rush Load: {ai.demandForecast.expectedLoad}
                </span>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Peak Velocity Windows:{" "}
                <span className="text-slate-900 font-bold">
                  {ai.demandForecast.peakTimeRange}
                </span>
              </div>

              {/* Prep Steps */}
              <div className="space-y-3">
                {ai.demandForecast.prepRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-[#FAF9F6] flex items-start gap-3"
                  >
                    <div
                      className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1 ${
                        rec.urgency === "HIGH" ? "bg-rose-500 animate-pulse" : "bg-amber-500"
                      }`}
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-slate-900">{rec.ingredient}</h5>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-white text-slate-600 border border-slate-200">
                          {rec.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 font-bold">
                        {rec.action}
                      </p>
                      <p className="text-[11px] text-slate-500">{rec.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Menu Optimization & Combo Promo */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-pink-700 text-xs font-black uppercase tracking-wider">
                  <Flame className="h-4 w-4" />
                  <span>Menu Performance & Combo Bundler</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-black uppercase">
                    ⭐ Star Velocity Dish
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {ai.menuOptimization.starPerformer}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] text-rose-800 font-black uppercase">
                    📉 Underperforming Item
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {ai.menuOptimization.underperformer}
                  </p>
                </div>
              </div>

              {/* Suggested Combo Card */}
              <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900">
                    💡 AI Proposed Combo: {ai.menuOptimization.suggestedCombo.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Margin: {ai.menuOptimization.suggestedCombo.estimatedMarginIncrease}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-700 font-semibold">
                  {ai.menuOptimization.suggestedCombo.items.map((it, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white border border-amber-200 shadow-2xs"
                    >
                      {it}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200">
                  <span className="text-slate-600 font-medium">Bundle Price:</span>
                  <span className="text-sm font-black text-amber-800">
                    {formatINR(ai.menuOptimization.suggestedCombo.suggestedPrice)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-700 leading-relaxed italic">
                  "{ai.menuOptimization.suggestedCombo.rationale}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VISUAL ANALYTICS CHARTS (RECHARTS) */}
        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Order Volume & Revenue */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Hourly Sales & Order Velocity
                  </h4>
                  <p className="text-xs text-slate-500">
                    Peak dining lunch and dinner distribution
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.hourlySales}>
                    <defs>
                      <linearGradient id="salesGradLight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="hour" stroke="#94a3b8" textAnchor="end" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue (₹)"
                      stroke="#d97706"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#salesGradLight)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Kerala Dishes by Sales Volume */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Top Kerala Dishes by Volume
                  </h4>
                  <p className="text-xs text-slate-500">
                    Cumulative units sold across orders
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.topDishes}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#64748b"
                      fontSize={9}
                      width={90}
                      tickFormatter={(name) => name.split("(")[0]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="quantity"
                      name="Units Sold"
                      fill="#16a34a"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
