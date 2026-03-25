import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Request, User } from "@/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    let requests: Request[];

    if (session.role === "customer") {
      requests = await query<Request>(
        `SELECT r.*, u.name as customer_name 
         FROM requests r 
         JOIN users u ON r.customer_id = u.id 
         WHERE r.customer_id = ? 
         ORDER BY r.created_at DESC`,
        [session.id]
      );
    } else {
      // Experts see only assigned requests
      requests = await query<Request>(
        `SELECT r.*, u.name as customer_name 
         FROM requests r 
         JOIN users u ON r.customer_id = u.id
         JOIN request_experts re ON re.request_id = r.id
         WHERE re.expert_id = ?
         ORDER BY r.created_at DESC`,
        [session.id]
      );
    }

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error("GET requests error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "customer") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, budget, timeframe, notes } = body;

    if (!title || !description || !budget || !timeframe) {
      return NextResponse.json(
        { success: false, error: "Title, description, budget, and timeframe are required" },
        { status: 400 }
      );
    }

    // Create the request
    const result = await execute(
      `INSERT INTO requests (customer_id, title, description, budget, timeframe, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'created')`,
      [session.id, title, description, budget, timeframe, notes || null]
    );
    const requestId = result.insertId;

    // Log creation event
    await execute(
      "INSERT INTO events (request_id, type, text) VALUES (?, 'request_created', ?)",
      [requestId, `Request "${title}" was created.`]
    );

    // Get all experts and assign to this request (up to 5)
    const experts = await query<User>(
      "SELECT id, name FROM users WHERE role = 'expert' LIMIT 5"
    );

    for (const expert of experts) {
      await execute(
        "INSERT INTO request_experts (request_id, expert_id, status) VALUES (?, ?, 'requested')",
        [requestId, expert.id]
      );
    }

    // Update request status to 'sent'
    await execute(
      "UPDATE requests SET status = 'sent' WHERE id = ?",
      [requestId]
    );

    // Log sent event
    await execute(
      "INSERT INTO events (request_id, type, text) VALUES (?, 'request_sent', ?)",
      [requestId, `Request "${title}" was sent to ${experts.length} experts.`]
    );

    const newRequest = await query<Request>(
      "SELECT * FROM requests WHERE id = ?",
      [requestId]
    );

    return NextResponse.json({ success: true, data: newRequest[0] }, { status: 201 });
  } catch (error) {
    console.error("POST request error:", error);
    return NextResponse.json({ success: false, error: "Failed to create request" }, { status: 500 });
  }
}