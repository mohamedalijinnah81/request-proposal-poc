import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Event } from "@/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId");

  try {
    let events: Event[];

    if (requestId) {
      events = await query<Event>(
        "SELECT * FROM events WHERE request_id = ? ORDER BY created_at DESC LIMIT 20",
        [requestId]
      );
    } else {
      events = await query<Event>(
        "SELECT * FROM events ORDER BY created_at DESC LIMIT 20",
        []
      );
    }

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error("GET events error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch events" }, { status: 500 });
  }
}