"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ACTIVITY_TYPE_LABELS, type ActivityType } from "@/types";

interface ActivityItem {
  id: string;
  type: string;
  subject: string;
  body?: string | null;
  activityDate: string;
  company?: { id: string; companyName: string } | null;
  contact?: { id: string; fullName: string } | null;
  deal?: { id: string; dealName: string } | null;
}

const typeConfig: Record<ActivityType, { icon: React.ReactNode; color: string; bg: string }> = {
  phone: {
    color: "text-primary-600",
    bg: "bg-primary-50 border-primary-200",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  email: {
    color: "text-info",
    bg: "bg-info-light border-info-border",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  meeting: {
    color: "text-warning",
    bg: "bg-warning-light border-warning-border",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  note: {
    color: "text-sf-weak",
    bg: "bg-sf-bg border-sf-border",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  other: {
    color: "text-sf-weak",
    bg: "bg-sf-bg border-sf-border",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

function ActivityEntry({ item }: { item: ActivityItem }) {
  const [expanded, setExpanded] = useState(false);
  const t = item.type as ActivityType;
  const config = typeConfig[t] ?? typeConfig.other;

  return (
    <div className="flex gap-3 group">
      {/* Timeline line + icon */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${config.bg} ${config.color}`}>
          {config.icon}
        </div>
        <div className="w-px flex-1 bg-sf-border mt-1 group-last:hidden" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm font-semibold text-sf-text hover:text-primary-600 text-left focus:outline-none focus:underline"
              aria-expanded={expanded}
            >
              {item.subject}
            </button>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              <span className="text-xs text-sf-weak">{ACTIVITY_TYPE_LABELS[t]}</span>
              {item.company && (
                <>
                  <span className="text-sf-border text-xs">·</span>
                  <Link href={`/companies/${item.company.id}`} className="text-xs text-primary-600 hover:underline">
                    {item.company.companyName}
                  </Link>
                </>
              )}
              {item.contact && (
                <>
                  <span className="text-sf-border text-xs">·</span>
                  <Link href={`/contacts/${item.contact.id}`} className="text-xs text-primary-600 hover:underline">
                    {item.contact.fullName}
                  </Link>
                </>
              )}
              {item.deal && (
                <>
                  <span className="text-sf-border text-xs">·</span>
                  <Link href={`/deals/${item.deal.id}`} className="text-xs text-primary-600 hover:underline">
                    {item.deal.dealName}
                  </Link>
                </>
              )}
            </div>
          </div>
          <time className="text-xs text-sf-weak shrink-0">{formatDate(item.activityDate)}</time>
        </div>
        {item.body && (
          <div className={`mt-2 overflow-hidden transition-all ${expanded ? "max-h-96" : "max-h-0"}`}>
            <p className="text-sm text-sf-text whitespace-pre-wrap bg-sf-bg rounded-sf px-3 py-2 border border-sf-border">
              {item.body}
            </p>
          </div>
        )}
        {item.body && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="mt-1 text-xs text-primary-600 hover:underline focus:outline-none"
          >
            詳細を表示
          </button>
        )}
      </div>
    </div>
  );
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  emptyMessage?: string;
}

export function ActivityTimeline({ activities, emptyMessage = "活動履歴がありません" }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 bg-sf-bg rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-sf-weak" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-sf-weak">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      {activities.map((item) => (
        <ActivityEntry key={item.id} item={item} />
      ))}
    </div>
  );
}
