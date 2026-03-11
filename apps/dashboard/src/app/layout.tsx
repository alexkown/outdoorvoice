import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "OutdoorVoice — 24/7 AI Receptionist for Outdoor Businesses",
  description:
    "OutdoorVoice answers every call 24/7 so you can focus on leading incredible outdoor experiences. Never miss a booking again.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
