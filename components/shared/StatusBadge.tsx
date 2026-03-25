import { statusLabel, statusColor, cn } from "@/lib/utils";
import type { ProposalStatus, RequestStatus } from "@/types";

interface StatusBadgeProps {
  status: ProposalStatus | RequestStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
      statusColor(status),
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {statusLabel(status)}
    </span>
  );
}