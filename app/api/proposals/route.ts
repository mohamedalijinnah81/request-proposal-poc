import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Proposal } from "@/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId");

  try {
    let proposals: Proposal[];

    if (requestId) {
      proposals = await query<Proposal>(
        `SELECT p.*, u.name as expert_name, u.domain as expert_domain 
         FROM proposals p 
         JOIN users u ON p.expert_id = u.id 
         WHERE p.request_id = ? 
         ORDER BY p.updated_at DESC`,
        [requestId]
      );
    } else if (session.role === "expert") {
      proposals = await query<Proposal>(
        `SELECT p.*, u.name as expert_name, u.domain as expert_domain 
         FROM proposals p 
         JOIN users u ON p.expert_id = u.id 
         WHERE p.expert_id = ? 
         ORDER BY p.updated_at DESC`,
        [session.id]
      );
    } else {
      proposals = [];
    }

    return NextResponse.json({ success: true, data: proposals });
  } catch (error) {
    console.error("GET proposals error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch proposals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "expert") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { requestId, subject, message, price, attachmentName } = body;

    if (!requestId || !subject || !message || !price) {
      return NextResponse.json(
        { success: false, error: "requestId, subject, message, and price are required" },
        { status: 400 }
      );
    }

    // Check if expert is assigned to this request
    const assigned = await query(
      "SELECT id FROM request_experts WHERE request_id = ? AND expert_id = ?",
      [requestId, session.id]
    );
    if (!assigned.length) {
      return NextResponse.json({ success: false, error: "Not assigned to this request" }, { status: 403 });
    }

    // Check for existing proposal
    const existing = await query<Proposal>(
      "SELECT * FROM proposals WHERE request_id = ? AND expert_id = ? LIMIT 1",
      [requestId, session.id]
    );

    let proposalId: number;
    let isUpdate = false;

    if (existing.length) {
      // Update existing proposal
      isUpdate = true;
      const newVersion = existing[0].version + 1;
      const newStatus = newVersion > 1 ? "updated_proposal_received" : "proposal_received";

      await execute(
        `UPDATE proposals 
         SET subject = ?, message = ?, price = ?, attachment_name = ?, version = ?, status = ?, updated_at = NOW()
         WHERE id = ?`,
        [subject, message, price, attachmentName || null, newVersion, newStatus, existing[0].id]
      );
      proposalId = existing[0].id;

      // Update request_experts status
      await execute(
        "UPDATE request_experts SET status = ? WHERE request_id = ? AND expert_id = ?",
        [newStatus, requestId, session.id]
      );

      // Log event
      await execute(
        "INSERT INTO events (request_id, type, text) VALUES (?, 'proposal_updated', ?)",
        [requestId, `${session.name} submitted an updated proposal (v${newVersion}).`]
      );
    } else {
      // Create new proposal
      const result = await execute(
        `INSERT INTO proposals (request_id, expert_id, subject, message, price, attachment_name, status, version)
         VALUES (?, ?, ?, ?, ?, ?, 'proposal_received', 1)`,
        [requestId, session.id, subject, message, price, attachmentName || null]
      );
      proposalId = result.insertId;

      // Update request_experts status
      await execute(
        "UPDATE request_experts SET status = 'proposal_received' WHERE request_id = ? AND expert_id = ?",
        [requestId, session.id]
      );

      // Log event
      await execute(
        "INSERT INTO events (request_id, type, text) VALUES (?, 'proposal_received', ?)",
        [requestId, `${session.name} submitted a proposal.`]
      );
    }

    const proposal = await query<Proposal>(
      "SELECT * FROM proposals WHERE id = ?",
      [proposalId]
    );

    return NextResponse.json(
      { success: true, data: proposal[0], isUpdate },
      { status: isUpdate ? 200 : 201 }
    );
  } catch (error) {
    console.error("POST proposal error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit proposal" }, { status: 500 });
  }
}