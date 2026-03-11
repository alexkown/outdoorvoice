"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarCheck, Loader2, ExternalLink, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPhone, formatRelative } from "@/lib/utils";

interface Reservation {
  id: string;
  createdAt: string;
  activity: string;
  date: string;
  partySize: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  status: "CONFIRMED" | "PENDING" | "CANCELLED" | "FAILED";
  platform: string;
  externalId?: string;
  confirmationCode?: string;
}

const STATUS_CLASS: Record<Reservation["status"], string> = {
  CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  CANCELLED: "bg-stone-100 text-stone-600 border-stone-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
};

function StatusBadge({ status }: { status: Reservation["status"] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize ${STATUS_CLASS[status]}`}>
      {status.toLowerCase()}
    </span>
  );
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/reservations");
      const json = await res.json() as { reservations?: Reservation[] };
      setReservations(json.reservations ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const confirmed = reservations.filter((r) => r.status === "CONFIRMED").length;
  const pending = reservations.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Reservations</h1>
        <p className="text-stone-500 text-sm mt-0.5">Bookings created by your AI agent via phone</p>
      </div>

      {/* Summary stat chips */}
      {!loading && reservations.length > 0 && (
        <div className="flex gap-3">
          <div className="bg-white rounded-xl border border-stone-200 px-5 py-3 text-sm">
            <span className="text-2xl font-bold text-emerald-800">{confirmed}</span>
            <span className="text-stone-500 ml-2">confirmed</span>
          </div>
          {pending > 0 && (
            <div className="bg-white rounded-xl border border-amber-200 px-5 py-3 text-sm">
              <span className="text-2xl font-bold text-amber-700">{pending}</span>
              <span className="text-stone-500 ml-2">pending</span>
            </div>
          )}
          <div className="bg-white rounded-xl border border-stone-200 px-5 py-3 text-sm">
            <span className="text-2xl font-bold text-stone-700">{reservations.length}</span>
            <span className="text-stone-500 ml-2">total</span>
          </div>
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-semibold text-stone-700">Agent Bookings</h2>
          <span className="text-xs text-stone-400 ml-1">· synced to FareHarbor</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-stone-300" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="h-7 w-7 text-stone-300" />
            </div>
            <p className="text-sm font-medium text-stone-500">No reservations yet</p>
            <p className="text-xs text-stone-400 mt-1">
              Bookings made through your AI agent will appear here
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50/50 hover:bg-stone-50/50">
                <TableHead className="text-stone-500 font-medium">Customer</TableHead>
                <TableHead className="text-stone-500 font-medium">Activity</TableHead>
                <TableHead className="text-stone-500 font-medium">Date</TableHead>
                <TableHead className="w-20 text-stone-500 font-medium">Party</TableHead>
                <TableHead className="text-stone-500 font-medium">Conf #</TableHead>
                <TableHead className="text-stone-500 font-medium">Status</TableHead>
                <TableHead className="w-24 text-right text-stone-500 font-medium">Booked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((r) => {
                const activityDate = new Date(r.date).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                });
                return (
                  <TableRow key={r.id} className="border-stone-100 hover:bg-stone-50">
                    <TableCell>
                      <p className="font-medium text-sm text-stone-800">{r.customerName}</p>
                      <p className="text-xs text-stone-400">{formatPhone(r.customerPhone)}</p>
                    </TableCell>
                    <TableCell className="font-medium text-stone-700">{r.activity}</TableCell>
                    <TableCell className="text-stone-600">{activityDate}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-stone-600">
                        <Users className="h-3.5 w-3.5 text-stone-400" />
                        {r.partySize}
                      </span>
                    </TableCell>
                    <TableCell>
                      {r.externalId ? (
                        <span className="font-mono text-xs flex items-center gap-1 text-stone-600">
                          {r.confirmationCode ?? r.externalId.slice(0, 8)}
                          <ExternalLink className="h-3 w-3 text-stone-400" />
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right text-xs text-stone-400">
                      {formatRelative(new Date(r.createdAt))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
