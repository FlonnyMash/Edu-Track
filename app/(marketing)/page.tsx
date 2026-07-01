import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Flame, Map } from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-city-teal">
          <Sparkles className="h-4 w-4" />
          AI-powered daily learning
        </div>
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          <span className="bg-linear-to-r from-city-magenta to-city-teal bg-clip-text text-transparent">
            Edu Track
          </span>
        </h1>
        <p className="mb-8 text-lg text-white/60">
          Your intelligent daily learning companion. One progressive task each day,
          streaks that matter, and a retro city-pop journey that grows with you.
        </p>
        <div className="mb-10 flex flex-wrap justify-center gap-4 text-sm text-white/50">
          <span className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-city-magenta" /> Daily streaks
          </span>
          <span className="flex items-center gap-1.5">
            <Map className="h-4 w-4 text-city-teal" /> Progress map
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-city-orange" /> AI tasks
          </span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
