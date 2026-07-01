"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteTamagotchiPhaseAction,
  upsertTamagotchiPhaseAction,
} from "@/app/actions/admin-tamagotchi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/admin/tamagotchi/ImageUploadField";
import { StarterDaySlot } from "@/components/admin/tamagotchi/StarterDaySlot";
import type { TamagotchiPhase } from "@/types/database";

interface PhaseManagerProps {
  phases: TamagotchiPhase[];
}

const MOOD_PRESETS = ["happy", "hungry", "sad"] as const;

const emptyMoodForm = {
  id: "",
  phaseName: "",
  imageUrl: "",
  conditionDescription: "",
};

export function PhaseManager({ phases }: PhaseManagerProps) {
  const router = useRouter();
  const [moodForm, setMoodForm] = useState(emptyMoodForm);
  const [isPending, startTransition] = useTransition();

  const starterPhases = phases.filter((p) => p.phase_kind === "starter");
  const moodPhases = phases.filter((p) => p.phase_kind === "mood");

  const starterByDay = (day: number) =>
    starterPhases.find((p) => p.day_number === day);

  function loadMood(phase: TamagotchiPhase) {
    setMoodForm({
      id: phase.id,
      phaseName: phase.phase_name,
      imageUrl: phase.image_url,
      conditionDescription: phase.condition_description ?? "",
    });
  }

  function resetMoodForm() {
    setMoodForm(emptyMoodForm);
  }

  function handleMoodSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!moodForm.imageUrl || !moodForm.phaseName.trim()) {
      toast.error("Mood name and sprite are required");
      return;
    }

    startTransition(async () => {
      try {
        await upsertTamagotchiPhaseAction({
          id: moodForm.id || undefined,
          phaseKind: "mood",
          phaseName: moodForm.phaseName.trim(),
          imageUrl: moodForm.imageUrl,
          conditionDescription: moodForm.conditionDescription || undefined,
        });
        toast.success(moodForm.id ? "Mood updated" : "Mood created");
        resetMoodForm();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteTamagotchiPhaseAction(id);
        toast.success("Deleted");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Delete failed");
      }
    });
  }

  return (
    <section className="space-y-8">
      <div className="rounded-xl border border-white/10 bg-[var(--card)] p-5">
        <h2 className="mb-1 text-lg font-semibold">Starter Sprites</h2>
        <p className="mb-4 text-sm text-white/50">
          One unique sprite per track day. Users see Day 1 on their first day,
          Day 2 on their second, and so on through Day 4.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {([1, 2, 3, 4] as const).map((day) => (
            <StarterDaySlot
              key={day}
              dayNumber={day}
              phase={starterByDay(day)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[var(--card)] p-5">
        <h2 className="mb-1 text-lg font-semibold">Mood Sprites (Day 5+)</h2>
        <p className="mb-4 text-sm text-white/50">
          After day 4, the companion uses mood sprites based on streak and
          whether today&apos;s task is done:{" "}
          <span className="text-city-teal">happy</span>,{" "}
          <span className="text-city-orange">hungry</span>, or{" "}
          <span className="text-city-magenta">sad</span>.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {MOOD_PRESETS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() =>
                setMoodForm({ ...emptyMoodForm, phaseName: name })
              }
              className="rounded-lg bg-city-navy-light px-3 py-1.5 text-xs capitalize text-white/60 hover:text-white"
            >
              + {name}
            </button>
          ))}
        </div>

        <form onSubmit={handleMoodSubmit} className="mb-6 grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Mood name (happy, hungry, sad)"
            value={moodForm.phaseName}
            onChange={(e) =>
              setMoodForm({ ...moodForm, phaseName: e.target.value })
            }
            required
          />
          <ImageUploadField
            className="sm:col-span-2"
            label="Mood sprite"
            value={moodForm.imageUrl}
            onChange={(imageUrl) => setMoodForm({ ...moodForm, imageUrl })}
          />
          <Textarea
            className="sm:col-span-2"
            placeholder="Description shown to the user"
            value={moodForm.conditionDescription}
            onChange={(e) =>
              setMoodForm({
                ...moodForm,
                conditionDescription: e.target.value,
              })
            }
          />
          <div className="flex gap-2 sm:col-span-2">
            <Button
              type="submit"
              disabled={
                isPending || !moodForm.imageUrl || !moodForm.phaseName.trim()
              }
            >
              {moodForm.id ? "Update Mood" : "Add Mood"}
            </Button>
            {moodForm.id && (
              <Button type="button" variant="ghost" onClick={resetMoodForm}>
                Cancel edit
              </Button>
            )}
          </div>
        </form>

        {moodPhases.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50">
                  <th className="py-2 pr-4">Preview</th>
                  <th className="py-2 pr-4">Mood</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {moodPhases.map((phase) => (
                  <tr key={phase.id} className="border-b border-white/5">
                    <td className="py-2 pr-4">
                      <div className="relative h-10 w-10">
                        <Image
                          src={phase.image_url}
                          alt={phase.phase_name}
                          fill
                          unoptimized
                          className="object-contain"
                        />
                      </div>
                    </td>
                    <td className="py-2 pr-4 font-medium capitalize">
                      {phase.phase_name}
                    </td>
                    <td className="py-2 pr-4 text-white/60">
                      {phase.condition_description}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadMood(phase)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => handleDelete(phase.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
