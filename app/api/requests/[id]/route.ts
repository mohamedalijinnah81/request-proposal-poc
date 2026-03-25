import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Request, Proposal, User } from "@/types";

interface RequestExpertRow {
  expert_id: number;
  expert_name: string;
  expert_domain: string;
  re_status: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const requestId = parseInt(id);

  try {
    // Get request
    const requests = await query<Request & { customer_name: string }>(
      `SELECT r.*, u.name as customer_name 
       FROM requests r 
       JOIN users u ON r.customer_id = u.id 
       WHERE r.id = ?`,
      [requestId]
    );

    if (!requests.length) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    const req = requests[0];

    // Check access
    if (session.role === "customer" && req.customer_id !== session.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (session.role === "expert") {
      const assigned = await query(
        "SELECT id FROM request_experts WHERE request_id = ? AND expert_id = ?",
        [requestId, session.id]
      );
      if (!assigned.length) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    // Get assigned experts with their proposal status
    const expertsWithStatus = await query<RequestExpertRow>(
      `SELECT re.expert_id, u.name as expert_name, u.domain as expert_domain, re.status as re_status
       FROM request_experts re
       JOIN users u ON re.expert_id = u.id
       WHERE re.request_id = ?`,
      [requestId]
    );

    // Get all proposals for this request
    const proposals = await query<Proposal>(
      "SELECT * FROM proposals WHERE request_id = ? ORDER BY updated_at DESC",
      [requestId]
    );

    // Get accepted proposal id
    const acceptedProposal = proposals.find(p => p.status === "proposal_accepted");

    // Build expert-proposal view
    const expertViews = expertsWithStatus.map(e => {
      const proposal = proposals.find(p => p.expert_id === e.expert_id) || null;
      return {
        expert_id: e.expert_id,
        expert_name: e.expert_name,
        expert_domain: e.expert_domain,
        re_status: e.re_status,
        proposal,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        ...req,
        experts: expertViews,
        accepted_proposal_id: acceptedProposal?.id || null,
      },
    });
  } catch (error) {
    console.error("GET request detail error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch request" }, { status: 500 });
  }
}