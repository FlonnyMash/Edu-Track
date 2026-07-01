"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import { hardResetUser, softResetUser } from "@/app/actions/resetActions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const dangerDialogClass =
  "border-city-magenta/30 bg-white/5 backdrop-blur-xl shadow-[0_0_32px_rgba(255,77,141,0.2)]";

export function ResetZone() {
  const router = useRouter();
  const [softOpen, setSoftOpen] = useState(false);
  const [hardOpen, setHardOpen] = useState(false);
  const [wipeConfirm, setWipeConfirm] = useState("");
  const [isPending, startTransition] = useTransition();

  function closeHardModal() {
    setHardOpen(false);
    setWipeConfirm("");
  }

  function handleSoftReset() {
    startTransition(async () => {
      const result = await softResetUser();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSoftOpen(false);
      toast.success("Track reset. Your XP and Tamagotchi are untouched.");
      router.refresh();
    });
  }

  function handleHardReset() {
    if (wipeConfirm !== "WIPE") return;

    startTransition(async () => {
      const result = await hardResetUser();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      closeHardModal();
      toast.success("Account wiped. Starting fresh.");
      router.push("/onboarding");
      router.refresh();
    });
  }

  return (
    <>
      <Card className="mb-6 border-city-magenta/40 bg-[var(--card)]/80 shadow-[0_0_24px_rgba(255,77,141,0.15)] transition-shadow hover:shadow-[0_0_28px_rgba(255,77,141,0.25)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-city-magenta" />
            <CardTitle className="text-city-magenta">Danger Zone</CardTitle>
          </div>
          <p className="text-xs text-white/50">
            Destructive actions for your learning progress. Proceed with care.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <button
              type="button"
              onClick={() => setSoftOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-city-orange/30 bg-city-orange/5 p-4 text-left transition-colors hover:border-city-orange/50 hover:bg-city-orange/10"
            >
              <RotateCcw className="h-5 w-5 shrink-0 text-city-orange" />
              <div>
                <p className="font-medium text-white">Reset Track</p>
                <p className="text-xs text-white/50">
                  Clears streak and daily progress. Keeps XP, stats, and
                  Tamagotchi.
                </p>
              </div>
            </button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <button
              type="button"
              onClick={() => setHardOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-left transition-colors hover:border-red-500/50 hover:bg-red-500/10"
            >
              <Trash2 className="h-5 w-5 shrink-0 text-red-400" />
              <div>
                <p className="font-medium text-white">Clean Wipe</p>
                <p className="text-xs text-white/50">
                  Deletes all progress, analytics, XP, and Tamagotchi items.
                </p>
              </div>
            </button>
          </motion.div>
        </CardContent>
      </Card>

      <Dialog
        open={softOpen}
        onClose={() => !isPending && setSoftOpen(false)}
        title="Reset Track?"
        className={dangerDialogClass}
      >
        <p className="mb-6 text-sm text-white/60">
          Clears your current streak and daily progress. Your total XP, lifetime
          stats, and Tamagotchi stay.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setSoftOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleSoftReset}
            disabled={isPending}
          >
            {isPending ? "Resetting..." : "Confirm Reset Track"}
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={hardOpen}
        onClose={() => !isPending && closeHardModal()}
        title="Clean Wipe?"
        className={dangerDialogClass}
      >
        <p className="mb-4 text-sm text-white/60">
          Permanently deletes all progress, analytics, XP, and Tamagotchi items.
          This cannot be undone. Type{" "}
          <span className="font-mono text-city-magenta">WIPE</span> to confirm.
        </p>
        <Input
          value={wipeConfirm}
          onChange={(e) => setWipeConfirm(e.target.value)}
          placeholder="Type WIPE"
          className="mb-6 border-red-500/30 focus:border-red-500/50"
          disabled={isPending}
          autoComplete="off"
        />
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={closeHardModal}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleHardReset}
            disabled={isPending || wipeConfirm !== "WIPE"}
          >
            {isPending ? "Wiping..." : "Confirm Clean Wipe"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
