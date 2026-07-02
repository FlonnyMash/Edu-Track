import { LibraryItemTile } from "@/components/library/LibraryItemTile";
import { buildSrsItemKey } from "@/lib/srs/keys";
import type { LibraryUnitGroup } from "@/lib/library/catalog";
import type { UserLearningItem } from "@/types/database";
import { cn } from "@/lib/utils";

interface LibraryUnitSectionProps {
  unit: LibraryUnitGroup;
  learningItemByKey: Map<string, UserLearningItem>;
  onStatusChange?: () => void;
}

export function LibraryUnitSection({
  unit,
  learningItemByKey,
  onStatusChange,
}: LibraryUnitSectionProps) {
  const isVocabulary = unit.type === "vocabulary";

  return (
    <section className="space-y-3" aria-labelledby={`library-unit-${unit.id}`}>
      <div className="space-y-1">
        <h2
          id={`library-unit-${unit.id}`}
          className="pixel-label text-sm font-bold text-city-teal"
        >
          {unit.title}
        </h2>
        {unit.textbookReference ? (
          <p className="text-xs text-city-muted">{unit.textbookReference}</p>
        ) : null}
      </div>

      <div
        className={cn(
          "grid gap-2 sm:gap-3",
          isVocabulary
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-3 sm:grid-cols-4"
        )}
      >
        {unit.items.map((item) => {
          const itemKey = buildSrsItemKey(unit.id, item.character);

          return (
            <LibraryItemTile
              key={`${unit.id}-${item.character}`}
              character={item.character}
              pronunciation={item.pronunciation}
              variant={isVocabulary ? "vocabulary" : "kana"}
              unitId={unit.id}
              category={unit.title}
              learningItem={learningItemByKey.get(itemKey)}
              onStatusChange={onStatusChange}
            />
          );
        })}
      </div>
    </section>
  );
}
