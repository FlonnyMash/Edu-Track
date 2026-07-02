import type { SyllabusProgress } from "@/lib/ai/syllabus";
import type { SrsReviewItemMeta } from "@/lib/srs/types";
import { parseDailyTask } from "@/lib/tasks/parser";

export type SideQuestType =
  | "srs_review"
  | "syllabus_review"
  | "preparation";

export interface QuestStructureMeta {
  main: {
    title: string;
    goal: string;
    section_titles: string[];
  };
  side: {
    title: string;
    type: SideQuestType;
    section_titles: string[];
    srs_item_count: number;
  };
}

export function buildQuestStructureMetadata(
  instructions: string,
  syllabusProgress: SyllabusProgress,
  srsReviewItems: SrsReviewItemMeta[]
): QuestStructureMeta {
  const parsed = parseDailyTask(instructions);

  const sideType: SideQuestType =
    srsReviewItems.length > 0
      ? "srs_review"
      : syllabusProgress.reviewItems.length > 0
        ? "syllabus_review"
        : "preparation";

  const mainGoal = syllabusProgress.isCurriculumComplete
    ? "Consolidate mastered syllabus content"
    : `Learn ${syllabusProgress.nextTopic.title}`;

  const defaultSideTitle =
    sideType === "preparation"
      ? "Study Prep"
      : sideType === "srs_review"
        ? "SRS Review Drill"
        : "Review Session";

  return {
    main: {
      title: parsed.mainQuest.title || syllabusProgress.nextTopic.title,
      goal: mainGoal,
      section_titles: parsed.mainQuest.sections.map((section) => section.title),
    },
    side: {
      title: parsed.sideQuest.title || defaultSideTitle,
      type: sideType,
      section_titles: parsed.sideQuest.sections.map((section) => section.title),
      srs_item_count: srsReviewItems.length,
    },
  };
}

export function parseQuestStructureFromMetadata(
  metadata: unknown
): QuestStructureMeta | null {
  if (!metadata || typeof metadata !== "object") return null;

  const questStructure = (metadata as Record<string, unknown>).quest_structure;
  if (!questStructure || typeof questStructure !== "object") return null;

  const record = questStructure as Record<string, unknown>;
  const main = record.main;
  const side = record.side;

  if (!main || typeof main !== "object" || !side || typeof side !== "object") {
    return null;
  }

  const mainRecord = main as Record<string, unknown>;
  const sideRecord = side as Record<string, unknown>;

  if (
    typeof mainRecord.title !== "string" ||
    typeof mainRecord.goal !== "string" ||
    typeof sideRecord.title !== "string" ||
    typeof sideRecord.type !== "string"
  ) {
    return null;
  }

  return {
    main: {
      title: mainRecord.title,
      goal: mainRecord.goal,
      section_titles: Array.isArray(mainRecord.section_titles)
        ? mainRecord.section_titles.filter(
            (title): title is string => typeof title === "string"
          )
        : [],
    },
    side: {
      title: sideRecord.title,
      type: sideRecord.type as SideQuestType,
      section_titles: Array.isArray(sideRecord.section_titles)
        ? sideRecord.section_titles.filter(
            (title): title is string => typeof title === "string"
          )
        : [],
      srs_item_count:
        typeof sideRecord.srs_item_count === "number"
          ? sideRecord.srs_item_count
          : 0,
    },
  };
}
