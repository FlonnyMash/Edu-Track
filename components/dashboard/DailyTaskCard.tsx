"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DailyTask } from "@/types/database";

interface DailyTaskCardProps {
  task: DailyTask;
  onComplete: () => void;
}

export function DailyTaskCard({ task, onComplete }: DailyTaskCardProps) {
  const isCompleted = task.status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="city-pop-border">
        <CardHeader>
          <p className="pixel-label text-[var(--accent-pink)]">Today&apos;s Task</p>
          <CardTitle className="text-xl">{task.title}</CardTitle>
          {task.estimated_minutes && (
            <div className="flex items-center gap-1.5 text-sm text-white/50">
              <Clock className="h-4 w-4" />
              ~{task.estimated_minutes} min
            </div>
          )}
        </CardHeader>
        <CardContent>
          <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
            {task.instructions}
          </p>
          {isCompleted ? (
            <motion.div
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-teal)]/20 py-4 text-[var(--accent-teal)]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Completed today!</span>
            </motion.div>
          ) : (
            <Button onClick={onComplete} className="w-full" size="lg">
              Mark Complete
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
