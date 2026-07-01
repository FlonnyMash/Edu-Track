import { StreakBadge } from "@/components/gamification/StreakBadge";
import { XpBar } from "@/components/gamification/XpBar";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  streak: number;
  totalXp: number;
  celebrate?: boolean;
}

export function DashboardHeader({
  streak,
  totalXp,
  celebrate = false,
}: DashboardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-stretch gap-3 rounded-2xl transition-all duration-300",
        celebrate && "animate-pulse-glow"
      )}
    >
      <StreakBadge streak={streak} />
      <XpBar totalXp={totalXp} />
    </div>
  );
}
