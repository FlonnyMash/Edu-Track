"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CompletionSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reflectionNotes: string) => Promise<void>;
}

export function CompletionSheet({ open, onClose, onSubmit }: CompletionSheetProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    await onSubmit(notes);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      setNotes("");
      setLoading(false);
      onClose();
    }, 1500);
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} title="Complete today's task">
        <p className="mb-4 text-sm text-white/60">
          Great work! Optionally note what else you learned today.
        </p>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="I also practiced pronunciation..."
          className="mb-4"
        />
        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={loading}
        >
          {loading ? "Saving..." : "Complete & Earn XP"}
        </Button>
      </Dialog>

      {showCelebration && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="rounded-2xl bg-[var(--accent-pink)]/90 px-8 py-6 text-center text-white shadow-2xl"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <p className="text-3xl font-bold">+XP!</p>
            <p className="text-sm opacity-80">Keep the streak alive</p>
          </motion.div>
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full"
              style={{
                background: i % 2 === 0 ? "var(--accent-pink)" : "var(--accent-teal)",
              }}
              initial={{
                x: 0,
                y: 0,
                opacity: 1,
              }}
              animate={{
                x: (Math.random() - 0.5) * 300,
                y: (Math.random() - 0.5) * 300,
                opacity: 0,
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          ))}
        </motion.div>
      )}
    </>
  );
}
