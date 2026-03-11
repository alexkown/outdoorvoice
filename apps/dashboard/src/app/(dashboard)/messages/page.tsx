"use client";

import { useEffect, useState, useCallback } from "react";
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

const STATUS_BADGE_CLASS: Record<MessageStatus, string> = {
  NEW: "bg-amber-100 text-amber-800 border-amber-200",
  IN_PROGRESS: "bg-sky-100 text-sky-800 border-sky-200",
  RESOLVED: "bg-stone-100 text-stone-600 border-stone-200",
};

const COLUMN_HEADER_CLASS: Record<MessageStatus, string> = {
  NEW: "text-amber-700 bg-amber-50 border-amber-200",
  IN_PROGRESS: "text-sky-700 bg-sky-50 border-sky-200",
  RESOLVED: "text-stone-600 bg-stone-50 border-stone-200",
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
    <div className="flex flex-col gap-2 p-4 border border-stone-200 rounded-xl bg-white hover:border-stone-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-stone-400">{formatRelative(new Date(message.createdAt))}</span>
        {nextStatus && nextLabel && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleAdvance}
            disabled={loading}
            className="flex-shrink-0 h-7 text-xs border-stone-200 text-stone-600 hover:bg-stone-50"
          >
            {nextLabel}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {message.callerName && (
          <span className="font-semibold text-stone-800">{message.callerName}</span>
        )}
        <span className="flex items-center gap-1 text-stone-500 font-mono text-xs">
          <Phone className="h-3 w-3" />
          {formatPhone(message.callerPhone)}
        </span>
        {message.callbackTime && (
          <span className="flex items-center gap-1 text-stone-500 text-xs">
            <Clock className="h-3 w-3" />
            Callback: {message.callbackTime}
          </span>
        )}
      </div>

      {message.summary && (
        <p className="text-sm text-stone-600 leading-relaxed">{message.summary}</p>
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
      <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Messages</h1>
          <p className="text-sm text-stone-500 mt-0.5">Caller messages taken by your AI agent</p>
        </div>
        <span className="text-sm text-stone-400">{messages.length} total</span>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-7 w-7 text-stone-300" />
          </div>
          <p className="text-sm font-medium text-stone-500">No messages yet</p>
          <p className="text-xs text-stone-400 mt-1">
            Caller messages will appear here when your agent takes them
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {(["NEW", "IN_PROGRESS", "RESOLVED"] as MessageStatus[]).map((status) => (
            <div key={status}>
              <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 mb-3 ${COLUMN_HEADER_CLASS[status]}`}>
                <span className="text-sm font-semibold">{STATUS_LABELS[status]}</span>
                <span className="ml-auto text-xs font-medium opacity-70">{byStatus(status).length}</span>
              </div>
              <div className="space-y-2">
                {byStatus(status).length === 0 ? (
                  <p className="text-sm text-stone-400 text-center py-6 border border-dashed border-stone-200 rounded-xl">
                    None
                  </p>
                ) : (
                  byStatus(status).map((m) => (
                    <MessageCard key={m.id} message={m} onAdvance={advanceStatus} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
