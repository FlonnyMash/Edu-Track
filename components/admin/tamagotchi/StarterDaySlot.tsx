"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertTamagotchiPhaseAction } from "@/app/actions/admin-tamagotchi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/admin/tamagotchi/ImageUploadField";
import type { TamagotchiPhase } from "@/types/database";

interface StarterDaySlotProps {
  dayNumber: 1 | 2 | 3 | 4;
  phase: TamagotchiPhase | undefined;
}

export function StarterDaySlot({ dayNumber, phase }: StarterDaySlotProps) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState(phase?.image_url ?? "");
  const [description, setDescription] = useState(
    phase?.condition_description ?? ""
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setImageUrl(phase?.image_url ?? "");
    setDescription(phase?.condition_description ?? "");
  }, [phase?.id, phase?.image_url, phase?.condition_description]);

  function handleSave() {
    if (!imageUrl) {
      toast.error(`Upload a sprite for Day ${dayNumber}`);
      return;
    }

    startTransition(async () => {
      try {
        await upsertTamagotchiPhaseAction({
          id: phase?.id,
          phaseKind: "starter",
          dayNumber,
          imageUrl,
          conditionDescription: description || undefined,
        });
        toast.success(`Day ${dayNumber} sprite saved`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    });
  }

  return (
    <div className="rounded-xl border border-city-teal/20 bg-city-navy-light p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-city-teal">Day {dayNumber}</h3>
        {phase && (
          <span className="pixel-label text-[10px] text-city-muted">configured</span>
        )}
      </div>

      {imageUrl && (
        <div className="relative mx-auto mb-3 h-20 w-20">
          <Image
            src={imageUrl}
            alt={`Day ${dayNumber}`}
            fill
            unoptimized
            className="object-contain"
          />
        </div>
      )}

      <ImageUploadField
        label={`Day ${dayNumber} sprite`}
        value={imageUrl}
        onChange={setImageUrl}
      />

      <Textarea
        className="mt-3"
        placeholder="Description shown to the user"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />

      <Button
        type="button"
        size="sm"
        className="mt-3 w-full"
        disabled={isPending || !imageUrl}
        onClick={handleSave}
      >
        {isPending ? "Saving..." : `Save Day ${dayNumber}`}
      </Button>
    </div>
  );
}
