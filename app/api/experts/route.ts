import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const experts = await query(
      "SELECT id, name, email, domain FROM users WHERE role = 'expert' ORDER BY name",
      []
    );
    return NextResponse.json({ success: true, data: experts });
  } catch (error) {
    console.error("GET experts error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch experts" }, { status: 500 });
  }
}