"use client";

import { useEffect, useState, useCallback } from "react";
import { Phone, CalendarCheck, MessageSquare, TrendingUp, Radio } from "lucide-react";
import { formatRelative } from "@/lib/utils";

interface OutcomeBreakdown {
  outcome: string;
  count: number;
}

interface ActiveCall {
  id: string;
  callerNumber: string;
  startedAt: string;
  outcome: string | null;
}

interface OverviewStats {
  callsToday: number;
  bookingsToday: number;
  messagesWaiting: number;
  resolutionRate: number | null;
  activeCall: ActiveCall | null;
  outcomeBreakdown: OutcomeBreakdown[];
}

const OUTCOME_LABELS: Record<string, string> = {
  FAQ: "FAQ",
  RESERVATION: "Booking",
  MESSAGE: "Message",
  TRANSFER: "Transfer",
  ABANDONED: "Abandoned",
};

const OUTCOME_COLORS: Record<string, string> = {
  FAQ: "bg-sky-100 text-sky-800",
  RESERVATION: "bg-emerald-100 text-emerald-800",
  MESSAGE: "bg-amber-100 text-amber-800",
  TRANSFER: "bg-violet-100 text-violet-800",
  ABANDONED: "bg-red-100 text-red-800",
};

const OUTCOME_BAR: Record<string, string> = {
  FAQ: "bg-sky-400",
  RESERVATION: "bg-emerald-500",
  MESSAGE: "bg-amber-400",
  TRANSFER: "bg-violet-400",
  ABANDONED: "bg-red-400",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  note?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}

function StatCard({ label, value, icon: Icon, note, iconBg = "bg-emerald-50", iconColor = "text-emerald-700" }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-stone-500 font-medium">{label}</span>
        <div className={`h-9 w-9 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon style={{ height: "18px", width: "18px" }} className={iconColor} />
        </div>
      </div>
      <div className="text-4xl font-bold text-emerald-800 leading-none">{value}</div>
      {note && <div className="text-xs">{note}</div>}
    </div>
  );
}

export default function OverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/overview");
      if (res.ok) {
        setStats(await res.json());
        setLastUpdated(new Date());
      }
    } catch {
      // silently keep stale data
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
        Loading…
      </div>
    );
  }

  const totalBreakdown = stats.outcomeBreakdown.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Overview</h1>
          <p className="text-sm text-stone-500 mt-0.5">Your AI agent&apos;s activity at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          {stats.activeCall && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              Live call in progress
            </div>
          )}
          {lastUpdated && (
            <span className="text-xs text-stone-400">
              Updated {formatRelative(lastUpdated)}
            </span>
          )}
        </div>
      </div>

      {/* Active call banner */}
      {stats.activeCall && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-4">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-900">
              Active call from {stats.activeCall.callerNumber}
            </p>
            <p className="text-sm text-emerald-600">
              Started {formatRelative(new Date(stats.activeCall.startedAt))}
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Calls Today"
          value={stats.callsToday}
          icon={Phone}
        />
        <StatCard
          label="Bookings Today"
          value={stats.bookingsToday}
          icon={CalendarCheck}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Messages Waiting"
          value={stats.messagesWaiting}
          icon={MessageSquare}
          iconBg={stats.messagesWaiting > 0 ? "bg-amber-50" : "bg-stone-50"}
          iconColor={stats.messagesWaiting > 0 ? "text-amber-600" : "text-stone-400"}
          note={
            stats.messagesWaiting > 0 ? (
              <span className="text-amber-600 font-medium">Needs attention</span>
            ) : (
              <span className="text-stone-400">All clear</span>
            )
          }
        />
        <StatCard
          label="Resolution Rate"
          value={stats.resolutionRate !== null ? `${stats.resolutionRate}%` : "—"}
          icon={TrendingUp}
          note={
            stats.resolutionRate !== null ? (
              <span className="text-stone-400">Without transfer or abandon</span>
            ) : undefined
          }
        />
      </div>

      {/* Call breakdown */}
      {stats.outcomeBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-base font-semibold text-stone-900 mb-5">Call Breakdown Today</h2>
          <div className="space-y-3">
            {[...stats.outcomeBreakdown]
              .sort((a, b) => b.count - a.count)
              .map((item) => {
                const pct = totalBreakdown > 0 ? Math.round((item.count / totalBreakdown) * 100) : 0;
                return (
                  <div key={item.outcome} className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium w-24 justify-center ${
                        OUTCOME_COLORS[item.outcome] ?? "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {OUTCOME_LABELS[item.outcome] ?? item.outcome}
                    </span>
                    <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${OUTCOME_BAR[item.outcome] ?? "bg-stone-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm w-16 text-right text-stone-500">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.callsToday === 0 && (
        <div className="text-center py-20 text-stone-400">
          <div className="h-14 w-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <Phone className="h-7 w-7 text-stone-300" />
          </div>
          <p className="text-sm font-medium text-stone-500">No calls yet today</p>
          <p className="text-xs text-stone-400 mt-1">Your AI agent is ready and waiting</p>
        </div>
      )}
    </div>
  );
}
