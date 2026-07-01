import type { ProgressContext } from "@/lib/ai/prompts";
import {
  extractMainQuestContent,
  parsePronunciationLine,
} from "@/lib/tasks/parser";

export type SyllabusItemType = "character" | "concept" | "vocabulary";

export interface SyllabusUnit {
  id: string;
  title: string;
  items: string[];
  /** Romanization for character rows (parallel to items). */
  pronunciations?: string[];
  /** Genki (or other) textbook location for Theory/Application anchoring. */
  textbookReference?: string;
  type: SyllabusItemType;
}

export interface SyllabusProgress {
  nextTopic: SyllabusUnit;
  reviewItems: string[];
  completedUnitIds: string[];
  isFreshStart: boolean;
  isCurriculumComplete: boolean;
}

const GENKI_HIRAGANA_TEXTBOOK_REF =
  "Genki I, Kana Chart (Reading and Writing section)";
const GENKI_KATAKANA_TEXTBOOK_REF =
  "Genki I, Kana Chart (Reading and Writing section)";
const GENKI_LESSON1_GREETINGS_REF =
  "Genki I, Lesson 1: Greetings (Pages 32-33)";

function withTextbookReference(
  units: SyllabusUnit[],
  textbookReference: string
): SyllabusUnit[] {
  return units.map((unit) => ({ ...unit, textbookReference }));
}

const hiraganaUnitsBase: SyllabusUnit[] = [
  {
    id: "hiragana_a",
    title: "Hiragana A-row",
    items: ["あ", "い", "う", "え", "お"],
    pronunciations: ["a", "i", "u", "e", "o"],
    type: "character",
  },
  {
    id: "hiragana_k",
    title: "Hiragana K-row",
    items: ["か", "き", "く", "け", "こ"],
    pronunciations: ["ka", "ki", "ku", "ke", "ko"],
    type: "character",
  },
  {
    id: "hiragana_s",
    title: "Hiragana S-row",
    items: ["さ", "し", "す", "せ", "そ"],
    pronunciations: ["sa", "shi", "su", "se", "so"],
    type: "character",
  },
  {
    id: "hiragana_t",
    title: "Hiragana T-row",
    items: ["た", "ち", "つ", "て", "と"],
    pronunciations: ["ta", "chi", "tsu", "te", "to"],
    type: "character",
  },
  {
    id: "hiragana_n",
    title: "Hiragana N-row",
    items: ["な", "に", "ぬ", "ね", "の"],
    pronunciations: ["na", "ni", "nu", "ne", "no"],
    type: "character",
  },
  {
    id: "hiragana_h",
    title: "Hiragana H-row",
    items: ["は", "ひ", "ふ", "へ", "ほ"],
    pronunciations: ["ha", "hi", "fu", "he", "ho"],
    type: "character",
  },
  {
    id: "hiragana_m",
    title: "Hiragana M-row",
    items: ["ま", "み", "む", "め", "も"],
    pronunciations: ["ma", "mi", "mu", "me", "mo"],
    type: "character",
  },
  {
    id: "hiragana_y",
    title: "Hiragana Y-row",
    items: ["や", "ゆ", "よ"],
    pronunciations: ["ya", "yu", "yo"],
    type: "character",
  },
  {
    id: "hiragana_r",
    title: "Hiragana R-row",
    items: ["ら", "り", "る", "れ", "ろ"],
    pronunciations: ["ra", "ri", "ru", "re", "ro"],
    type: "character",
  },
  {
    id: "hiragana_w",
    title: "Hiragana W-row and ん",
    items: ["わ", "を", "ん"],
    pronunciations: ["wa", "wo", "n"],
    type: "character",
  },
  {
    id: "hiragana_dakuten_1",
    title: "Hiragana Dakuten (G and Z rows)",
    items: ["が", "ぎ", "ぐ", "げ", "ご", "ざ", "じ", "ず", "ぜ", "ぞ"],
    pronunciations: ["ga", "gi", "gu", "ge", "go", "za", "ji", "zu", "ze", "zo"],
    type: "character",
  },
  {
    id: "hiragana_dakuten_2",
    title: "Hiragana Dakuten (D and B rows)",
    items: ["だ", "ぢ", "づ", "で", "ど", "ば", "び", "ぶ", "べ", "ぼ"],
    pronunciations: ["da", "ji", "zu", "de", "do", "ba", "bi", "bu", "be", "bo"],
    type: "character",
  },
  {
    id: "hiragana_handakuten",
    title: "Hiragana Handakuten (P row)",
    items: ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"],
    pronunciations: ["pa", "pi", "pu", "pe", "po"],
    type: "character",
  },
  {
    id: "hiragana_yoon_1",
    title: "Hiragana Yōon (K, S, T, N, H)",
    items: [
      "きゃ", "きゅ", "きょ",
      "しゃ", "しゅ", "しょ",
      "ちゃ", "ちゅ", "ちょ",
      "にゃ", "にゅ", "にょ",
      "ひゃ", "ひゅ", "ひょ",
    ],
    pronunciations: [
      "kya", "kyu", "kyo",
      "sha", "shu", "sho",
      "cha", "chu", "cho",
      "nya", "nyu", "nyo",
      "hya", "hyu", "hyo",
    ],
    type: "character",
  },
  {
    id: "hiragana_yoon_2",
    title: "Hiragana Yōon (M, R, G, J, B, P)",
    items: [
      "みゃ", "みゅ", "みょ",
      "りゃ", "りゅ", "りょ",
      "ぎゃ", "ぎゅ", "ぎょ",
      "じゃ", "じゅ", "じょ",
      "びゃ", "びゅ", "びょ",
      "ぴゃ", "ぴゅ", "ぴょ",
    ],
    pronunciations: [
      "mya", "myu", "myo",
      "rya", "ryu", "ryo",
      "gya", "gyu", "gyo",
      "ja", "ju", "jo",
      "bya", "byu", "byo",
      "pya", "pyu", "pyo",
    ],
    type: "character",
  },
];

