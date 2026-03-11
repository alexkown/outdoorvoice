// ---------------------------------------------------------------------------
// Shared enums (mirrors Prisma enums for use in non-DB code)
// ---------------------------------------------------------------------------

export type BusinessType = "KAYAK_CANOE" | "HIKING_TOURS" | "CAMPING_RV" | "OTHER";

export type FallbackBehavior = "TAKE_MESSAGE" | "TRANSFER" | "AI_DECIDES";

export type CallOutcome = "FAQ" | "RESERVATION" | "MESSAGE" | "TRANSFER" | "ABANDONED";

export type ReservationPlatform =
  | "FAREHARBOR"
  | "REZDY"
  | "CAMPSPOT"
  | "GOOGLE_CALENDAR"
  | "GENERIC";

export type ReservationStatus = "CONFIRMED" | "PENDING" | "CANCELLED" | "FAILED";

export type MessageStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";

export type KBSource = "MANUAL" | "WEBSITE" | "DOCUMENT";

export type UsageType = "CALL_MINUTES" | "RESERVATION_BOOKED" | "MESSAGE_TAKEN" | "PHONE_NUMBER";

// ---------------------------------------------------------------------------
// Operating hours
// ---------------------------------------------------------------------------

export interface DaySchedule {
  open: string;  // "HH:MM" 24h
  close: string; // "HH:MM" 24h
  closed: boolean;
}

export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

// ---------------------------------------------------------------------------
// Voice agent — intent classification
// ---------------------------------------------------------------------------

export type CallerIntent = "faq" | "reservation" | "message" | "transfer" | "unknown";

export interface IntentClassification {
  intent: CallerIntent;
  confidence: number; // 0–1
  reasoning: string;
}

// ---------------------------------------------------------------------------
// Reservation integration interface
// (all platform adapters implement this)
// ---------------------------------------------------------------------------

export interface TimeSlot {
  startTime: string;  // ISO 8601
  endTime: string;
  availableSpots: number;
  activityName: string;
  activityId: string;
  price?: number; // per person, USD
}

export interface AvailabilityQuery {
  date: string; // YYYY-MM-DD
  activityName?: string;
  partySize: number;
}

export interface BookingRequest {
  activityId: string;
  startTime: string; // ISO 8601
  partySize: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
}

export interface BookingResult {
  success: boolean;
  externalId?: string;
  confirmationCode?: string;
  error?: string;
}

export interface ReservationProvider {
  platform: ReservationPlatform;
  getAvailability(query: AvailabilityQuery): Promise<TimeSlot[]>;
  createBooking(request: BookingRequest): Promise<BookingResult>;
  cancelBooking(externalId: string): Promise<{ success: boolean; error?: string }>;
}

// ---------------------------------------------------------------------------
// Notification payloads
// ---------------------------------------------------------------------------

export interface NewBookingNotification {
  type: "NEW_BOOKING";
  businessName: string;
  customerName: string;
  customerPhone: string;
  activity: string;
  date: string;
  partySize: number;
  confirmationCode?: string;
}

export interface NewMessageNotification {
  type: "NEW_MESSAGE";
  businessName: string;
  callerName?: string;
  callerPhone: string;
  callbackTime?: string;
  summary: string;
}

export type StaffNotification = NewBookingNotification | NewMessageNotification;

// ---------------------------------------------------------------------------
// Onboarding wizard steps
// ---------------------------------------------------------------------------

export type OnboardingStep =
  | "business_info"
  | "phone_setup"
  | "reservation_platform"
  | "transfer_numbers"
  | "notifications"
  | "voice_selection"
  | "greeting"
  | "complete";
