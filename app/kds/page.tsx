"use client";

import { useState, useEffect } from "react";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  AlertTriangle,
  Volume2,
  VolumeX,
  RefreshCw,
  Utensils,
  Radio,
} from "lucide-react";
import confetti from "canvas-confetti";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  spicePreference?: string;
  notes?: string;
  status: string;
  menuItem: {
    id: string;
    name: string;
    spiceLevel: string;
    dietaryTag: string;
  };
}

interface KDSTicket {
  id: string;
  orderNumber: string;
  orderType: string;
  status: "SENT_TO_KITCHEN" | "PREPARING" | "READY" | "SERVED";
  table?: {
    number: number;
    name: string;
  } | null;
  specialNotes?: string;
  createdAt: string;
  items: OrderItem[];
}

export default function KitchenDisplayPage() {
  const [tickets, setTickets] = useState<KDSTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [now, setNow] = useState<number>(Date.now());
  const [newTicketAlert, setNewTicketAlert] = useState<string | null>(null);

  const playChime = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio context might be restricted before gesture
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function fetchActiveTickets() {
    try {
      setLoading(true);
      const res = await fetch("/api/orders?active=true");
      const json = await res.json();
      if (json.success) {
        setTickets(json.data);
      }
    } catch (err) {
      console.error("Failed to load KDS tickets:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchActiveTickets();

    const eventSource = new EventSource("/api/kds/events");

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "ORDER_CREATED") {
          playChime();
          setNewTicketAlert(payload.orderNumber || "New Ticket");
          setTimeout(() => setNewTicketAlert(null), 4000);

          setTickets((prev) => {
            if (prev.some((t) => t.id === payload.data.id)) return prev;
            return [payload.data, ...prev];
          });
        } else if (payload.type === "ORDER_STATUS_CHANGED") {
          setTickets((prev) =>
            prev
              .map((t) => (t.id === payload.data.id ? payload.data : t))
              .filter((t) => t.status !== "BILLED" && t.status !== "CANCELLED")
          );
        } else if (payload.type === "BILL_SETTLED") {
          setTickets((prev) => prev.filter((t) => t.id !== payload.orderId));
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [soundEnabled]);

  async function handleAdvanceStatus(ticket: KDSTicket) {
    let nextStatus: string;
    if (ticket.status === "SENT_TO_KITCHEN") nextStatus = "PREPARING";
    else if (ticket.status === "PREPARING") nextStatus = "READY";
    else if (ticket.status === "READY") nextStatus = "SERVED";
    else return;

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: ticket.id,
          status: nextStatus,
        }),
      });

      const json = await res.json();
      if (json.success) {
        if (nextStatus === "READY") {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#16a34a", "#22c55e", "#d97706"],
          });
        }
        setTickets((prev) =>
          prev
            .map((t) => (t.id === ticket.id ? json.data : t))
            .filter((t) => nextStatus !== "SERVED" || t.id !== ticket.id)
        );
      }
    } catch (err) {
      console.error("Failed to advance ticket status:", err);
    }
  }

  const getElapsed = (createdAtStr: string) => {
    const diffMs = Math.max(0, now - new Date(createdAtStr).getTime());
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return {
      mins,
      secs,
      formatted: `${mins}m ${secs < 10 ? "0" : ""}${secs}s`,
      isUrgent: mins >= 20,
      isWarning: mins >= 10 && mins < 20,
    };
  };

  const filteredTickets = tickets.filter((t) => {
    if (activeFilter === "ALL") return t.status !== "SERVED";
    return t.status === activeFilter;
  });

  const countSent = tickets.filter((t) => t.status === "SENT_TO_KITCHEN").length;
  const countPreparing = tickets.filter((t) => t.status === "PREPARING").length;
  const countReady = tickets.filter((t) => t.status === "READY").length;

  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F6] text-slate-800 overflow-hidden">
      {/* KDS Header & Stats Bar */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title & Live Badge */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700">
              <ChefHat className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  Kitchen Display System
                </h1>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync (SSE)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Real-time synchronized ticket dispatcher for chefs & kitchen staff
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-bold">
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-800">
              <span className="text-rose-600 font-black text-sm mr-1.5">{countSent}</span>
              New Orders
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-800">
              <span className="text-amber-600 font-black text-sm mr-1.5">{countPreparing}</span>
              Cooking
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800">
              <span className="text-emerald-600 font-black text-sm mr-1.5">{countReady}</span>
              Ready to Serve
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-slate-200 bg-slate-100 text-slate-400"
              }`}
              title={soundEnabled ? "Mute alert chime" : "Enable alert chime"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Manual Refresh */}
            <button
              onClick={fetchActiveTickets}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-colors"
              title="Refresh tickets"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100 overflow-x-auto text-xs">
          {[
            { id: "ALL", label: `All Active (${tickets.length})` },
            { id: "SENT_TO_KITCHEN", label: `New Tickets (${countSent})` },
            { id: "PREPARING", label: `In Prep (${countPreparing})` },
            { id: "READY", label: `Ready (${countReady})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3.5 py-1 rounded-xl font-bold transition-all ${
                activeFilter === f.id
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* New Ticket Flash Alert Banner */}
      {newTicketAlert && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-2 text-center text-xs font-black text-white shadow-md animate-bounce">
          ⚡ INCOMING KITCHEN ORDER: {newTicketAlert} — Ticket Added in Real-Time!
        </div>
      )}

      {/* Tickets Kanban Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center text-slate-400">
            <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3 text-emerald-600">
              <CheckCircle2 className="h-8 w-8 stroke-[2]" />
            </div>
            <h3 className="text-base font-bold text-slate-800">All orders clear!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              No pending tickets in this category. Place a new order from POS or Table QR to see it stream live.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTickets.map((ticket) => {
              const elapsed = getElapsed(ticket.createdAt);

              const timerBadge = elapsed.isUrgent
                ? "bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse"
                : elapsed.isWarning
                ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
                : "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";

              return (
                <div
                  key={ticket.id}
                  className={`rounded-2xl border bg-white flex flex-col justify-between overflow-hidden shadow-xs transition-all duration-200 ${
                    ticket.status === "READY"
                      ? "border-emerald-300 ring-2 ring-emerald-400/30"
                      : elapsed.isUrgent
                      ? "border-rose-400 ring-2 ring-rose-400/30"
                      : "border-slate-200 hover:border-amber-300 hover:shadow-md"
                  }`}
                >
                  {/* Ticket Header */}
                  <div className="p-3.5 border-b border-slate-100 bg-[#FFFDF9] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 tracking-wide">
                          {ticket.orderNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                            ticket.orderType === "TAKEAWAY"
                              ? "bg-purple-100 text-purple-800 border-purple-300"
                              : "bg-blue-100 text-blue-800 border-blue-300"
                          }`}
                        >
                          {ticket.table?.name || ticket.orderType}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(ticket.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Elapsed Ticker */}
                    <div
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono ${timerBadge}`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>{elapsed.formatted}</span>
                    </div>
                  </div>

                  {/* Special Ticket Notes */}
                  {ticket.specialNotes && (
                    <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="italic line-clamp-1">{ticket.specialNotes}</span>
                    </div>
                  )}

                  {/* Order Dishes List */}
                  <div className="p-3.5 flex-1 space-y-2.5 overflow-y-auto max-h-64 bg-white">
                    {ticket.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-900 text-xs font-black">
                            {item.quantity}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 leading-snug">
                              {item.menuItem.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              {item.spicePreference && (
                                <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1 rounded font-bold">
                                  🌶️ {item.spicePreference}
                                </span>
                              )}
                              {item.notes && (
                                <span className="text-[10px] text-amber-700 italic">
                                  "{item.notes}"
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`h-2 w-2 rounded-full shrink-0 mt-1 ${
                            item.menuItem.dietaryTag === "VEG" ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                          title={item.menuItem.dietaryTag}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Action Step Footer */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100">
                    {ticket.status === "SENT_TO_KITCHEN" && (
                      <button
                        onClick={() => handleAdvanceStatus(ticket)}
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98"
                      >
                        <Flame className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>Start Cooking</span>
                      </button>
                    )}

                    {ticket.status === "PREPARING" && (
                      <button
                        onClick={() => handleAdvanceStatus(ticket)}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>Mark as Ready</span>
                      </button>
                    )}

                    {ticket.status === "READY" && (
                      <button
                        onClick={() => handleAdvanceStatus(ticket)}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98"
                      >
                        <Utensils className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>Mark as Served</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
