import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ProposalStatus, RequestStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function statusLabel(status: ProposalStatus | RequestStatus): string {
  const labels: Record<string, string> = {
    created: "Request Created",
    sent: "Request Sent",
    completed: "Completed",
    requested: "Requested",
    proposal_received: "Proposal Received",
    under_refinement: "Under Refinement",
    updated_proposal_received: "Updated Proposal Received",
    proposal_accepted: "Proposal Accepted",
    not_selected: "Not Selected",
  };
  return labels[status] || status;
}

export function statusColor(status: ProposalStatus | RequestStatus): string {
  const colors: Record<string, string> = {
    created: "bg-slate-100 text-slate-700 border-slate-200",
    sent: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    requested: "bg-slate-100 text-slate-700 border-slate-200",
    proposal_received: "bg-blue-50 text-blue-700 border-blue-200",
    under_refinement: "bg-amber-50 text-amber-700 border-amber-200",
    updated_proposal_received: "bg-violet-50 text-violet-700 border-violet-200",
    proposal_accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
    not_selected: "bg-red-50 text-red-600 border-red-200",
  };
  return colors[status] || "bg-slate-100 text-slate-700 border-slate-200";
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}