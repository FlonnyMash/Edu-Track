"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { addCustomItemAction } from "@/app/actions/learning-items";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AddCustomWordModalProps {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

export function AddCustomWordModal({
  open,
  onClose,
  onAdded,
}: AddCustomWordModalProps) {
  const [term, setTerm] = useState("");
  const [meaning, setMeaning] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setTerm("");
    setMeaning("");
    setCategory("");
  }

  function handleClose() {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await addCustomItemAction(term, meaning, category);
      toast.success("Word added to your learning loop");
      resetForm();
      onAdded?.();
      onClose();
    } catch (error) {
      toast.error("Could not add word", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Add Custom Word">
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="custom-term" className="pixel-label text-xs text-city-teal">
            Term
          </label>
          <Input
            id="custom-term"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="e.g. 猫"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="custom-meaning"
            className="pixel-label text-xs text-city-teal"
          >
            Meaning
          </label>
          <Input
            id="custom-meaning"
            value={meaning}
            onChange={(event) => setMeaning(event.target.value)}
            placeholder="e.g. neko (cat)"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="custom-category"
            className="pixel-label text-xs text-city-teal"
          >
            Category
          </label>
          <Input
            id="custom-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="e.g. Animals"
            required
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold transition-all duration-300",
            isSubmitting
              ? "cursor-not-allowed border-white/10 bg-city-navy/60 text-city-muted opacity-60"
              : "border-city-magenta/60 bg-linear-to-r from-city-magenta to-city-orange text-white shadow-[0_6px_0_0_#B8326A] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_0_#B8326A]"
          )}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {isSubmitting ? "Adding..." : "Add to Active Learning"}
        </button>
      </form>
    </Dialog>
  );
}
