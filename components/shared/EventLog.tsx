"use client";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types";

const EVENT_ICONS: Record<string, string> = {
  request_created: "📋",
  request_sent: "📤",
  proposal_received: "📩",
  proposal_updated: "🔄",
  proposal_refinement: "⚙️",
  proposal_accepted: "✅",
};

interface EventLogProps {
  requestId?: number;
  refreshKey?: number;
}

export function EventLog({ requestId, refreshKey }: EventLogProps) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const url = requestId ? `/api/events?requestId=${requestId}` : "/api/events";
    fetch(url)
      .then(r => r.json())
      .then(d => { if (d.success) setEvents(d.data); });
  }, [requestId, refreshKey]);

  return (
    <div className="space-y-2">
      {events.length === 0 ? (
        <div className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          No events yet
        </div>
      ) : (
        events.map(event => (
          <div key={event.id} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-base flex-shrink-0">{EVENT_ICONS[event.type] || "📌"}</span>
            <div className="min-w-0">
              <p className="text-sm text-slate-700 font-medium leading-snug">{event.text}</p>
              <p className="text-xs text-slate-400 mt-0.5">{formatDate(event.created_at)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}