export const japaneseHiraganaSyllabus = withTextbookReference(
  hiraganaUnitsBase,
  GENKI_HIRAGANA_TEXTBOOK_REF
);

const katakanaUnitsBase: SyllabusUnit[] = [
  {
    id: "katakana_a",
    title: "Katakana A-row",
    items: ["ア", "イ", "ウ", "エ", "オ"],
    pronunciations: ["a", "i", "u", "e", "o"],
    type: "character",
  },
  {
    id: "katakana_k",
    title: "Katakana K-row",
    items: ["カ", "キ", "ク", "ケ", "コ"],
    pronunciations: ["ka", "ki", "ku", "ke", "ko"],
    type: "character",
  },
  {
    id: "katakana_s",
    title: "Katakana S-row",
    items: ["サ", "シ", "ス", "セ", "ソ"],
    pronunciations: ["sa", "shi", "su", "se", "so"],
    type: "character",
  },
  {
    id: "katakana_t",
    title: "Katakana T-row",
    items: ["タ", "チ", "ツ", "テ", "ト"],
    pronunciations: ["ta", "chi", "tsu", "te", "to"],
    type: "character",
  },
  {
    id: "katakana_n",
    title: "Katakana N-row",
    items: ["ナ", "ニ", "ヌ", "ネ", "ノ"],
    pronunciations: ["na", "ni", "nu", "ne", "no"],
    type: "character",
  },
  {
    id: "katakana_h",
    title: "Katakana H-row",
    items: ["ハ", "ヒ", "フ", "ヘ", "ホ"],
    pronunciations: ["ha", "hi", "fu", "he", "ho"],
    type: "character",
  },
  {
    id: "katakana_m",
    title: "Katakana M-row",
    items: ["マ", "ミ", "ム", "メ", "モ"],
    pronunciations: ["ma", "mi", "mu", "me", "mo"],
    type: "character",
  },
  {
    id: "katakana_y",
    title: "Katakana Y-row",
    items: ["ヤ", "ユ", "ヨ"],
    pronunciations: ["ya", "yu", "yo"],
    type: "character",
  },
  {
    id: "katakana_r",
    title: "Katakana R-row",
    items: ["ラ", "リ", "ル", "レ", "ロ"],
    pronunciations: ["ra", "ri", "ru", "re", "ro"],
    type: "character",
  },
  {
    id: "katakana_w",
    title: "Katakana W-row and ン",
    items: ["ワ", "ヲ", "ン"],
    pronunciations: ["wa", "wo", "n"],
    type: "character",
  },
  {
    id: "katakana_dakuten_1",
    title: "Katakana Dakuten (G and Z rows)",
    items: ["ガ", "ギ", "グ", "ゲ", "ゴ", "ザ", "ジ", "ズ", "ゼ", "ゾ"],
    pronunciations: ["ga", "gi", "gu", "ge", "go", "za", "ji", "zu", "ze", "zo"],
    type: "character",
  },
  {
    id: "katakana_dakuten_2",
    title: "Katakana Dakuten (D and B rows)",
    items: ["ダ", "ヂ", "ヅ", "デ", "ド", "バ", "ビ", "ブ", "ベ", "ボ"],
    pronunciations: ["da", "ji", "zu", "de", "do", "ba", "bi", "bu", "be", "bo"],
    type: "character",
  },
  {
    id: "katakana_handakuten",
    title: "Katakana Handakuten (P row)",
    items: ["パ", "ピ", "プ", "ペ", "ポ"],
    pronunciations: ["pa", "pi", "pu", "pe", "po"],
    type: "character",
  },
  {
    id: "katakana_yoon_1",
    title: "Katakana Yōon (K, S, T, N, H)",
    items: [
      "キャ", "キュ", "キョ",
      "シャ", "シュ", "ショ",
      "チャ", "チュ", "チョ",
      "ニャ", "ニュ", "ニョ",
      "ヒャ", "ヒュ", "ヒョ",
    ],
    pronunciations: [
      "kya", "kyu", "kyo",
      "sha", "shu", "sho",
      "cha", "chu", "cho",
      "nya", "nyu", "nyo",
      "hya", "hyu", "hyo",
    ],
    type: "character",
  },
  {
    id: "katakana_yoon_2",
    title: "Katakana Yōon (M, R, G, J, B, P)",
    items: [
      "ミャ", "ミュ", "ミョ",
      "リャ", "リュ", "リョ",
      "ギャ", "ギュ", "ギョ",
      "ジャ", "ジュ", "ジョ",
      "ビャ", "ビュ", "ビョ",
      "ピャ", "ピュ", "ピョ",
    ],
    pronunciations: [
      "mya", "myu", "myo",
      "rya", "ryu", "ryo",
      "gya", "gyu", "gyo",
      "ja", "ju", "jo",
      "bya", "byu", "byo",
      "pya", "pyu", "pyo",
    ],
    type: "character",
  },
];

