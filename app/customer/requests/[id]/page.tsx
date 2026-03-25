"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EventLog } from "@/components/shared/EventLog";
import { formatDate } from "@/lib/utils";

export default function CustomerRequestDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [marking, setMarking] = useState<number | null>(null);

  const fetchRequest = useCallback(async () => {
    const res = await fetch(`/api/requests/${id}`);
    const data = await res.json();
    if (data.success) setRequest(data.data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchRequest(); }, [fetchRequest, refreshKey]);

  async function handleAccept(proposalId: number) {
    if (!confirm("Accept this proposal? This will complete the request.")) return;
    setAccepting(proposalId);
    try {
      const res = await fetch(`/api/requests/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId }),
      });
      const data = await res.json();
      if (data.success) setRefreshKey(k => k + 1);
    } finally {
      setAccepting(null);
    }
  }

  async function handleRefinement(proposalId: number) {
    setMarking(proposalId);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/refinement`, { method: "POST" });
      const data = await res.json();
      if (data.success) setRefreshKey(k => k + 1);
    } finally {
      setMarking(null);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!request) return <div className="text-center py-20 text-slate-500">Request not found</div>;

  const proposalCount = request.experts?.filter((e: any) => e.proposal).length || 0;
  const refinementCount = request.experts?.filter((e: any) => e.proposal?.status === "under_refinement").length || 0;
  const isCompleted = request.status === "completed";

  return (
    <div>
      <div className="mb-6">
        <Link href="/customer" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">← Back to Dashboard</Link>
        <div className="flex items-start justify-between mt-2 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{request.title}</h1>
            <p className="text-slate-500 text-sm mt-1">{request.description}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Budget", value: request.budget },
          { label: "Timeframe", value: request.timeframe },
          { label: "Created", value: formatDate(request.created_at) },
          { label: "Customer", value: request.customer_name },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</div>
            <div className="text-sm font-semibold text-slate-800">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Experts Asked", value: request.experts?.length || 0, note: "Assigned to this request" },
          { label: "Proposals", value: proposalCount, note: "Received so far" },
          { label: "Under Refinement", value: refinementCount, note: "Being revised" },
          { label: "Status", value: isCompleted ? "Done ✓" : "Active", note: isCompleted ? "Proposal accepted" : "Awaiting responses" },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{item.value}</div>
            <div className="text-xs text-slate-400">{item.note}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Proposals - takes 2 columns */}
        <div className="col-span-2 space-y-4">
          <h2 className="font-bold text-slate-900">Expert Proposals</h2>
          {request.experts?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
              No experts assigned yet
            </div>
          ) : (
            request.experts?.map((expertView: any) => (
              <div key={expertView.expert_id} className={`bg-white rounded-2xl border p-6 transition-all ${
                expertView.proposal?.status === "proposal_accepted" 
                  ? "border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-200" 
                  : expertView.proposal?.status === "not_selected"
                  ? "border-slate-200 opacity-60"
                  : "border-slate-200 hover:border-slate-300"
              }`}>
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {expertView.expert_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <h3 className="font-semibold text-slate-900">{expertView.expert_name}</h3>
                      {expertView.proposal?.version > 1 && (
                        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">
                          v{expertView.proposal.version} Updated
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 ml-10">{expertView.expert_domain}</div>
                  </div>
                  <StatusBadge status={expertView.proposal?.status || "requested"} />
                </div>

                {expertView.proposal ? (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</div>
                        <div className="text-sm font-medium text-slate-800">{expertView.proposal.subject}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Price</div>
                        <div className="text-sm font-bold text-slate-900">{expertView.proposal.price}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Version</div>
                        <div className="text-sm font-medium text-slate-800">v{expertView.proposal.version}</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap mb-3">
                      {expertView.proposal.message}
                    </div>
                    {expertView.proposal.attachment_name && (
                      <div className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-full font-medium mb-3">
                        📎 {expertView.proposal.attachment_name}
                      </div>
                    )}
                    <div className="text-xs text-slate-400">Updated: {formatDate(expertView.proposal.updated_at)}</div>

                    {!isCompleted && expertView.proposal.status !== "proposal_accepted" && expertView.proposal.status !== "not_selected" && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                        {expertView.proposal.status !== "under_refinement" && (
                          <button
                            onClick={() => handleRefinement(expertView.proposal.id)}
                            disabled={marking === expertView.proposal.id}
                            className="px-4 py-2 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                          >
                            {marking === expertView.proposal.id ? "Marking..." : "Mark Under Refinement"}
                          </button>
                        )}
                        <button
                          onClick={() => handleAccept(expertView.proposal.id)}
                          disabled={accepting === expertView.proposal.id}
                          className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          {accepting === expertView.proposal.id ? "Accepting..." : "Accept Proposal"}
                        </button>
                      </div>
                    )}
                    {expertView.proposal.status === "proposal_accepted" && (
                      <div className="mt-4 pt-4 border-t border-emerald-200 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        ✅ Accepted Proposal
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 bg-slate-50 rounded-xl p-4 border border-dashed border-slate-200">
                    Awaiting proposal from this expert...
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {request.notes && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-3 text-sm">Additional Notes</h3>
              <p className="text-sm text-slate-600">{request.notes}</p>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">Activity Log</h3>
            <EventLog requestId={Number(id)} refreshKey={refreshKey} />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
            <strong>POC Note:</strong> The Expert Inbox is a simulated platform feature. In production, experts would respond via email without needing to log in.
          </div>
        </div>
      </div>
    </div>
  );
}