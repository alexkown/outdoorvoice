"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Phone, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { formatRelative, formatDuration, formatPhone } from "@/lib/utils";

interface Call {
  id: string;
  callerNumber: string;
  startedAt: string;
  endedAt: string | null;
  durationSecs: number | null;
  outcome: string;
  summary: string | null;
  recordingUrl: string | null;
  twilioCallSid: string;
}

interface CallDetail extends Call {
  transcript: { role: string; content: string }[] | null;
}

const OUTCOMES = ["FAQ", "RESERVATION", "MESSAGE", "TRANSFER", "ABANDONED"];

const OUTCOME_BADGE_CLASS: Record<string, string> = {
  FAQ: "bg-sky-100 text-sky-800 border-sky-200",
  RESERVATION: "bg-emerald-100 text-emerald-800 border-emerald-200",
  MESSAGE: "bg-amber-100 text-amber-800 border-amber-200",
  TRANSFER: "bg-violet-100 text-violet-800 border-violet-200",
  ABANDONED: "bg-red-100 text-red-800 border-red-200",
};

const OUTCOME_LABELS: Record<string, string> = {
  FAQ: "FAQ",
  RESERVATION: "Booking",
  MESSAGE: "Message",
  TRANSFER: "Transfer",
  ABANDONED: "Abandoned",
};

function OutcomeBadge({ outcome }: { outcome: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${OUTCOME_BADGE_CLASS[outcome] ?? "bg-stone-100 text-stone-700 border-stone-200"}`}>
      {OUTCOME_LABELS[outcome] ?? outcome}
    </span>
  );
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [outcome, setOutcome] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const [selectedCall, setSelectedCall] = useState<CallDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (outcome !== "all") params.set("outcome", outcome);
      const res = await fetch(`/api/calls?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCalls(data.calls);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, outcome]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  useEffect(() => {
    setPage(1);
  }, [outcome]);

  const openDetail = async (call: Call) => {
    setDetailLoading(true);
    setSelectedCall({ ...call, transcript: null });
    try {
      const res = await fetch(`/api/calls/${call.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCall(data.call);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 25);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Call Log</h1>
          <p className="text-sm text-stone-500 mt-0.5">Every call your AI agent has handled</p>
        </div>
        <Select value={outcome} onValueChange={setOutcome}>
          <SelectTrigger className="w-44 bg-white border-stone-200">
            <SelectValue placeholder="All outcomes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            {OUTCOMES.map((o) => (
              <SelectItem key={o} value={o}>
                {OUTCOME_LABELS[o]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <p className="text-sm font-semibold text-stone-700">
            {total} call{total !== 1 ? "s" : ""}
            {outcome !== "all" ? ` · ${OUTCOME_LABELS[outcome]}` : ""}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-stone-400 text-sm">
            Loading…
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Phone className="h-7 w-7 text-stone-300" />
            </div>
            <p className="text-sm font-medium text-stone-500">No calls found</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50/50 hover:bg-stone-50/50">
                  <TableHead className="text-stone-500 font-medium">Caller</TableHead>
                  <TableHead className="text-stone-500 font-medium">Time</TableHead>
                  <TableHead className="text-stone-500 font-medium">Duration</TableHead>
                  <TableHead className="text-stone-500 font-medium">Outcome</TableHead>
                  <TableHead className="text-stone-500 font-medium">Summary</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <TableRow
                    key={call.id}
                    className="cursor-pointer hover:bg-stone-50 border-stone-100"
                    onClick={() => openDetail(call)}
                  >
                    <TableCell className="font-mono text-sm text-stone-700">
                      {formatPhone(call.callerNumber)}
                    </TableCell>
                    <TableCell className="text-sm text-stone-500 whitespace-nowrap">
                      {formatRelative(new Date(call.startedAt))}
                    </TableCell>
                    <TableCell className="text-sm text-stone-500">
                      {call.durationSecs != null ? formatDuration(call.durationSecs) : "—"}
                    </TableCell>
                    <TableCell>
                      <OutcomeBadge outcome={call.outcome} />
                    </TableCell>
                    <TableCell className="text-sm text-stone-500 max-w-xs truncate">
                      {call.summary ?? "—"}
                    </TableCell>
                    <TableCell>
                      <FileText className="h-4 w-4 text-stone-300" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-stone-100 bg-stone-50/50">
                <span className="text-sm text-stone-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    className="border-stone-200"
                    onClick={(e) => { e.stopPropagation(); setPage(p => p - 1); }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    className="border-stone-200"
                    onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transcript dialog */}
      <Dialog open={!!selectedCall} onOpenChange={(open) => { if (!open) setSelectedCall(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="font-mono">{selectedCall ? formatPhone(selectedCall.callerNumber) : ""}</span>
              {selectedCall && <OutcomeBadge outcome={selectedCall.outcome} />}
            </DialogTitle>
            {selectedCall && (
              <p className="text-sm text-stone-500">
                {formatRelative(new Date(selectedCall.startedAt))}
                {selectedCall.durationSecs != null && ` · ${formatDuration(selectedCall.durationSecs)}`}
              </p>
            )}
          </DialogHeader>

          {selectedCall?.summary && (
            <div className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3 text-sm text-stone-700">
              <span className="font-medium">Summary: </span>{selectedCall.summary}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 mt-2">
            {detailLoading ? (
              <p className="text-sm text-stone-400 text-center py-8">Loading transcript…</p>
            ) : selectedCall?.transcript && selectedCall.transcript.length > 0 ? (
              selectedCall.transcript.map((turn, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${turn.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}
                >
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm max-w-[80%] ${
                      turn.role === "assistant"
                        ? "bg-stone-100 text-stone-800"
                        : "bg-emerald-800 text-white ml-auto"
                    }`}
                  >
                    {turn.content}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-400 text-center py-8">
                No transcript available for this call.
              </p>
            )}
          </div>

          {selectedCall?.recordingUrl && (
            <div className="border-t border-stone-100 pt-3">
              <audio controls src={selectedCall.recordingUrl} className="w-full h-9" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
