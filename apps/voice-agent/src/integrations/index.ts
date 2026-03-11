/**
 * Reservation provider factory.
 * Given a business's IntegrationConfig, returns the correct ReservationProvider.
 * All new platforms get added here — the conversation agent never imports adapters directly.
 */

import type { ReservationProvider } from "@outdoorvoice/types";
import type { IntegrationConfig } from "@outdoorvoice/db";
import { createFareHarborProvider } from "./fareharbor.js";

export function createReservationProvider(
  config: Pick<IntegrationConfig, "platform" | "apiKey" | "companyId">
): ReservationProvider | null {
  switch (config.platform) {
    case "FAREHARBOR": {
      if (!config.apiKey || !config.companyId) return null;
      return createFareHarborProvider(config.apiKey, config.companyId);
    }

    case "REZDY":
    case "CAMPSPOT":
    case "GOOGLE_CALENDAR":
    case "GENERIC":
      // Phase 4+: stubs — return null so the agent falls back to message-taking
      return null;

    default:
      return null;
  }
}
