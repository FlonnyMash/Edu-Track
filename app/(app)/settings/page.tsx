"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetZone } from "@/components/Settings/ResetZone";
import { detectTimezone } from "@/lib/utils";

type Difficulty = "gentle" | "balanced" | "ambitious";

export default function SettingsPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("balanced");
  const [timezone, setTimezone] = useState("UTC");
  const [currentChapter, setCurrentChapter] = useState("Hiragana");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: track }, { data: progress }] =
        await Promise.all([
        supabase.from("profiles").select("timezone").eq("id", user.id).single(),
        supabase
          .from("learning_tracks")
          .select("title, description, difficulty_preference")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_progress")
          .select("current_chapter")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (profile?.timezone) setTimezone(profile.timezone);
      else setTimezone(detectTimezone());

      if (track) {
        setTitle(track.title);
        setDescription(track.description || "");
        setDifficulty(track.difficulty_preference as Difficulty);
      }

      if (progress?.current_chapter) {
        setCurrentChapter(progress.current_chapter);
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ timezone })
      .eq("id", user.id);

    const { error } = await supabase.from("learning_tracks").upsert(
      {
        user_id: user.id,
        title,
        description: description || null,
        difficulty_preference: difficulty,
        is_active: true,
      },
      { onConflict: "user_id" }
    );

    const { error: progressError } = await supabase.from("user_progress").upsert(
      {
        user_id: user.id,
        current_chapter: currentChapter.trim() || "Hiragana",
      },
      { onConflict: "user_id" }
    );

    setSaving(false);
    setMessage(
      error || progressError
        ? error?.message || progressError?.message || "Save failed"
        : "Settings saved!"
    );
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-white/10" />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <Card className="mb-6 city-pop-border">
        <CardHeader>
          <CardTitle>Learning Goal</CardTitle>
          <p className="text-xs text-white/50">
            Changing your goal may affect future AI task planning.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-white/70">Goal</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/70">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/70">Pace</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="flex h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm"
              >
                <option value="gentle">Gentle</option>
                <option value="balanced">Balanced</option>
                <option value="ambitious">Ambitious</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/70">
                Current chapter / lesson
              </label>
              <Input
                value={currentChapter}
                onChange={(e) => setCurrentChapter(e.target.value)}
                placeholder="e.g. Genki I Lesson 3"
              />
              <p className="mt-1.5 text-xs text-white/50">
                Override where the AI thinks you are in your curriculum. The AI
                will still suggest advancing after completed tasks.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/70">Timezone</label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>
            {message && (
              <p className={`text-sm ${message.includes("saved") ? "text-[var(--accent-teal)]" : "text-red-400"}`}>
                {message}
              </p>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <ResetZone />

      <Button variant="destructive" onClick={handleSignOut} className="w-full">
        Sign Out
      </Button>
    </div>
  );
}
