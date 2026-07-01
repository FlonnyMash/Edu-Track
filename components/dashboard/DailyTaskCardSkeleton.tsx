"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, PenLine, Sparkles, Brain } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const GENERATION_STEPS = [
  { icon: Brain, label: "Reviewing your progress…" },
  { icon: BookOpen, label: "Planning today's lesson…" },
  { icon: PenLine, label: "Writing your study session…" },
  { icon: Sparkles, label: "Putting on the finishing touches…" },
] as const;

const FLOATING_KANA = ["あ", "い", "う", "か", "き"];

export function DailyTaskCardSkeleton() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStepIndex((current) => (current + 1) % GENERATION_STEPS.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const { icon: StepIcon, label } = GENERATION_STEPS[stepIndex];

  return (
    <Card className="relative overflow-hidden border-magenta-500/25 bg-city-navy-light shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
      <motion.div
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-city-magenta/10 via-transparent to-city-teal/10"
        animate={{ opacity: [0.4, 0.85, 0.4] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute inset-y-0 w-1/2 bg-linear-to-r from-transparent via-white/5 to-transparent"
        animate={{ x: ["-120%", "220%"] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
      />

      {FLOATING_KANA.map((kana, index) => (
        <motion.span
          key={kana}
          className="pointer-events-none absolute select-none text-sm font-bold text-city-teal/20"
          style={{
            left: `${12 + index * 17}%`,
            top: `${18 + (index % 3) * 22}%`,
          }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.15, 0.45, 0.15],
            rotate: [0, index % 2 === 0 ? 8 : -8, 0],
          }}
          transition={{
            duration: 2.4 + index * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.2,
          }}
          aria-hidden
        >
          {kana}
        </motion.span>
      ))}

      <CardHeader className="relative">
        <p className="text-xs font-bold uppercase tracking-widest text-city-magenta">
          Today&apos;s Task
        </p>

        <div className="mt-4 flex items-center gap-4">
          <motion.div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-city-teal/30 bg-city-teal/10 shadow-[0_0_20px_rgba(61,219,207,0.25)]"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <StepIcon className="h-6 w-6 text-city-teal" />
            </motion.div>
            <motion.span
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-city-magenta text-[10px] text-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              ✦
            </motion.span>
          </motion.div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white/90">
              AI tutor is crafting your session
            </p>
            <div className="mt-1 h-5 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={label}
                  className="text-sm text-city-teal/90"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                >
                  {label}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          {GENERATION_STEPS.map((_, index) => (
            <motion.div
              key={index}
              className="h-1.5 flex-1 rounded-full bg-city-navy/80"
              animate={{
                backgroundColor:
                  index <= stepIndex
                    ? "rgba(61, 219, 207, 0.85)"
                    : "rgba(255, 255, 255, 0.08)",
              }}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3 pt-2">
        <motion.div
          className="h-3.5 w-[92%] rounded-lg bg-city-navy/70"
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />

        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="space-y-2 rounded-xl border border-white/6 bg-city-navy/50 p-3"
          >
            <div className="flex items-center gap-2">
              <motion.div
                className="h-4 w-4 rounded bg-city-teal/20"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.15,
                }}
              />
              <motion.div
                className="h-2.5 w-20 rounded bg-city-navy/80"
                animate={{ opacity: [0.35, 0.7, 0.35] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.15,
                }}
              />
            </div>
            <motion.div
              className="h-3 rounded-lg bg-city-navy/70"
              style={{ width: `${78 - index * 6}%` }}
              animate={{ opacity: [0.35, 0.7, 0.35] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.25,
              }}
            />
          </div>
        ))}

        <motion.div
          className="mt-2 h-14 rounded-xl bg-city-magenta/15"
          animate={{ opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="mt-2 flex items-center justify-center gap-1.5 pt-2">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="h-2 w-2 rounded-full bg-city-magenta"
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: dot * 0.15,
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
