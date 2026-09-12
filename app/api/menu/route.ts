import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kdsEvents } from "@/lib/kds-events";
import { seedDatabase } from "@/lib/seed-data";

// GET /api/menu - Get all categories and menu items
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");

    let categories = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          where: {
            ...(categoryId ? { categoryId } : {}),
            ...(search
              ? {
                  OR: [
                    { name: { contains: search } },
                    { description: { contains: search } },
                  ],
                }
              : {}),
          },
          orderBy: { name: "asc" },
        },
      },
    });

    // Automatically seed menu if database is freshly connected and empty
    if (categories.length === 0 && !categoryId && !search) {
      try {
        await seedDatabase();
        categories = await db.category.findMany({
          orderBy: { sortOrder: "asc" },
          include: {
            items: { orderBy: { name: "asc" } },
          },
        });
      } catch (seedErr) {
        console.warn("Auto-seed skipped or tables not created yet:", seedErr);
      }
    }

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("GET /api/menu error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}

// POST /api/menu - Create a new menu item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      price,
      categoryId,
      spiceLevel,
      dietaryTag,
      prepTimeMinutes,
      imageUrl,
      isAvailable,
    } = body;

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { success: false, error: "Name, price, and category are required." },
        { status: 400 }
      );
    }

    const newItem = await db.menuItem.create({
      data: {
        name,
        description: description || "",
        price: parseFloat(price),
        categoryId,
        spiceLevel: spiceLevel || "MEDIUM",
        dietaryTag: dietaryTag || "NON_VEG",
        prepTimeMinutes: parseInt(prepTimeMinutes) || 15,
        imageUrl: imageUrl || "",
        isAvailable: isAvailable ?? true,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({ success: true, data: newItem });
  } catch (error) {
    console.error("POST /api/menu error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}

// PUT /api/menu - Update a menu item (or stock status toggle)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item ID is required" },
        { status: 400 }
      );
    }

    if (updateData.price !== undefined) {
      updateData.price = parseFloat(updateData.price);
    }
    if (updateData.prepTimeMinutes !== undefined) {
      updateData.prepTimeMinutes = parseInt(updateData.prepTimeMinutes);
    }

    const updatedItem = await db.menuItem.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    // Notify listeners if stock availability changed
    if (updateData.isAvailable !== undefined) {
      kdsEvents.broadcast({
        type: "MENU_STOCK_CHANGED",
        timestamp: new Date().toISOString(),
        data: { id, isAvailable: updateData.isAvailable, name: updatedItem.name },
      });
    }

    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error("PUT /api/menu error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// DELETE /api/menu - Delete a menu item
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item ID is required" },
        { status: 400 }
      );
    }

    await db.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/menu error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
