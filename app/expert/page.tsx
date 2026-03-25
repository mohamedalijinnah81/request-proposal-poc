import Link from "next/link";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { Request } from "@/types";
import { redirect } from "next/navigation";

export default async function ExpertInboxPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  const requests = await query<Request & { customer_name: string; proposal_status: string | null; proposal_version: number | null }>(
    `SELECT r.*, u.name as customer_name,
      (SELECT p.status FROM proposals p WHERE p.request_id = r.id AND p.expert_id = ? LIMIT 1) as proposal_status,
      (SELECT p.version FROM proposals p WHERE p.request_id = r.id AND p.expert_id = ? LIMIT 1) as proposal_version
     FROM requests r
     JOIN users u ON r.customer_id = u.id
     JOIN request_experts re ON re.request_id = r.id
     WHERE re.expert_id = ?
     ORDER BY r.created_at DESC`,
    [session.id, session.id, session.id]
  );

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expert Inbox</h1>
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">
            Simulated · POC
          </span>
        </div>
        <p className="text-slate-500 text-sm">
          Requests assigned to you. In production, this would arrive via email — no platform login required.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-6">
        <strong>POC Simulation:</strong> This inbox simulates email-based communication. In a real product, experts respond directly via email without needing a platform account.
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="text-4xl mb-4">📬</div>
          <h3 className="font-semibold text-slate-700 mb-2">Inbox is empty</h3>
          <p className="text-slate-500 text-sm">No requests have been assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => (
            <Link
              key={req.id}
              href={`/expert/requests/${req.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                      {req.title}
                    </h3>
                    <StatusBadge status={(req.proposal_status || "requested") as any} />
                    {req.proposal_version && req.proposal_version > 1 && (
                      <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-semibold">
                        v{req.proposal_version}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-3">{req.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>👤 {req.customer_name}</span>
                    <span>💰 {req.budget}</span>
                    <span>⏱ {req.timeframe}</span>
                    <span>🕒 {formatDate(req.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-slate-300 group-hover:text-blue-400 text-xl transition-colors">→</span>
                  {!req.proposal_status && (
                    <span className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full font-semibold">New</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}