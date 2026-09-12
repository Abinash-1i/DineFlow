import { NextRequest, NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed-data";

export async function GET(req: NextRequest) {
  try {
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Seed API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to seed database",
        hint: "Make sure 'npx prisma db push' has been run to create the tables in PostgreSQL.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
