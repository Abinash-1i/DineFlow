import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  generateRestaurantAIInsights,
  askRestaurantAICopilot,
  RestaurantAnalyticsInput,
} from "@/lib/gemini";

export const dynamic = "force-dynamic";

// GET /api/analytics/ai-insights - Executive Sales & Demand Intelligence
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "all"; // all, 7days, today

    const now = new Date();
    let startDate: Date | undefined;
    if (range === "today") {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (range === "7days") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // 1. Fetch completed/billed orders
    const orders = await db.order.findMany({
      where: {
        status: "BILLED",
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No billed orders found for this timeframe.",
      });
    }

    // 2. Aggregate metrics
    const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalRevenue / totalOrders;

    // Aggregate dishes
    const dishMap: Record<
      string,
      { name: string; quantity: number; revenue: number; category: string }
    > = {};

    // Aggregate categories
    const categoryMap: Record<
      string,
      { category: string; count: number; revenue: number }
    > = {};

    // Hourly aggregation
    const hourMap: Record<string, { orders: number; revenue: number }> = {};
    for (let h = 11; h <= 23; h++) {
      const label = `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? "PM" : "AM"}`;
      hourMap[label] = { orders: 0, revenue: 0 };
    }

    for (const order of orders) {
      const orderHour = new Date(order.createdAt).getHours();
      const label = `${orderHour % 12 === 0 ? 12 : orderHour % 12}:00 ${
        orderHour >= 12 ? "PM" : "AM"
      }`;

      if (hourMap[label]) {
        hourMap[label].orders += 1;
        hourMap[label].revenue += order.finalAmount;
      }

      for (const item of order.items) {
        const dishName = item.menuItem.name;
        const catName = item.menuItem.category.name;
        const itemRev = item.unitPrice * item.quantity;

        if (!dishMap[dishName]) {
          dishMap[dishName] = {
            name: dishName,
            quantity: 0,
            revenue: 0,
            category: catName,
          };
        }
        dishMap[dishName].quantity += item.quantity;
        dishMap[dishName].revenue += itemRev;

        if (!categoryMap[catName]) {
          categoryMap[catName] = { category: catName, count: 0, revenue: 0 };
        }
        categoryMap[catName].count += item.quantity;
        categoryMap[catName].revenue += itemRev;
      }
    }

    const topDishes = Object.values(dishMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 7);

    const categoryBreakdown = Object.values(categoryMap).sort(
      (a, b) => b.revenue - a.revenue
    );

    const hourlySales = Object.entries(hourMap).map(([hour, val]) => ({
      hour,
      orders: val.orders,
      revenue: Math.round(val.revenue),
    }));

    // Find peak hour
    let peakHour = "1:00 PM";
    let maxHourOrders = -1;
    for (const h of hourlySales) {
      if (h.orders > maxHourOrders) {
        maxHourOrders = h.orders;
        peakHour = h.hour;
      }
    }

    const analyticsPayload: RestaurantAnalyticsInput = {
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue),
      topDishes,
      categoryBreakdown,
      hourlySales,
      peakHour,
    };

    // 3. Generate Gemini AI Insights
    const aiInsights = await generateRestaurantAIInsights(analyticsPayload);

    return NextResponse.json({
      success: true,
      data: {
        metrics: analyticsPayload,
        ai: aiInsights,
      },
    });
  } catch (error) {
    console.error("GET /api/analytics/ai-insights error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate AI analytics" },
      { status: 500 }
    );
  }
}

// POST /api/analytics/ai-insights - Interactive Gemini Copilot Q&A
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, metrics } = body;

    if (!question) {
      return NextResponse.json(
        { success: false, error: "Question is required" },
        { status: 400 }
      );
    }

    const answer = await askRestaurantAICopilot(question, metrics);
    return NextResponse.json({ success: true, answer });
  } catch (error) {
    console.error("POST /api/analytics/ai-insights error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to query AI copilot" },
      { status: 500 }
    );
  }
}