export const japaneseKatakanaSyllabus = withTextbookReference(
  katakanaUnitsBase,
  GENKI_KATAKANA_TEXTBOOK_REF
);

export const genkiLesson1Placeholder: SyllabusUnit = {
  id: "genki_1_greetings",
  title: "Genki I: Basic Greetings",
  items: ["おはよう", "こんにちは", "こんばんは", "さようなら", "ありがとう"],
  pronunciations: ["ohayou", "konnichiwa", "konbanwa", "sayounara", "arigatou"],
  textbookReference: GENKI_LESSON1_GREETINGS_REF,
  type: "vocabulary",
};

export const JAPANESE_KANA_SYLLABUS: SyllabusUnit[] = [
  ...japaneseHiraganaSyllabus,
  ...japaneseKatakanaSyllabus,
];

export const JAPANESE_SYLLABUS_CHAIN: SyllabusUnit[] = [
  ...JAPANESE_KANA_SYLLABUS,
  genkiLesson1Placeholder,
];

/** Fuzzy labels that indicate a row was covered, keyed by unit id. */
const ROW_ALIASES: Record<string, string[]> = {
  hiragana_a: ["a-row", "a row", "hiragana a"],
  hiragana_k: ["k-row", "k row", "hiragana k"],
  hiragana_s: ["s-row", "s row", "hiragana s"],
  hiragana_t: ["t-row", "t row", "hiragana t"],
  hiragana_n: ["n-row", "n row", "hiragana n"],
  hiragana_h: ["h-row", "h row", "hiragana h"],
  hiragana_m: ["m-row", "m row", "hiragana m"],
  hiragana_y: ["y-row", "y row", "hiragana y"],
  hiragana_r: ["r-row", "r row", "hiragana r"],
  hiragana_w: ["w-row", "w row", "hiragana w"],
  katakana_a: ["a-row", "a row", "katakana a"],
  katakana_k: ["k-row", "k row", "katakana k"],
  katakana_s: ["s-row", "s row", "katakana s"],
  katakana_t: ["t-row", "t row", "katakana t"],
  katakana_n: ["n-row", "n row", "katakana n"],
  katakana_h: ["h-row", "h row", "katakana h"],
  katakana_m: ["m-row", "m row", "katakana m"],
  katakana_y: ["y-row", "y row", "katakana y"],
  katakana_r: ["r-row", "r row", "katakana r"],
  katakana_w: ["w-row", "w row", "katakana w"],
  genki_1_greetings: ["genki lesson 1", "basic greetings", "greetings"],
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

/** Builds a searchable corpus from progress state and completed task copy. */
export function buildLearnedCorpus(progressContext: ProgressContext): string[] {
  const corpus = new Set<string>();

  for (const term of progressContext.previouslyLearnedTerms) {
    const normalized = normalizeToken(term);
    if (normalized) corpus.add(normalized);
  }

  for (const topic of progressContext.masteredTopics) {
    const normalized = normalizeToken(topic);
    if (normalized) corpus.add(normalized);
  }

  for (const entry of progressContext.history) {
    const title = normalizeToken(entry.title);
    if (title) corpus.add(title);

    const mainQuestText = extractMainQuestContent(entry.instructions);
    for (const line of mainQuestText.split("\n")) {
      const pronunciation = parsePronunciationLine(line);
      if (pronunciation) {
        corpus.add(pronunciation.character.trim());
        corpus.add(normalizeToken(pronunciation.pronunciation));
      }
    }
  }

  return [...corpus].filter(Boolean);
}

function corpusMatches(corpus: string[], needle: string): boolean {
  const normalizedNeedle = normalizeToken(needle);
  if (!normalizedNeedle) return false;
  return corpus.some((entry) => entry.includes(normalizedNeedle));
}

function isUnitComplete(unit: SyllabusUnit, corpus: string[]): boolean {
  if (corpusMatches(corpus, unit.id)) return true;
  if (corpusMatches(corpus, unit.title)) return true;

  const aliases = ROW_ALIASES[unit.id] ?? [];
  if (aliases.some((alias) => corpus.some((entry) => entry.includes(alias)))) {
    return true;
  }

  return unit.items.every((item) => corpus.some((entry) => entry.includes(item)));
}

function isGenkiGreetingsMastered(masteredTopics: string[]): boolean {
  const unit = genkiLesson1Placeholder;
  const normalizedTopics = masteredTopics.map(normalizeToken).filter(Boolean);

  if (normalizedTopics.some((t) => t.includes(normalizeToken(unit.id)))) {
    return true;
  }
  if (normalizedTopics.some((t) => t.includes(normalizeToken(unit.title)))) {
    return true;
  }

  const aliases = ROW_ALIASES[unit.id] ?? [];
  if (
    aliases.some((alias) =>
      normalizedTopics.some((t) => t.includes(alias))
    )
  ) {
    return true;
  }

  return false;
}

function isUnitMasteredById(
  unit: SyllabusUnit,
  masteredTopics: string[]
): boolean {
  return masteredTopics.includes(unit.id);
}

/** Ignores stale DB progress when the user has zero completed sessions. */
export function sanitizeProgressForSyllabus(
  progressContext: ProgressContext
): ProgressContext {
  const sessionsCount = progressContext.recentPerformance.completedTaskCount;
  if (sessionsCount === 0) {
    return {
      ...progressContext,
      masteredTopics: [],
      previouslyLearnedTerms: [],
      history: [],
    };
  }
  return progressContext;
}

export function selectSyllabusForChapter(chapter: string): SyllabusUnit[] {
  return chapter.toLowerCase().includes("katakana")
    ? japaneseKatakanaSyllabus
    : japaneseHiraganaSyllabus;
}

export function resolveNextSyllabusTopic(
  masteredTopics: string[]
): SyllabusUnit {
  const nextTopic = JAPANESE_KANA_SYLLABUS.find(
    (unit) => !masteredTopics.includes(unit.id)
  );

  return nextTopic ?? genkiLesson1Placeholder;
}

const SIDE_QUEST_REVIEW_SIZE = 5;
const RECENT_UNIT_COUNT = 2;
const RECENT_SLOT_RATIO = 0.6;

type ReviewEntry = { item: string; unit: SyllabusUnit };

function formatReviewItem(item: string, unit: SyllabusUnit): string {
  const index = unit.items.indexOf(item);
  const pronunciation = index >= 0 ? unit.pronunciations?.[index] ?? "" : "";
  return pronunciation ? `${item} | ${pronunciation}` : item;
}

function itemsForUnits(units: SyllabusUnit[]): ReviewEntry[] {
  const entries: ReviewEntry[] = [];
  for (const unit of units) {
    for (const item of unit.items) {
      entries.push({ item, unit });
    }
  }
  return entries;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sampleEntries(
  entries: ReviewEntry[],
  count: number,
  exclude: Set<string>
): ReviewEntry[] {
  const available = entries.filter((entry) => !exclude.has(entry.item));
  return shuffle(available).slice(0, Math.min(count, available.length));
}

/**
 * Splits completed syllabus units into recent (last 1–2) and older pools
 * based on chain order — lightweight spaced repetition without DB changes.
 */
export function collectReviewPool(
  chain: SyllabusUnit[],
  excludeUnitId?: string | null,
  masteredTopics: string[] = []
): { recent: ReviewEntry[]; older: ReviewEntry[] } {
  if (masteredTopics.length === 0) {
    return { recent: [], older: [] };
  }

  const completedUnits = chain.filter((unit) => {
    if (excludeUnitId && unit.id === excludeUnitId) return false;
    return isUnitMasteredById(unit, masteredTopics);
  });

  if (completedUnits.length === 0) {
    return { recent: [], older: [] };
  }

  const recentUnits = completedUnits.slice(-RECENT_UNIT_COUNT);
  const olderUnits = completedUnits.slice(
    0,
    Math.max(0, completedUnits.length - RECENT_UNIT_COUNT)
  );

  return {
    recent: itemsForUnits(recentUnits),
    older: itemsForUnits(olderUnits),
  };
}

/**
 * Selects SIDE QUEST review items with ~60% from recent units and ~40% from older.
 * Returns formatted `character | pronunciation` strings.
 */
export function selectSpacedReviewItems(
  recent: ReviewEntry[],
  older: ReviewEntry[],
  totalSize = SIDE_QUEST_REVIEW_SIZE
): string[] {
  if (recent.length === 0 && older.length === 0) return [];

  const recentSlots = Math.ceil(totalSize * RECENT_SLOT_RATIO);
  const olderSlots = totalSize - recentSlots;
  const selectedItems = new Set<string>();
  const result: string[] = [];

  const addEntries = (entries: ReviewEntry[]) => {
    for (const entry of entries) {
      if (selectedItems.has(entry.item)) continue;
      selectedItems.add(entry.item);
      result.push(formatReviewItem(entry.item, entry.unit));
    }
  };

  addEntries(sampleEntries(recent, recentSlots, selectedItems));

  if (older.length === 0) {
    addEntries(sampleEntries(recent, totalSize - result.length, selectedItems));
  } else {
    addEntries(sampleEntries(older, olderSlots, selectedItems));

    if (result.length < totalSize) {
      addEntries(sampleEntries(recent, totalSize - result.length, selectedItems));
    }
    if (result.length < totalSize) {
      addEntries(sampleEntries(older, totalSize - result.length, selectedItems));
    }
  }

  return result.slice(0, totalSize);
}

/** Deterministically resolves today's new topic and spaced-repetition items. */
export function resolveSyllabusProgress(
  progressContext: ProgressContext
): SyllabusProgress {
  const rawMasteredCount = progressContext.masteredTopics.length;
  const sessionsCount = progressContext.recentPerformance.completedTaskCount;
  const effectiveContext = sanitizeProgressForSyllabus(progressContext);
  const { masteredTopics } = effectiveContext;

  if (sessionsCount === 0 && rawMasteredCount > 0) {
    console.log(
      "[Syllabus] First-day guard active: ignoring stale DB masteredTopics for this generation run",
      { rawMasteredCount, sessionsCount }
    );
  }

  const chain = JAPANESE_SYLLABUS_CHAIN;
  const nextTopic = resolveNextSyllabusTopic(masteredTopics);
  const completedUnitIds = chain
    .filter((unit) => isUnitMasteredById(unit, masteredTopics))
    .map((unit) => unit.id);

  const allKanaComplete = JAPANESE_KANA_SYLLABUS.every((unit) =>
    masteredTopics.includes(unit.id)
  );
  const isCurriculumComplete =
    allKanaComplete && isGenkiGreetingsMastered(masteredTopics);

  const excludeUnitId = isCurriculumComplete ? null : nextTopic.id;

  let reviewItems: string[];
  if (masteredTopics.length === 0) {
    reviewItems = [];
  } else {
    const { recent, older } = collectReviewPool(
      chain,
      excludeUnitId,
      masteredTopics
    );
    reviewItems = selectSpacedReviewItems(recent, older);
  }

  const isFreshStart =
    effectiveContext.previouslyLearnedTerms.length === 0 &&
    sessionsCount === 0 &&
    reviewItems.length === 0;

  console.log("[Syllabus] Sessions count:", sessionsCount);
  console.log("[Syllabus] Mastered Topics count (raw DB):", rawMasteredCount);
  console.log(
    "[Syllabus] Mastered Topics count (effective):",
    masteredTopics.length
  );
  console.log("[Syllabus] Next Topic resolved:", nextTopic.id);
  console.log("[Syllabus] Review Items generated:", reviewItems.length);
  if (reviewItems.length > 0) {
    console.log("[Syllabus] Review Items sample:", reviewItems.slice(0, 3));
  }

  return {
    nextTopic,
    reviewItems,
    completedUnitIds,
    isFreshStart,
    isCurriculumComplete,
  };
}

/** Produces `あ | a` lines for prompt injection of the day's new characters. */
export function formatUnitCharacterList(unit: SyllabusUnit): string {
  return unit.items
    .map((character, index) => {
      const pronunciation = unit.pronunciations?.[index] ?? "";
      return pronunciation ? `${character} | ${pronunciation}` : character;
    })
    .join("\n");
}
