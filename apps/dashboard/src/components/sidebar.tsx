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
    <aside className="flex h-screen w-60 flex-col bg-white border-r border-stone-100">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-stone-100 flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700">
          <Waves className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-stone-900 tracking-tight">OutdoorVoice</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-colors",
                  active ? "text-emerald-600" : "text-stone-400"
                )}
              />
              {label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="flex items-center gap-3 px-5 py-4 border-t border-stone-100 flex-shrink-0">
        <UserButton afterSignOutUrl="/sign-in" />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-stone-700 truncate">Account</span>
          <span className="text-xs text-stone-400">Manage profile</span>
        </div>
      </div>
    </aside>
  );
}
