import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Request, Proposal } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "customer") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const requestId = parseInt(id);

  try {
    const body = await request.json();
    const { proposalId } = body;

    if (!proposalId) {
      return NextResponse.json({ success: false, error: "proposalId is required" }, { status: 400 });
    }

    // Verify request belongs to customer
    const requests = await query<Request>(
      "SELECT * FROM requests WHERE id = ? AND customer_id = ?",
      [requestId, session.id]
    );
    if (!requests.length) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    const req = requests[0];
    if (req.status === "completed") {
      return NextResponse.json({ success: false, error: "Request already completed" }, { status: 400 });
    }

    // Accept chosen proposal
    await execute(
      "UPDATE proposals SET status = 'proposal_accepted', updated_at = NOW() WHERE id = ? AND request_id = ?",
      [proposalId, requestId]
    );

    // Mark all others as not_selected
    await execute(
      "UPDATE proposals SET status = 'not_selected', updated_at = NOW() WHERE request_id = ? AND id != ?",
      [requestId, proposalId]
    );

    // Get the accepted proposal to find expert
    const proposals = await query<Proposal>(
      "SELECT p.*, u.name as expert_name FROM proposals p JOIN users u ON p.expert_id = u.id WHERE p.id = ?",
      [proposalId]
    );
    const accepted = proposals[0] as Proposal & { expert_name: string };

    // Update expert assignment status
    await execute(
      "UPDATE request_experts SET status = 'proposal_accepted' WHERE request_id = ? AND expert_id = ?",
      [requestId, accepted.expert_id]
    );

    // Mark other assignments as not_selected
    await execute(
      "UPDATE request_experts SET status = 'not_selected' WHERE request_id = ? AND expert_id != ? AND status != 'requested'",
      [requestId, accepted.expert_id]
    );

    // Mark request as completed
    await execute(
      "UPDATE requests SET status = 'completed', updated_at = NOW() WHERE id = ?",
      [requestId]
    );

    // Log event
    await execute(
      "INSERT INTO events (request_id, type, text) VALUES (?, 'proposal_accepted', ?)",
      [requestId, `Customer accepted the proposal from ${accepted.expert_name}.`]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Accept proposal error:", error);
    return NextResponse.json({ success: false, error: "Failed to accept proposal" }, { status: 500 });
  }
}