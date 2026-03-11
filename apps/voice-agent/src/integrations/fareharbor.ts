/**
 * FareHarbor reservation adapter — full implementation.
 *
 * FareHarbor External API v1: https://fareharbor.com/help/api/
 *
 * Auth: two API keys per request
 *   X-FareHarbor-API-App  — platform-level key (ours, from env)
 *   X-FareHarbor-API-User — per-business user key (from IntegrationConfig.apiKey)
 *
 * Key endpoints:
 *   GET  /companies/{shortname}/items/
 *   GET  /companies/{shortname}/items/{item_pk}/availabilities/date/{YYYY-MM-DD}/
 *   POST /companies/{shortname}/availabilities/{availability_pk}/bookings/
 *   DELETE /companies/{shortname}/bookings/{uuid}/
 */

import type {
  ReservationProvider,
  AvailabilityQuery,
  BookingRequest,
  BookingResult,
  TimeSlot,
} from "@outdoorvoice/types";

// ---------------------------------------------------------------------------
// FareHarbor API shapes (subset used by OutdoorVoice)
// ---------------------------------------------------------------------------

interface FHItem {
  pk: number;
  name: string;
  headline: string;
}

interface FHCustomerTypeRate {
  pk: number;
  total: number; // cents
  customer_type: { pk: number; singular: string; plural: string };
  capacity: number;
}

interface FHAvailability {
  pk: number;
  start_at: string; // ISO 8601
  end_at: string;
  capacity: number;
  customer_type_rates: FHCustomerTypeRate[];
  item: { pk: number; name: string };
}

interface FHBooking {
  pk: number;
  uuid: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class FareHarborProvider implements ReservationProvider {
  readonly platform = "FAREHARBOR" as const;
  private readonly base = "https://fareharbor.com/api/external/v1";

  constructor(
    private readonly companyShortname: string,
    private readonly userApiKey: string,
    private readonly appApiKey: string = process.env["FAREHARBOR_APP_API_KEY"] ?? ""
  ) {}

  private authHeaders() {
    return {
      "X-FareHarbor-API-App": this.appApiKey,
      "X-FareHarbor-API-User": this.userApiKey,
      "Content-Type": "application/json",
    };
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      headers: this.authHeaders(),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      throw new Error(`FareHarbor ${path}: ${res.status} ${await res.text()}`);
    }
    return res.json() as Promise<T>;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      throw new Error(`FareHarbor POST ${path}: ${res.status} ${await res.text()}`);
    }
    return res.json() as Promise<T>;
  }

  private async doDelete(path: string): Promise<void> {
    const res = await fetch(`${this.base}${path}`, {
      method: "DELETE",
      headers: this.authHeaders(),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      throw new Error(`FareHarbor DELETE ${path}: ${res.status}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Items (activities)
  // ---------------------------------------------------------------------------

  async getItems(): Promise<FHItem[]> {
    const data = await this.get<{ items: FHItem[] }>(
      `/companies/${this.companyShortname}/items/`
    );
    return data.items;
  }

  /** Fuzzy-match a spoken activity name to a FareHarbor item. */
  async findItem(activityName: string): Promise<FHItem | null> {
    const items = await this.getItems();
    const lower = activityName.toLowerCase();
    return (
      items.find((i) => i.name.toLowerCase().includes(lower)) ??
      items.find((i) => lower.includes(i.name.toLowerCase())) ??
      null
    );
  }

  // ---------------------------------------------------------------------------
  // getAvailability
  // ---------------------------------------------------------------------------

  async getAvailability(query: AvailabilityQuery): Promise<TimeSlot[]> {
    const items = await this.getItems();

    const targetItems = query.activityName
      ? items.filter(
          (i) =>
            i.name.toLowerCase().includes(query.activityName!.toLowerCase()) ||
            query.activityName!.toLowerCase().includes(i.name.toLowerCase())
        )
      : items;

    if (targetItems.length === 0) return [];

    const results = await Promise.allSettled(
      targetItems.map((item) =>
        this.get<{ availabilities: FHAvailability[] }>(
          `/companies/${this.companyShortname}/items/${item.pk}/availabilities/date/${query.date}/`
        ).then((d) => d.availabilities)
      )
    );

    const slots: TimeSlot[] = [];

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      for (const avail of result.value) {
        if (avail.capacity < query.partySize) continue;

        // Prefer adult/general rate; fall back to first
        const rate =
          avail.customer_type_rates.find((r) =>
            ["adult", "guest", "person", "general"].some((kw) =>
              r.customer_type.singular.toLowerCase().includes(kw)
            )
          ) ?? avail.customer_type_rates[0];

        slots.push({
          startTime: avail.start_at,
          endTime: avail.end_at,
          availableSpots: avail.capacity,
          activityName: avail.item.name,
          activityId: String(avail.pk), // availability PK — used for booking
          price: rate ? Math.round(rate.total / 100) : undefined,
        });
      }
    }

    return slots.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  // ---------------------------------------------------------------------------
  // createBooking
  // ---------------------------------------------------------------------------

  async createBooking(request: BookingRequest): Promise<BookingResult> {
    const availPk = parseInt(request.activityId, 10);

    // Build customer list — one entry per person
    const customers = Array.from({ length: request.partySize }, () => ({
      customer_type_rate: availPk,
    }));

    try {
      const data = await this.post<{ booking: FHBooking }>(
        `/companies/${this.companyShortname}/availabilities/${availPk}/bookings/`,
        {
          contact: {
            name: request.customerName,
            phone: request.customerPhone,
            email: request.customerEmail ?? "",
          },
          customers,
          voucher_number: "PHONE",
          rebooking: false,
          note: request.notes ?? "Booked via OutdoorVoice AI phone agent",
        }
      );

      return {
        success: true,
        externalId: data.booking.uuid,
        confirmationCode: String(data.booking.pk),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "FareHarbor booking failed",
      };
    }
  }

  // ---------------------------------------------------------------------------
  // cancelBooking
  // ---------------------------------------------------------------------------

  async cancelBooking(
    externalId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.doDelete(
        `/companies/${this.companyShortname}/bookings/${externalId}/`
      );
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Cancellation failed",
      };
    }
  }
}

export function createFareHarborProvider(
  apiKey: string,
  companyId: string
): FareHarborProvider {
  return new FareHarborProvider(companyId, apiKey);
}
