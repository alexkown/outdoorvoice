"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarCheck, Loader2, ExternalLink, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const STATUS_VARIANT: Record<Reservation["status"], "success" | "secondary" | "destructive" | "warning"> = {
  CONFIRMED: "success",
  PENDING: "secondary",
  CANCELLED: "secondary",
  FAILED: "destructive",
};

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Reservations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bookings created by your AI agent via phone
        </p>
      </div>

      {/* Summary chips */}
      {!loading && reservations.length > 0 && (
        <div className="flex gap-3">
          <div className="rounded-lg border bg-card px-4 py-2 text-sm">
            <span className="font-bold text-lg">{confirmed}</span>
            <span className="text-muted-foreground ml-1">confirmed</span>
          </div>
          {pending > 0 && (
            <div className="rounded-lg border bg-card px-4 py-2 text-sm">
              <span className="font-bold text-lg">{pending}</span>
              <span className="text-muted-foreground ml-1">pending</span>
            </div>
          )}
          <div className="rounded-lg border bg-card px-4 py-2 text-sm">
            <span className="font-bold text-lg">{reservations.length}</span>
            <span className="text-muted-foreground ml-1">total</span>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Agent Bookings
          </CardTitle>
          <CardDescription>
            All reservations created via phone call, synced to FareHarbor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No reservations yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Bookings made through your AI agent will appear here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-20">Party</TableHead>
                  <TableHead>Conf #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Booked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r) => {
                  const activityDate = new Date(r.date).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  });
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{r.customerName}</p>
                        <p className="text-xs text-muted-foreground">{formatPhone(r.customerPhone)}</p>
                      </TableCell>
                      <TableCell className="font-medium">{r.activity}</TableCell>
                      <TableCell>{activityDate}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {r.partySize}
                        </span>
                      </TableCell>
                      <TableCell>
                        {r.externalId ? (
                          <span className="font-mono text-xs flex items-center gap-1">
                            {r.confirmationCode ?? r.externalId.slice(0, 8)}
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[r.status]} className="capitalize text-xs">
                          {r.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatRelative(new Date(r.createdAt))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
