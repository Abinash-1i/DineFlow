import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kdsEvents } from "@/lib/kds-events";
import { calculateRestaurantGST } from "@/lib/gst";

// GET /api/orders - Get orders (filtered by status or active)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const activeOnly = searchParams.get("active") === "true";

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    } else if (activeOnly) {
      whereClause.status = {
        in: ["PENDING", "SENT_TO_KITCHEN", "PREPARING", "READY", "SERVED"],
      };
    }

    const orders = await db.order.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        table: true,
        user: { select: { id: true, name: true, role: true } },
        items: {
          include: {
            menuItem: true,
          },
        },
        invoice: true,
      },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders - Place a new order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tableId,
      orderType = "DINE_IN",
      items = [],
      specialNotes = "",
      userId,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order must contain at least one item." },
        { status: 400 }
      );
    }

    // 1. Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += (item.unitPrice || item.price) * item.quantity;
    }

    const taxCalc = calculateRestaurantGST(subtotal);

    // 2. Generate sequential Order Number
    const countToday = await db.order.count();
    const orderNumber = `DF-${1000 + countToday + 1}`;

    // 3. Create Order and OrderItems in a transaction
    const newOrder = await db.order.create({
      data: {
        orderNumber,
        orderType,
        status: "SENT_TO_KITCHEN", // Direct transmission to kitchen
        tableId: tableId || null,
        userId: userId || null,
        subtotal: taxCalc.subtotal,
        taxAmount: taxCalc.totalTax,
        discountAmount: 0,
        finalAmount: taxCalc.grandTotal,
        paymentStatus: "PENDING",
        specialNotes,
        items: {
          create: items.map((i: any) => ({
            menuItemId: i.menuItemId || i.id,
            quantity: i.quantity,
            unitPrice: i.unitPrice || i.price,
            spicePreference: i.spicePreference || null,
            notes: i.notes || null,
            status: "PENDING",
          })),
        },
      },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // 4. Update Table occupancy status if dine-in
    if (tableId) {
      await db.table.update({
        where: { id: tableId },
        data: {
          status: "OCCUPIED",
          currentOrderId: newOrder.id,
        },
      });
    }

    // 5. Broadcast to real-time Kitchen Display System (KDS)
    kdsEvents.broadcast({
      type: "ORDER_CREATED",
      timestamp: new Date().toISOString(),
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      status: newOrder.status,
      tableNumber: newOrder.table?.number,
      data: newOrder,
    });

    return NextResponse.json({ success: true, data: newOrder });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}

// PATCH /api/orders - Update order status (KDS transitions)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, status, itemStatusUpdates } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const currentOrder = await db.order.findUnique({
      where: { id: orderId },
      include: { table: true },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Update individual items if provided
    if (itemStatusUpdates && Array.isArray(itemStatusUpdates)) {
      for (const update of itemStatusUpdates) {
        await db.orderItem.update({
          where: { id: update.itemId },
          data: { status: update.status },
        });
      }
    }

    // Update order status
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        ...(status ? { status } : {}),
      },
      include: {
        table: true,
        items: {
          include: { menuItem: true },
        },
      },
    });

    // If order was served or ready, table status updates
    if (status === "READY" && currentOrder.tableId) {
      await db.table.update({
        where: { id: currentOrder.tableId },
        data: { status: "OCCUPIED" },
      });
    }

    // Broadcast change to KDS and POS
    kdsEvents.broadcast({
      type: "ORDER_STATUS_CHANGED",
      timestamp: new Date().toISOString(),
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      tableNumber: updatedOrder.table?.number,
      data: updatedOrder,
    });

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error("PATCH /api/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
