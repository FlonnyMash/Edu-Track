"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { AddCustomWordModal } from "@/components/library/AddCustomWordModal";
import { LearningItemCard } from "@/components/library/LearningItemCard";
import { LibraryUnitSection } from "@/components/library/LibraryUnitSection";
import { buildLearningItemMap } from "@/lib/learning/item-utils";
import type { LibraryScript, LibraryScriptGroup } from "@/lib/library/catalog";
import type { UserLearningItem } from "@/types/database";
import { cn } from "@/lib/utils";

type LibraryTab = LibraryScript | "my-words";

interface LibraryClientProps {
  scripts: LibraryScriptGroup[];
  learningItems: UserLearningItem[];
}

const TAB_OPTIONS: { id: LibraryTab; label: string }[] = [
  { id: "hiragana", label: "Hiragana" },
  { id: "katakana", label: "Katakana" },
  { id: "vocabulary", label: "Vocabulary" },
  { id: "my-words", label: "My Words" },
];

export function LibraryClient({ scripts, learningItems }: LibraryClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LibraryTab>("hiragana");
  const [modalOpen, setModalOpen] = useState(false);

  const learningItemByKey = useMemo(
    () => buildLearningItemMap(learningItems),
    [learningItems]
  );

  const activeItems = useMemo(
    () => learningItems.filter((item) => item.status === "active"),
    [learningItems]
  );

  const pendingItems = useMemo(
    () => learningItems.filter((item) => item.status === "pending"),
    [learningItems]
  );

  const archivedItems = useMemo(
    () => learningItems.filter((item) => item.status === "archived"),
    [learningItems]
  );

  const activeGroup = scripts.find((group) => group.id === activeTab);

  function handleRefresh() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Library categories"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {TAB_OPTIONS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`library-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`library-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-xl border-2 px-2 py-2.5 text-xs font-bold transition-all duration-200 sm:text-sm",
                isActive
                  ? "border-city-magenta/60 bg-linear-to-r from-city-magenta to-city-orange text-white shadow-[0_4px_0_0_#B8326A] active:translate-y-0.5 active:shadow-[0_2px_0_0_#B8326A]"
                  : "border-city-teal/35 bg-city-navy-light text-city-teal shadow-[0_4px_0_0_#238982] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_0_#238982]"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "my-words" ? (
          <motion.div
            key="my-words"
            role="tabpanel"
            id="library-panel-my-words"
            aria-labelledby="library-tab-my-words"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-6"
          >
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-city-magenta/60 bg-linear-to-r from-city-magenta to-city-orange text-sm font-bold text-white shadow-[0_6px_0_0_#B8326A] transition-all hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_0_#B8326A]"
            >
              <Plus className="h-4 w-4" />
              Add Custom Word
            </button>

            {pendingItems.length > 0 ? (
              <section className="space-y-3" aria-labelledby="pending-learning-heading">
                <h2
                  id="pending-learning-heading"
                  className="pixel-label text-sm font-bold text-city-orange"
                >
                  Pending Suggestions
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {pendingItems.map((item) => (
                    <LearningItemCard
                      key={item.id}
                      item={item}
                      variant="pending"
                      onStatusChange={handleRefresh}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-3" aria-labelledby="active-learning-heading">
              <h2
                id="active-learning-heading"
                className="pixel-label text-sm font-bold text-city-teal"
              >
                Active Learning
              </h2>
              {activeItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {activeItems.map((item) => (
                    <LearningItemCard
                      key={item.id}
                      item={item}
                      variant="active"
                      onStatusChange={handleRefresh}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-white/10 bg-city-navy/40 p-4 text-sm text-city-muted">
                  No active items yet. Activate catalog tiles or add a custom
                  word to start your SRS loop.
                </p>
              )}
            </section>

            <section className="space-y-3" aria-labelledby="archive-heading">
              <h2
                id="archive-heading"
                className="pixel-label text-sm font-bold text-city-muted"
              >
                Archive
              </h2>
              {archivedItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {archivedItems.map((item) => (
                    <LearningItemCard
                      key={item.id}
                      item={item}
                      variant="archived"
                      onStatusChange={handleRefresh}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-white/10 bg-city-navy/30 p-4 text-sm text-city-muted">
                  Archived items will appear here. Archiving pauses an item in
                  your daily SRS mission.
                </p>
              )}
            </section>
          </motion.div>
        ) : activeGroup ? (
          <motion.div
            key={activeGroup.id}
            role="tabpanel"
            id={`library-panel-${activeGroup.id}`}
            aria-labelledby={`library-tab-${activeGroup.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-8"
          >
            {activeGroup.units.map((unit) => (
              <LibraryUnitSection
                key={unit.id}
                unit={unit}
                learningItemByKey={learningItemByKey}
                onStatusChange={handleRefresh}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AddCustomWordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={handleRefresh}
      />
    </div>
  );
}
