"use client";

import { useState, useEffect } from "react";
import {
  Receipt,
  CreditCard,
  QrCode,
  Banknote,
  Users,
  CheckCircle2,
  Printer,
  FileText,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { calculateRestaurantGST, formatINR, calculateSplitEqual } from "@/lib/gst";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  menuItem: {
    name: string;
    price: number;
    dietaryTag: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  finalAmount: number;
  createdAt: string;
  table?: {
    number: number;
    name: string;
  } | null;
  items: OrderItem[];
}

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  orderId: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  paymentMethod: string;
  customerName?: string;
  createdAt: string;
  order: {
    orderNumber: string;
    table?: { name: string } | null;
    items: OrderItem[];
  };
}

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CASH" | "CARD">("UPI");
  const [splitWays, setSplitWays] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>("Guest Diner");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [isSettling, setIsSettling] = useState<boolean>(false);

  const [printInvoice, setPrintInvoice] = useState<any | null>(null);

  useEffect(() => {
    loadBillingData();
  }, [activeTab]);

  async function loadBillingData() {
    try {
      setLoading(true);
      if (activeTab === "pending") {
        const res = await fetch("/api/billing?view=pending");
        const json = await res.json();
        if (json.success) {
          setOrders(json.data);
          if (json.data.length > 0 && !selectedOrder) {
            setSelectedOrder(json.data[0]);
          }
        }
      } else {
        const res = await fetch("/api/billing?view=invoices");
        const json = await res.json();
        if (json.success) {
          setInvoices(json.data);
        }
      }
    } catch (err) {
      console.error("Billing fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const subtotal = selectedOrder ? selectedOrder.subtotal : 0;
  const tax = calculateRestaurantGST(subtotal);
  const split = calculateSplitEqual(tax.grandTotal, splitWays);

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - tax.grandTotal);

  async function handleSettleBill() {
    if (!selectedOrder) return;
    setIsSettling(true);

    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          paymentMethod,
          customerName,
          customerPhone,
          splitDetails:
            splitWays > 1
              ? { ways: splitWays, perPerson: split.perPerson }
              : null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#d97706", "#16a34a", "#ea580c"],
        });

        setPrintInvoice({
          ...json.data.invoice,
          order: selectedOrder,
        });

        setSelectedOrder(null);
        loadBillingData();
      } else {
        alert(json.error || "Failed to settle bill.");
      }
    } catch (err) {
      console.error("Settlement error:", err);
      alert("Error finalizing payment.");
    } finally {
      setIsSettling(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F6] text-slate-800 overflow-hidden">
      {/* Top Header */}
      <div className="border-b border-slate-200 bg-white px-4 py-3.5 sm:px-8 shadow-2xs">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Billing & Invoicing</h1>
              <p className="text-xs text-slate-500">
                GST 5% compliance (2.5% CGST + 2.5% SGST), UPI QR codes, split-billing & printable receipts
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === "pending"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Active Tables Awaiting Bill ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === "history"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Settled Tax Invoices
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "pending" ? (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Orders Awaiting Settlement */}
          <div className="w-full lg:w-96 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-[#FFFDF9] text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Orders to Settle</span>
              <span className="text-amber-800 font-black">{orders.length} active</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#FAF9F6]">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                  <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-2 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No pending bills!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Orders placed in POS will appear here for settlement.
                  </p>
                </div>
              ) : (
                orders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  return (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                        isSelected
                          ? "border-amber-400 bg-amber-50/90 shadow-sm ring-1 ring-amber-400"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-800 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-slate-900">
                          {order.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          {order.table?.name || order.orderType}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 font-medium">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} items
                        </span>
                        <span className="font-black text-amber-700">
                          {formatINR(order.finalAmount)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Checkout Settlement & GST Breakdown Panel */}
          {selectedOrder ? (
            <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto bg-[#FAF9F6]">
              {/* Center: Order Items Review */}
              <div className="flex-1 p-5 lg:p-7 border-r border-slate-200 overflow-y-auto bg-white">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Order Breakdown — {selectedOrder.orderNumber}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Table: {selectedOrder.table?.name || selectedOrder.orderType} • Placed at{" "}
                      {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    Status: {selectedOrder.status}
                  </span>
                </div>

                {/* Itemized Table */}
                <div className="mt-4 space-y-2">
                  <div className="grid grid-cols-12 text-[11px] font-black text-slate-400 pb-2 border-b border-slate-100 uppercase tracking-wider">
                    <span className="col-span-6">Item Description</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-2 text-right">Rate</span>
                    <span className="col-span-2 text-right">Amount</span>
                  </div>

                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 text-xs py-2 border-b border-slate-100 text-slate-800 items-center"
                    >
                      <span className="col-span-6 font-semibold text-slate-900">
                        {item.menuItem.name}
                      </span>
                      <span className="col-span-2 text-center font-mono">
                        {item.quantity}
                      </span>
                      <span className="col-span-2 text-right text-slate-500">
                        {formatINR(item.unitPrice)}
                      </span>
                      <span className="col-span-2 text-right font-black text-amber-800">
                        {formatINR(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Split Bill Calculator */}
                <div className="mt-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-amber-600" />
                      Split Bill Among Diners
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          onClick={() => setSplitWays(num)}
                          className={`h-7 w-7 rounded-lg text-xs font-bold transition-all ${
                            splitWays === num
                              ? "bg-amber-600 text-white font-black shadow-xs"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {splitWays > 1 && (
                    <div className="p-2.5 rounded-xl bg-white border border-amber-300 flex items-center justify-between text-xs">
                      <span className="text-amber-900 font-bold">
                        Split into {splitWays} equal shares:
                      </span>
                      <span className="text-base font-black text-amber-700">
                        {formatINR(split.perPerson)} / person
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Payment Method & Settlement Trigger */}
              <div className="w-full lg:w-96 p-5 lg:p-7 bg-[#FFFDF9] flex flex-col justify-between space-y-6">
                <div className="space-y-5">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Payment & GST Settlement
                  </h3>

                  {/* Payment Mode Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod("UPI")}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === "UPI"
                          ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500 font-black shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <QrCode className="h-5 w-5 text-amber-600" />
                      <span className="text-xs font-bold">UPI QR</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod("CASH")}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === "CASH"
                          ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500 font-black shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Banknote className="h-5 w-5 text-emerald-600" />
                      <span className="text-xs font-bold">Cash</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod("CARD")}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === "CARD"
                          ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500 font-black shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <span className="text-xs font-bold">Card POS</span>
                    </button>
                  </div>

                  {/* Payment Mode Details */}
                  {paymentMethod === "UPI" && (
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col items-center text-center space-y-2 shadow-xs">
                      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                        <svg className="w-28 h-28" viewBox="0 0 100 100">
                          <rect width="100" height="100" fill="#ffffff" />
                          <path
                            d="M10 10h30v30h-30z M60 10h30v30h-30z M10 60h30v30h-30z"
                            fill="#000000"
                          />
                          <path
                            d="M18 18h14v14h-14z M68 18h14v14h-14z M18 68h14v14h-14z"
                            fill="#ffffff"
                          />
                          <path
                            d="M22 22h6v6h-6z M72 22h6v6h-6z M22 72h6v6h-6z"
                            fill="#000000"
                          />
                          <rect x="45" y="15" width="8" height="25" fill="#000000" />
                          <rect x="15" y="45" width="25" height="8" fill="#000000" />
                          <rect x="55" y="55" width="12" height="12" fill="#000000" />
                          <rect x="75" y="55" width="15" height="8" fill="#000000" />
                          <rect x="55" y="75" width="20" height="15" fill="#000000" />
                          <rect x="80" y="80" width="10" height="10" fill="#000000" />
                        </svg>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-800">
                        VPA: dineflow@icici
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Scan with GPay, PhonePe, or Paytm to pay {formatINR(tax.grandTotal)}
                      </span>
                    </div>
                  )}

                  {paymentMethod === "CASH" && (
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
                      <label className="text-xs text-slate-700 font-bold block">
                        Cash Tendered (₹):
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 1000"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                      />
                      {tenderedNum > 0 && (
                        <div className="flex justify-between text-xs pt-1 border-t border-slate-100 font-bold">
                          <span className="text-slate-600">Change Due:</span>
                          <span className="text-emerald-700 font-mono text-sm font-black">
                            {formatINR(changeDue)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customer Receipt Fields */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-600 font-bold block mb-1">
                        Customer Name (Optional):
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* GST 5% Breakdown Summary */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs shadow-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-900">{formatINR(tax.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>CGST (2.5%)</span>
                      <span className="font-mono">{formatINR(tax.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>SGST (2.5%)</span>
                      <span className="font-mono">{formatINR(tax.sgstAmount)}</span>
                    </div>
                    {tax.roundOff !== 0 && (
                      <div className="flex justify-between text-slate-400 text-[10px]">
                        <span>Round-off</span>
                        <span>{tax.roundOff > 0 ? `+${tax.roundOff}` : tax.roundOff}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                      <span className="text-sm font-black text-slate-900">Grand Total</span>
                      <span className="text-xl font-black text-amber-700">
                        {formatINR(tax.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Settle & Generate Invoice Button */}
                <button
                  onClick={handleSettleBill}
                  disabled={isSettling}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
                >
                  <ShieldCheck className="h-5 w-5" />
                  <span>{isSettling ? "Settling..." : "Settle Bill & Print Invoice"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center h-full text-center text-slate-400 p-8">
              <Receipt className="h-16 w-16 text-slate-300 mb-3 stroke-[1.5]" />
              <h3 className="text-base font-bold text-slate-700">Select an Order</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Choose an active order from the left pane to calculate GST, split the bill, and generate an invoice.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: Settled Tax Invoices History */
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto w-full">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-[#FFFDF9] flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-600" />
                Historical Settled Invoices
              </h2>
              <span className="text-xs text-slate-500">{invoices.length} invoices stored</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-100 bg-slate-50 text-[11px] text-slate-500 uppercase font-black">
                  <tr>
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">Order #</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5 text-right">Tax (5%)</th>
                    <th className="p-3.5 text-right">Total (₹)</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {inv.order?.orderNumber}
                      </td>
                      <td className="p-3.5 text-slate-800 font-semibold">{inv.customerName || "Guest"}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(inv.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-500">
                        {formatINR(inv.cgst + inv.sgst)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-amber-700">
                        {formatINR(inv.totalAmount)}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setPrintInvoice(inv)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-800 font-bold flex items-center gap-1 mx-auto transition-colors"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Reprint</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Printable / Downloadable Branded DineFlow Tax Invoice */}
      {printInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white text-slate-900 p-6 shadow-2xl space-y-4">
            <div id="printable-invoice" className="space-y-4 font-sans text-xs">
              {/* Restaurant Header Branding */}
              <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
                <h1 className="text-lg font-black tracking-tight text-slate-950">
                  DineFlow Malabar & Kerala Bistro
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  Authentic Kerala Cuisine & Royal Malabar Delicacies
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  MG Road, Kochi, Kerala - 682016
                </p>
                <div className="flex justify-center gap-3 text-[9px] text-slate-500 font-mono mt-1">
                  <span>GSTIN: 32AABCU9603R1ZM</span>
                  <span>FSSAI: 11324001000542</span>
                </div>
              </div>

              {/* Invoice Metadata */}
              <div className="grid grid-cols-2 gap-1 text-[11px] border-b border-slate-200 pb-2">
                <div>
                  <span className="text-slate-500">Invoice: </span>
                  <span className="font-bold">{printInvoice.invoiceNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Order: </span>
                  <span className="font-bold">{printInvoice.order?.orderNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">Date: </span>
                  <span>{new Date(printInvoice.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Time: </span>
                  <span>{new Date(printInvoice.createdAt || Date.now()).toLocaleTimeString()}</span>
                </div>
                <div>
                  <span className="text-slate-500">Guest: </span>
                  <span className="font-semibold">{printInvoice.customerName || "Valued Diner"}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Payment: </span>
                  <span className="font-bold">{printInvoice.paymentMethod}</span>
                </div>
              </div>

              {/* Dishes List */}
              <div className="space-y-1.5 border-b border-slate-200 pb-3">
                <div className="grid grid-cols-12 font-bold text-[10px] text-slate-500 uppercase border-b border-slate-200 pb-1">
                  <span className="col-span-7">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-3 text-right">Price</span>
                </div>
                {printInvoice.order?.items?.map((i: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px]">
                    <span className="col-span-7 font-semibold text-slate-800">
                      {i.menuItem?.name}
                    </span>
                    <span className="col-span-2 text-center font-mono">
                      {i.quantity}
                    </span>
                    <span className="col-span-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(i.unitPrice * i.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tax & Grand Total */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatINR(printInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>CGST (2.5%)</span>
                  <span className="font-mono">{formatINR(printInvoice.cgst)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>SGST (2.5%)</span>
                  <span className="font-mono">{formatINR(printInvoice.sgst)}</span>
                </div>
                <div className="pt-2 border-t-2 border-dashed border-slate-300 flex justify-between items-baseline font-bold text-sm">
                  <span>TOTAL AMOUNT PAID</span>
                  <span className="font-black text-base text-amber-700">{formatINR(printInvoice.totalAmount)}</span>
                </div>
              </div>

              <div className="text-center pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                <p className="font-bold text-slate-700">
                  Thank you for dining with DineFlow! Visit us again.
                </p>
                <p className="mt-0.5">Authentic Malabar Hospitality</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setPrintInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="h-4 w-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
