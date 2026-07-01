"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Gamepad2,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/tamagotchi", label: "Pet", icon: Gamepad2 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[var(--shell-max-width)] -translate-x-1/2 border-t border-white/10 bg-city-navy/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex items-stretch justify-around px-2 py-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium transition-all duration-200",
                isActive
                  ? "text-city-teal drop-shadow-[0_0_8px_rgba(61,219,207,0.6)]"
                  : "text-white/45 hover:text-white/70"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-all duration-200",
                  isActive &&
                    "text-city-magenta drop-shadow-[0_0_10px_rgba(255,77,141,0.7)]"
                )}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span className={cn(isActive && "text-city-teal")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
