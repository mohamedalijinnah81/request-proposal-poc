"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";

export default function ExpertRequestDetail() {
  const { id } = useParams();
  const [request, setRequest] = useState<any>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({
    subject: "",
    message: "",
    price: "",
    attachmentName: "",
  });

  const fetchData = useCallback(async () => {
    const [reqRes, propRes] = await Promise.all([
      fetch(`/api/requests/${id}`),
      fetch(`/api/proposals?requestId=${id}`),
    ]);
    const [reqData, propData] = await Promise.all([reqRes.json(), propRes.json()]);

    if (reqData.success) setRequest(reqData.data);

    if (propData.success && propData.data.length > 0) {
      const myProposal = propData.data[0];
      setProposal(myProposal);
      setForm({
        subject: myProposal.subject,
        message: myProposal.message,
        price: myProposal.price,
        attachmentName: myProposal.attachment_name || "",
      });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleAiSuggest() {
    if (!request) return;
    setAiLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestTitle: request.title,
          requestDescription: request.description,
          requestBudget: request.budget,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setForm({
          subject: data.data.subject || form.subject,
          message: data.data.message || form.message,
          price: data.data.price || form.price,
          attachmentName: data.data.attachmentName || form.attachmentName,
        });
        setMessage({ type: "success", text: "AI draft generated! Review and adjust before submitting." });
      }
    } catch {
      setMessage({ type: "error", text: "AI suggestion failed. Please fill in manually." });
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: Number(id), ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.isUpdate ? "Proposal updated successfully!" : "Proposal submitted successfully!" });
        fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to submit" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!request) return <div className="text-center py-20 text-slate-500">Request not found</div>;

  return (
    <div>
      <div className="mb-6">
        <Link href="/expert" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">← Back to Inbox</Link>
        <div className="flex items-start justify-between mt-2 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{request.title}</h1>
            <p className="text-slate-500 text-sm mt-1">Customer: {request.customer_name}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Request details — 1 col */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm">Request Details</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</div>
                <p className="text-sm text-slate-600 leading-relaxed">{request.description}</p>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Budget</div>
                <p className="text-sm font-semibold text-slate-800">{request.budget}</p>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Timeframe</div>
                <p className="text-sm font-semibold text-slate-800">{request.timeframe}</p>
              </div>
              {request.notes && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</div>
                  <p className="text-sm text-slate-600">{request.notes}</p>
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Received</div>
                <p className="text-sm text-slate-600">{formatDate(request.created_at)}</p>
              </div>
            </div>
          </div>

          {proposal && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-3 text-sm">Current Proposal</h3>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={proposal.status} />
                <span className="text-xs text-slate-400">v{proposal.version}</span>
              </div>
              <p className="text-xs text-slate-500">Last updated: {formatDate(proposal.updated_at)}</p>
            </div>
          )}
        </div>

        {/* Proposal form — 2 cols */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-slate-900">{proposal ? "Update Proposal" : "Submit Proposal"}</h2>
                {proposal && (
                  <p className="text-xs text-slate-400 mt-0.5">Submitting will create version {proposal.version + 1}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiLoading}
                className="flex items-center gap-2 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>✨ AI Draft</>
                )}
              </button>
            </div>

            {message && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${
                message.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject *</label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Proposal for Research Sprint"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message *</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Describe your proposal in detail..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price *</label>
                  <input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    required
                    placeholder="e.g. €3,200"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Attachment (optional)</label>
                  <input
                    name="attachmentName"
                    value={form.attachmentName}
                    onChange={handleChange}
                    placeholder="e.g. proposal_v1.pdf"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
                >
                  {submitting ? "Submitting..." : proposal ? "Submit Updated Proposal" : "Submit Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}