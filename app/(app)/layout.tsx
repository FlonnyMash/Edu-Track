import { BottomNav } from "@/components/layout/BottomNav";
import { DevTools } from "@/components/DevTools";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <DevTools />
      <main className="flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
