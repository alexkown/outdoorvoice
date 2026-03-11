"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const OUTCOME_COLORS: Record<string, string> = {
  FAQ: "secondary",
  RESERVATION: "default",
  MESSAGE: "outline",
  TRANSFER: "secondary",
  ABANDONED: "destructive",
} as const;

const OUTCOME_LABELS: Record<string, string> = {
  FAQ: "FAQ",
  RESERVATION: "Booking",
  MESSAGE: "Message",
  TRANSFER: "Transfer",
  ABANDONED: "Abandoned",
};

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

  // Reset to page 1 when filter changes
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Call Log</h1>
        <Select value={outcome} onValueChange={setOutcome}>
          <SelectTrigger className="w-44">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {total} call{total !== 1 ? "s" : ""}
            {outcome !== "all" ? ` · ${OUTCOME_LABELS[outcome]}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              Loading…
            </div>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Phone className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No calls found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caller</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow key={call.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(call)}>
                      <TableCell className="font-mono text-sm">
                        {formatPhone(call.callerNumber)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatRelative(new Date(call.startedAt))}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {call.durationSecs != null ? formatDuration(call.durationSecs) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={OUTCOME_COLORS[call.outcome] as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}>
                          {OUTCOME_LABELS[call.outcome] ?? call.outcome}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {call.summary ?? "—"}
                      </TableCell>
                      <TableCell>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={(e) => { e.stopPropagation(); setPage(p => p - 1); }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Transcript dialog */}
      <Dialog open={!!selectedCall} onOpenChange={(open) => { if (!open) setSelectedCall(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span>{selectedCall ? formatPhone(selectedCall.callerNumber) : ""}</span>
              {selectedCall && (
                <Badge variant={OUTCOME_COLORS[selectedCall.outcome] as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}>
                  {OUTCOME_LABELS[selectedCall.outcome] ?? selectedCall.outcome}
                </Badge>
              )}
            </DialogTitle>
            {selectedCall && (
              <p className="text-sm text-muted-foreground">
                {formatRelative(selectedCall.startedAt)}
                {selectedCall.durationSecs != null && ` · ${formatDuration(selectedCall.durationSecs)}`}
              </p>
            )}
          </DialogHeader>

          {selectedCall?.summary && (
            <div className="rounded-md bg-muted px-4 py-3 text-sm">
              <span className="font-medium">Summary: </span>{selectedCall.summary}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 mt-2">
            {detailLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading transcript…</p>
            ) : selectedCall?.transcript && selectedCall.transcript.length > 0 ? (
              selectedCall.transcript.map((turn, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${turn.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${
                      turn.role === "assistant"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground ml-auto"
                    }`}
                  >
                    {turn.content}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No transcript available for this call.
              </p>
            )}
          </div>

          {selectedCall?.recordingUrl && (
            <div className="border-t pt-3">
              <audio controls src={selectedCall.recordingUrl} className="w-full h-9" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
