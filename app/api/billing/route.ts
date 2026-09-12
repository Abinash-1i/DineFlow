import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateRestaurantGST } from "@/lib/gst";
import { kdsEvents } from "@/lib/kds-events";

// GET /api/billing - Get orders awaiting billing or recent settled invoices
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") || "pending"; // pending or invoices

    if (view === "invoices") {
      const invoices = await db.invoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          order: {
            include: {
              table: true,
              items: { include: { menuItem: true } },
            },
          },
        },
      });
      return NextResponse.json({ success: true, data: invoices });
    }

    // Orders ready to be billed (SERVED, READY, or active)
    const billableOrders = await db.order.findMany({
      where: {
        status: { in: ["SERVED", "READY", "PREPARING", "SENT_TO_KITCHEN"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        table: true,
        items: {
          include: { menuItem: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: billableOrders });
  } catch (error) {
    console.error("GET /api/billing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch billing data" },
      { status: 500 }
    );
  }
}

// POST /api/billing - Settle Bill and Generate Invoice
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      paymentMethod = "UPI",
      splitDetails = null,
      customerName = "Valued Guest",
      customerPhone = "",
      discount = 0,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { table: true, items: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Compute GST 5% breakdown
    const taxCalc = calculateRestaurantGST(order.subtotal, discount);

    // Generate Invoice Number
    const invoiceCount = await db.invoice.count();
    const invoiceNumber = `INV-2026-${1000 + invoiceCount + 1}`;

    // Transaction to update order and create invoice
    const result = await db.$transaction(async (tx) => {
      // 1. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          subtotal: taxCalc.subtotal,
          cgst: taxCalc.cgstAmount,
          sgst: taxCalc.sgstAmount,
          totalAmount: taxCalc.grandTotal,
          paymentMethod,
          splitDetails: splitDetails ? JSON.stringify(splitDetails) : null,
          customerName: customerName || "Valued Guest",
          customerPhone: customerPhone || null,
        },
      });

      // 2. Mark order as BILLED and PAID
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "BILLED",
          paymentStatus: "PAID",
          paymentMethod,
          taxAmount: taxCalc.totalTax,
          discountAmount: taxCalc.discount,
          finalAmount: taxCalc.grandTotal,
        },
      });

      // 3. Mark Table as AVAILABLE
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: {
            status: "AVAILABLE",
            currentOrderId: null,
          },
        });
      }

      return { invoice, order: updatedOrder };
    });

    // Broadcast Bill Settled event
    kdsEvents.broadcast({
      type: "BILL_SETTLED",
      timestamp: new Date().toISOString(),
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: "BILLED",
      tableNumber: order.table?.number,
      data: result.invoice,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("POST /api/billing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process billing and invoice" },
      { status: 500 }
    );
  }
}
