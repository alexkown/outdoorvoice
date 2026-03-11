"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FAQ: "bg-blue-100 text-blue-800",
  RESERVATION: "bg-green-100 text-green-800",
  MESSAGE: "bg-yellow-100 text-yellow-800",
  TRANSFER: "bg-purple-100 text-purple-800",
  ABANDONED: "bg-red-100 text-red-800",
};

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
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  const totalBreakdown = stats.outcomeBreakdown.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Overview</h1>
        <div className="flex items-center gap-3">
          {stats.activeCall && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              Live call in progress
            </div>
          )}
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {formatRelative(lastUpdated.toISOString())}
            </span>
          )}
        </div>
      </div>

      {stats.activeCall && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center gap-4">
          <div className="h-3 w-3 rounded-full bg-green-500 animate-ping flex-shrink-0" />
          <div>
            <p className="font-medium text-green-900">
              Active call from {stats.activeCall.callerNumber}
            </p>
            <p className="text-sm text-green-700">
              Started {formatRelative(stats.activeCall.startedAt)}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.callsToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bookings Today</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.bookingsToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Messages Waiting</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.messagesWaiting}</div>
            {stats.messagesWaiting > 0 && (
              <p className="text-xs text-amber-600 mt-1">Needs attention</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.resolutionRate !== null ? `${stats.resolutionRate}%` : "—"}
            </div>
            {stats.resolutionRate !== null && (
              <p className="text-xs text-muted-foreground mt-1">Without transfer or abandon</p>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.outcomeBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Call Breakdown Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...stats.outcomeBreakdown]
              .sort((a, b) => b.count - a.count)
              .map((item) => {
                const pct = totalBreakdown > 0 ? Math.round((item.count / totalBreakdown) * 100) : 0;
                return (
                  <div key={item.outcome} className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium w-24 justify-center ${
                        OUTCOME_COLORS[item.outcome] ?? "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {OUTCOME_LABELS[item.outcome] ?? item.outcome}
                    </span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm w-16 text-right text-muted-foreground">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      {stats.callsToday === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Phone className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No calls yet today. Your agent is ready.</p>
        </div>
      )}
    </div>
  );
}
