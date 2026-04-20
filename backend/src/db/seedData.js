import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const CATEGORY_COLORS = [
  "#ec4899",
  "#8b5cf6",
  "#3b82f6",
  "#22c55e",
  "#14b8a6",
  "#f97316",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#eab308",
  "#a855f7",
  "#10b981",
  "#f43f5e",
  "#6366f1",
  "#0ea5e9",
];

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), "..", "..", "..");
const require = createRequire(import.meta.url);

function evaluateSnippet(source, replacements = []) {
  let snippet = source;
  for (const [from, to] of replacements) {
    snippet = snippet.replace(from, to);
  }

  const context = {};
  vm.createContext(context);
  vm.runInContext(snippet, context);
  return context;
}

function extractKanjiSourceData() {
  const sourcePath = path.join(repoRoot, "jlpt-kanji-study.jsx");
  const sourceText = fs.readFileSync(sourcePath, "utf8");
  const start = sourceText.indexOf("const KANJI_DATA =");
  const end = sourceText.indexOf("const VOCAB_DATA =");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Unable to locate KANJI_DATA in jlpt-kanji-study.jsx");
  }

  const { KANJI_DATA } = evaluateSnippet(sourceText.slice(start, end), [["const KANJI_DATA =", "KANJI_DATA ="]]);
  return KANJI_DATA;
}

function extractStudySourceData() {
  return require(path.join(repoRoot, "scripts", "generate-study-content.js"));
}

function buildCategories(kanjiData) {
  return Object.keys(kanjiData).map((label, index) => {
    const [englishName, japaneseTag] = label.split(" ");
    return {
      id: index + 1,
      name: label,
      description: `${englishName} kanji category${japaneseTag ? ` (${japaneseTag})` : ""} from the original JLPT study source`,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      sortOrder: index + 1,
    };
  });
}

function buildKanjiItems(kanjiData, categories) {
  const categoryIdByName = new Map(categories.map((category) => [category.name, category.id]));
  const items = [];
  let id = 1;

  for (const [categoryName, categoryItems] of Object.entries(kanjiData)) {
    const categoryId = categoryIdByName.get(categoryName);

    for (const item of categoryItems) {
      items.push({
        id,
        categoryId,
        kanjiChar: item.kanji,
        meaning: item.meaning,
        onyomi: item.onyomi,
        kunyomi: item.kunyomi,
        level: item.level,
        strokeCount: item.strokes,
        exampleWord: item.example,
        exampleReading: item.exReading,
        exampleMeaning: item.exMeaning,
      });
      id += 1;
    }
  }

  return items;
}

function buildRadicals(radicals) {
  return radicals.map(([symbol, name, meaning, exampleKanji, notes, strokeCount], index) => ({
    id: index + 1,
    symbol,
    name,
    meaning,
    exampleKanji,
    notes,
    strokeCount,
    sortOrder: index + 1,
  }));
}

function buildKanaItems(kanaRows) {
  const items = [];
  let id = 1;

  for (const script of ["hiragana", "katakana"]) {
    kanaRows.forEach(([rowLabel, rowItems], rowIndex) => {
      rowItems.forEach(([romaji, hiraganaChar, katakanaChar], columnIndex) => {
        const character = script === "hiragana" ? hiraganaChar : katakanaChar;
        items.push({
          id,
          script,
          characterSymbol: character,
          romaji,
          rowGroup: rowLabel.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, ""),
          rowLabel,
          rowOrder: rowIndex + 1,
          columnOrder: columnIndex + 1,
          exampleWord: character,
          exampleReading: romaji,
          exampleMeaning: `${romaji} sound`,
          sortOrder: rowIndex * 10 + columnIndex + 1,
        });
        id += 1;
      });
    });
  }

  return items;
}

function buildVocabularyItems(vocabulary) {
  return vocabulary.map(([id, word, reading, romaji, meaning, wordType, level, sortOrder]) => ({
    id,
    entSeq: id,
    word,
    primarySpelling: word,
    reading,
    primaryReading: reading,
    romaji: romaji ?? null,
    meaning,
    wordType,
    level,
    tags: [],
    senseCount: 1,
    isCommon: false,
    isKanaOnly: word === reading,
    source: "seed",
    sortOrder,
  }));
}

function buildGrammarPatterns(grammar) {
  return grammar.map(([id, patternName, meaning, structureText, exampleJapanese, exampleReading, exampleMeaning, level, sortOrder, chapter, lesson, chapterTitle, notes]) => ({
    id,
    patternName,
    meaning,
    structureText,
    exampleJapanese,
    exampleReading,
    exampleMeaning,
    level,
    sortOrder,
    chapter: chapter ?? null,
    lesson: lesson ?? null,
    chapterTitle: chapterTitle ?? null,
    notes: notes ?? null,
  }));
}

function buildReadings(readings) {
  return readings.map((r) => ({
    id: r.id,
    title: r.title,
    titleEn: r.titleEn,
    level: r.level,
    japaneseText: r.japaneseText,
    readingText: r.readingText,
    englishText: r.englishText,
    vocab: r.vocab ?? [],
    sortOrder: r.sortOrder,
  }));
}

export function buildSeedData() {
  const kanjiData = extractKanjiSourceData();
  const studySourceData = extractStudySourceData();
  const categories = buildCategories(kanjiData);

  return {
    categories,
    kanjiItems: buildKanjiItems(kanjiData, categories),
    radicals: buildRadicals(studySourceData.radicals),
    kanaItems: buildKanaItems(studySourceData.kanaRows),
    vocabularyItems: buildVocabularyItems(studySourceData.vocabulary),
    grammarPatterns: buildGrammarPatterns(studySourceData.grammar),
    readings: buildReadings(studySourceData.readings ?? []),
  };
}
