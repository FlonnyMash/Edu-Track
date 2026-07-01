"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { detectTimezone } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ensureProfileSession } from "@/lib/profiles/ensure-profile-client";
import { serializeLearningMaterials } from "@/lib/profiles/learning-materials";
import {
  goalSetupSchema,
  LEARNING_MATERIAL_PRESETS,
} from "@/lib/validations/schemas";

type Difficulty = "gentle" | "balanced" | "ambitious";
type MaterialPreset = (typeof LEARNING_MATERIAL_PRESETS)[number];

function buildLearningMaterialsList(
  selected: Set<MaterialPreset>,
  customMaterial: string
): string[] {
  const materials: string[] = [];

  for (const preset of selected) {
    if (preset === "Custom/Other") {
      const custom = customMaterial.trim();
      if (custom) materials.push(custom);
    } else {
      materials.push(preset);
    }
  }

  return materials;
}

export function GoalSetupForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<
    Set<MaterialPreset>
  >(new Set());
  const [customMaterial, setCustomMaterial] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("balanced");
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTimezone(detectTimezone());
  }, []);

  function toggleMaterial(option: MaterialPreset) {
    setSelectedMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(option)) {
        next.delete(option);
      } else {
        next.add(option);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const learningMaterials = buildLearningMaterialsList(
      selectedMaterials,
      customMaterial
    );

    const parsed = goalSetupSchema.safeParse({
      title,
      description: description || undefined,
      difficultyPreference: difficulty,
      timezone,
      learningMaterials:
        learningMaterials.length > 0 ? learningMaterials : undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid form data");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    await ensureProfileSession();

    const { error: trackError } = await supabase.from("learning_tracks").upsert(
      {
        user_id: user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        difficulty_preference: parsed.data.difficultyPreference,
        is_active: true,
      },
      { onConflict: "user_id" }
    );

    if (trackError) {
      setError(trackError.message);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        timezone: parsed.data.timezone,
        onboarding_completed: true,
        learning_material: serializeLearningMaterials(
          parsed.data.learningMaterials ?? []
        ),
      })
      .eq("id", user.id);

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const difficulties: { value: Difficulty; label: string; desc: string }[] = [
    { value: "gentle", label: "Gentle", desc: "15-20 min, easy pace" },
    { value: "balanced", label: "Balanced", desc: "20-30 min, steady growth" },
    { value: "ambitious", label: "Ambitious", desc: "30-45 min, push harder" },
  ];

  return (
    <Card className="city-pop-border">
      <CardHeader>
        <CardTitle>Set your learning goal</CardTitle>
        <p className="text-sm text-white/60">
          What do you want to learn? The AI will plan your daily tasks.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm text-white/70">
              Learning goal
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Japanese Hiragana"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-white/70">
              What learning materials do you use?
            </label>
            <p className="mb-2 text-xs text-white/50">
              Optional — select all that apply. Helps the AI plan tasks around
              your textbooks and apps.
            </p>
            <div className="grid gap-2">
              {LEARNING_MATERIAL_PRESETS.map((option) => {
                const isSelected = selectedMaterials.has(option);
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleMaterial(option)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-[var(--accent-teal)] bg-[var(--accent-teal)]/10 shadow-[0_0_12px_rgba(61,219,207,0.15)]"
                        : "border-white/10 hover:border-[var(--accent-teal)]/40 hover:shadow-[0_0_8px_rgba(61,219,207,0.08)]"
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                    {isSelected && (
                      <span className="ml-2 text-xs text-[var(--accent-teal)]">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedMaterials.has("Custom/Other") && (
              <Input
                className="mt-2"
                value={customMaterial}
                onChange={(e) => setCustomMaterial(e.target.value)}
                placeholder="e.g. Minna no Nihongo"
              />
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-white/70">
              More context (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="I'm a complete beginner and want to read basic signs..."
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-white/70">Pace</label>
            <div className="grid gap-2">
              {difficulties.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    difficulty === d.value
                      ? "border-[var(--accent-teal)] bg-[var(--accent-teal)]/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <span className="font-medium">{d.label}</span>
                  <span className="block text-xs text-white/50">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Setting up..." : "Start My Journey"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
