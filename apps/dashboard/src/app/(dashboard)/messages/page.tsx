"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, Clock, ChevronRight } from "lucide-react";
import { formatRelative, formatPhone } from "@/lib/utils";

type MessageStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";

interface Message {
  id: string;
  createdAt: string;
  callerName: string | null;
  callerPhone: string;
  callbackTime: string | null;
  summary: string | null;
  status: MessageStatus;
}

const STATUS_LABELS: Record<MessageStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

const NEXT_STATUS: Record<MessageStatus, MessageStatus | null> = {
  NEW: "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED: null,
};

const NEXT_LABEL: Record<MessageStatus, string | null> = {
  NEW: "Start",
  IN_PROGRESS: "Resolve",
  RESOLVED: null,
};

const STATUS_BADGE: Record<MessageStatus, "default" | "secondary" | "outline"> = {
  NEW: "default",
  IN_PROGRESS: "secondary",
  RESOLVED: "outline",
};

function MessageCard({
  message,
  onAdvance,
}: {
  message: Message;
  onAdvance: (id: string, status: MessageStatus) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const nextStatus = NEXT_STATUS[message.status];
  const nextLabel = NEXT_LABEL[message.status];

  const handleAdvance = async () => {
    if (!nextStatus) return;
    setLoading(true);
    try {
      await onAdvance(message.id, nextStatus);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant={STATUS_BADGE[message.status]}>{STATUS_LABELS[message.status]}</Badge>
          <span className="text-xs text-muted-foreground">{formatRelative(message.createdAt)}</span>
        </div>
        {nextStatus && nextLabel && (
          <Button size="sm" variant="outline" onClick={handleAdvance} disabled={loading} className="flex-shrink-0">
            {nextLabel}
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {message.callerName && (
          <span className="font-medium">{message.callerName}</span>
        )}
        <span className="flex items-center gap-1 text-muted-foreground font-mono">
          <Phone className="h-3 w-3" />
          {formatPhone(message.callerPhone)}
        </span>
        {message.callbackTime && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            Callback: {message.callbackTime}
          </span>
        )}
      </div>

      {message.summary && (
        <p className="text-sm text-muted-foreground">{message.summary}</p>
      )}
    </div>
  );
}

function StatusSection({
  status,
  messages,
  onAdvance,
}: {
  status: MessageStatus;
  messages: Message[];
  onAdvance: (id: string, status: MessageStatus) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-sm">{STATUS_LABELS[status]}</h2>
        <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
          {messages.length}
        </span>
      </div>
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3 text-center border rounded-lg border-dashed">
          No {STATUS_LABELS[status].toLowerCase()} messages
        </p>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <MessageCard key={m.id} message={m} onAdvance={onAdvance} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    // Poll every 60s for new messages
    const interval = setInterval(fetchMessages, 60_000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const advanceStatus = async (id: string, status: MessageStatus) => {
    const res = await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m))
      );
    }
  };

  const byStatus = (s: MessageStatus) => messages.filter((m) => m.status === s);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
        <span className="text-sm text-muted-foreground">{messages.length} total</span>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Caller messages will appear here when your agent takes them
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {(["NEW", "IN_PROGRESS", "RESOLVED"] as MessageStatus[]).map((status) => (
            <Card key={status}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {STATUS_LABELS[status]}
                  <span className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full text-xs font-normal">
                    {byStatus(status).length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {byStatus(status).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                    None
                  </p>
                ) : (
                  byStatus(status).map((m) => (
                    <MessageCard key={m.id} message={m} onAdvance={advanceStatus} />
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
