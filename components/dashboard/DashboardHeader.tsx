import { StreakBadge } from "@/components/gamification/StreakBadge";
import { XpBar } from "@/components/gamification/XpBar";

interface DashboardHeaderProps {
  streak: number;
  totalXp: number;
}

export function DashboardHeader({ streak, totalXp }: DashboardHeaderProps) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <StreakBadge streak={streak} />
      <XpBar totalXp={totalXp} />
    </div>
  );
}
