import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Proposal } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "customer") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const proposalId = parseInt(id);

  try {
    const proposals = await query<Proposal>(
      "SELECT * FROM proposals WHERE id = ?",
      [proposalId]
    );

    if (!proposals.length) {
      return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });
    }

    const proposal = proposals[0];

    await execute(
      "UPDATE proposals SET status = 'under_refinement', updated_at = NOW() WHERE id = ?",
      [proposalId]
    );

    await execute(
      "UPDATE request_experts SET status = 'under_refinement' WHERE request_id = ? AND expert_id = ?",
      [proposal.request_id, proposal.expert_id]
    );

    // Get expert name
    const expertRows = await query<{ name: string }>(
      "SELECT name FROM users WHERE id = ?",
      [proposal.expert_id]
    );
    const expertName = expertRows[0]?.name || "Expert";

    await execute(
      "INSERT INTO events (request_id, type, text) VALUES (?, 'proposal_refinement', ?)",
      [proposal.request_id, `${expertName}'s proposal is now under refinement.`]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Refinement error:", error);
    return NextResponse.json({ success: false, error: "Failed to mark proposal" }, { status: 500 });
  }
}