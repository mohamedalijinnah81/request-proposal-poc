import Link from "next/link";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { Request } from "@/types";
import { redirect } from "next/navigation";

export default async function CustomerDashboard() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const requests = await query<Request & { proposal_count: number }>(
    `SELECT r.*, 
      (SELECT COUNT(*) FROM proposals p WHERE p.request_id = r.id) as proposal_count
     FROM requests r 
     WHERE r.customer_id = ? 
     ORDER BY r.created_at DESC`,
    [session.id]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of all your active and completed requests</p>
        </div>
        <Link
          href="/customer/new-request"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          + New Request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="font-semibold text-slate-700 mb-2">No requests yet</h3>
          <p className="text-slate-500 text-sm mb-6">Create your first request to start receiving proposals from experts.</p>
          <Link href="/customer/new-request" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
            Create Request
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => (
            <Link
              key={req.id}
              href={`/customer/requests/${req.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                      {req.title}
                    </h3>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-3">{req.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>💰 {req.budget}</span>
                    <span>⏱ {req.timeframe}</span>
                    <span>📩 {req.proposal_count} proposal{req.proposal_count !== 1 ? "s" : ""}</span>
                    <span>🕒 {formatDate(req.created_at)}</span>
                  </div>
                </div>
                <span className="text-slate-300 group-hover:text-blue-400 text-xl transition-colors">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}