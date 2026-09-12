import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/tables - List all tables with active orders
export async function GET() {
  try {
    const tables = await db.table.findMany({
      orderBy: { number: "asc" },
      include: {
        orders: {
          where: {
            status: { in: ["SENT_TO_KITCHEN", "PREPARING", "READY", "SERVED"] },
          },
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: tables });
  } catch (error) {
    console.error("GET /api/tables error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tables" },
      { status: 500 }
    );
  }
}
