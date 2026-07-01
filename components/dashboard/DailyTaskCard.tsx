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
      <Card className="border-magenta-500/25 bg-city-navy-light shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
        <CardHeader>
          <p className="text-xs font-bold uppercase tracking-widest text-city-magenta">
            Today&apos;s Task
          </p>
          <CardTitle className="text-2xl font-extrabold leading-tight text-white">
            {task.title}
          </CardTitle>
          {task.estimated_minutes && (
            <div className="flex items-center gap-1.5 text-sm text-city-muted">
              <Clock className="h-4 w-4" />
              ~{task.estimated_minutes} min
            </div>
          )}
        </CardHeader>
        <CardContent>
          <p className="mb-6 whitespace-pre-wrap text-base leading-relaxed text-white/85">
            {task.instructions}
          </p>
          {isCompleted ? (
            <motion.div
              className="flex items-center justify-center gap-2 rounded-xl border border-city-teal/30 bg-city-teal/15 py-4 text-city-teal shadow-[0_4px_0_0_rgba(0,0,0,0.2)]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Completed today!</span>
            </motion.div>
          ) : (
            <Button
              onClick={onComplete}
              className="w-full bg-city-magenta shadow-[0_6px_0_0_#B8326A] transition-all hover:brightness-110 active:translate-y-1 active:scale-95 active:shadow-[0_2px_0_0_#B8326A]"
              size="lg"
            >
              Mark Complete
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
