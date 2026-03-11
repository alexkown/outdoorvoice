import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "OutdoorVoice — 24/7 AI Receptionist for Outdoor Businesses",
  description:
    "OutdoorVoice answers every call 24/7 so you can focus on leading incredible outdoor experiences. Never miss a booking again.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${barlowCondensed.variable} ${inter.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
