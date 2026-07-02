import {
  genkiLesson1Placeholder,
  japaneseHiraganaSyllabus,
  japaneseKatakanaSyllabus,
  type SyllabusUnit,
} from "@/lib/ai/syllabus";

export type LibraryScript = "hiragana" | "katakana" | "vocabulary";

export type LibraryItem = {
  character: string;
  pronunciation: string;
};

export type LibraryUnitGroup = {
  id: string;
  title: string;
  type: SyllabusUnit["type"];
  textbookReference?: string;
  items: LibraryItem[];
};

export type LibraryScriptGroup = {
  id: LibraryScript;
  label: string;
  units: LibraryUnitGroup[];
};

function mapUnitToGroup(unit: SyllabusUnit): LibraryUnitGroup {
  return {
    id: unit.id,
    title: unit.title,
    type: unit.type,
    textbookReference: unit.textbookReference,
    items: unit.items.map((character, index) => ({
      character,
      pronunciation: unit.pronunciations?.[index] ?? "",
    })),
  };
}

export const LIBRARY_SCRIPTS: LibraryScriptGroup[] = [
  {
    id: "hiragana",
    label: "Hiragana",
    units: japaneseHiraganaSyllabus.map(mapUnitToGroup),
  },
  {
    id: "katakana",
    label: "Katakana",
    units: japaneseKatakanaSyllabus.map(mapUnitToGroup),
  },
  {
    id: "vocabulary",
    label: "Vocabulary",
    units: [mapUnitToGroup(genkiLesson1Placeholder)],
  },
];
