"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Phone,
  MessageSquare,
  CalendarCheck,
  Settings,
  CreditCard,
  BookOpen,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/calls", label: "Calls", icon: Phone },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/reservations", label: "Reservations", icon: CalendarCheck },
  { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card px-3 py-4">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 pb-6 pt-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Waves className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg">OutdoorVoice</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="flex items-center gap-3 px-3 pt-4 border-t">
        <UserButton afterSignOutUrl="/sign-in" />
        <span className="text-sm text-muted-foreground">Account</span>
      </div>
    </aside>
  );
}
