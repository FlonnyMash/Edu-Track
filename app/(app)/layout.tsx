import Link from "next/link";
import { BarChart3, LayoutDashboard, Settings } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <div className="flex-1 px-4 pb-24 pt-6">{children}</div>
      <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[var(--background)]/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center justify-around py-3">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 text-xs text-white/60 hover:text-[var(--accent-teal)]"
          >
            <LayoutDashboard className="h-5 w-5" />
            Home
          </Link>
          <Link
            href="/analytics"
            className="flex flex-col items-center gap-1 text-xs text-white/60 hover:text-[var(--accent-teal)]"
          >
            <BarChart3 className="h-5 w-5" />
            Analytics
          </Link>
          <Link
            href="/settings"
            className="flex flex-col items-center gap-1 text-xs text-white/60 hover:text-[var(--accent-teal)]"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </nav>
    </div>
  );
}
