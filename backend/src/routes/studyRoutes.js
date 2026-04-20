import { randomUUID } from "crypto";
import { Router } from "express";
import { createResponseCache } from "../cache/responseCache.js";
import { getDatabase } from "../db/mongo.js";

const router = Router();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRegex(value) {
  return new RegExp(escapeRegex(value.trim()), "i");
}

const VOCAB_KANA_GROUPS = {
  A: ["あ", "い", "う", "え", "お", "ア", "イ", "ウ", "エ", "オ"],
  K: ["か", "き", "く", "け", "こ", "カ", "キ", "ク", "ケ", "コ"],
  S: ["さ", "し", "す", "せ", "そ", "サ", "シ", "ス", "セ", "ソ"],
  T: ["た", "ち", "つ", "て", "と", "タ", "チ", "ツ", "テ", "ト"],
  N: ["な", "に", "ぬ", "ね", "の", "ナ", "ニ", "ヌ", "ネ", "ノ"],
  H: ["は", "ひ", "ふ", "へ", "ほ", "ハ", "ヒ", "フ", "ヘ", "ホ"],
  M: ["ま", "み", "む", "め", "も", "マ", "ミ", "ム", "メ", "モ"],
  Y: ["や", "ゆ", "よ", "ヤ", "ユ", "ヨ"],
  R: ["ら", "り", "る", "れ", "ろ", "ラ", "リ", "ル", "レ", "ロ"],
  W: ["わ", "を", "ん", "ワ", "ヲ", "ン"],
  G: ["が", "ぎ", "ぐ", "げ", "ご", "ガ", "ギ", "グ", "ゲ", "ゴ"],
  Z: ["ざ", "じ", "ず", "ぜ", "ぞ", "ザ", "ジ", "ズ", "ゼ", "ゾ"],
  D: ["だ", "ぢ", "づ", "で", "ど", "ダ", "ヂ", "ヅ", "デ", "ド"],
  B: ["ば", "び", "ぶ", "べ", "ぼ", "バ", "ビ", "ブ", "ベ", "ボ"],
  P: ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ", "パ", "ピ", "プ", "ペ", "ポ"],
};

router.get("/counts", createResponseCache(10 * 60 * 1000), async (_req, res, next) => {
  try {
    const database = await getDatabase();
    const [kanji, radicals, hiragana, katakana, vocabulary, grammar, readings] = await Promise.all([
      database.collection("kanjiItems").countDocuments(),
      database.collection("radicals").countDocuments(),
      database.collection("kanaItems").countDocuments({ script: "hiragana" }),
      database.collection("kanaItems").countDocuments({ script: "katakana" }),
      database.collection("vocabularyItems").countDocuments(),
      database.collection("grammarPatterns").countDocuments(),
      database.collection("readings").countDocuments(),
    ]);

    res.json({ radicals, hiragana, katakana, kanji, vocabulary, grammar, readings });
  } catch (error) {
    next(error);
  }
});

router.get("/radicals", createResponseCache(10 * 60 * 1000), async (req, res, next) => {
  try {
    const database = await getDatabase();
    const { search = "" } = req.query;
    const query = {};

    if (search.trim()) {
      const regex = buildRegex(search);
      query.$or = [
        { symbol: regex },
        { name: regex },
        { meaning: regex },
        { exampleKanji: regex },
      ];
    }

    const rows = await database.collection("radicals").find(query).sort({ sortOrder: 1, id: 1 }).toArray();
    res.json(
      rows.map((row) => ({
        id: row.id,
        symbol: row.symbol,
        name: row.name,
        meaning: row.meaning,
        example_kanji: row.exampleKanji,
        notes: row.notes,
        stroke_count: row.strokeCount,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.get("/kana", createResponseCache(10 * 60 * 1000), async (req, res, next) => {
  try {
    const database = await getDatabase();
    const { search = "", script = "hiragana" } = req.query;
    const query = { script };

    if (search.trim()) {
      const regex = buildRegex(search);
      query.$or = [
        { characterSymbol: regex },
        { romaji: regex },
        { exampleWord: regex },
        { exampleMeaning: regex },
      ];
    }

    const rows = await database
      .collection("kanaItems")
      .find(query)
      .sort({ rowOrder: 1, columnOrder: 1, id: 1 })
      .toArray();

    res.json(
      rows.map((row) => ({
        id: row.id,
        script: row.script,
        character_symbol: row.characterSymbol,
        romaji: row.romaji,
        row_group: row.rowGroup,
        row_label: row.rowLabel,
        row_order: row.rowOrder,
        column_order: row.columnOrder,
        example_word: row.exampleWord,
        example_reading: row.exampleReading,
        example_meaning: row.exampleMeaning,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.get("/vocabulary", createResponseCache(2 * 60 * 1000), async (req, res, next) => {
  try {
    const database = await getDatabase();
    const {
      search = "",
      wordType = "",
      level = "",
      kanaGroup = "",
      readingPrefix = "",
      commonOnly = "",
      kanaOnly = "",
      limit = "20",
      offset = "0",
    } = req.query;

    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 500);
    const pageOffset = Math.max(Number(offset) || 0, 0);
    const baseQuery = {};

    if (search.trim()) {
      const regex = buildRegex(search);
      baseQuery.$or = [
        { word: regex },
        { reading: regex },
        { meaning: regex },
        { wordType: regex },
        { level: regex },
      ];
    }

    if (wordType.trim()) {
      baseQuery.wordType = wordType.trim();
    }

    if (kanaGroup.trim()) {
      const kanaPrefixes = VOCAB_KANA_GROUPS[kanaGroup.trim().toUpperCase()];
      if (kanaPrefixes?.length) {
        baseQuery.$and = [...(baseQuery.$and ?? []), { $or: kanaPrefixes.map((prefix) => ({ reading: new RegExp(`^${escapeRegex(prefix)}`) })) }];
      }
    }

    if (readingPrefix.trim()) {
      baseQuery.$and = [...(baseQuery.$and ?? []), { reading: new RegExp(`^${escapeRegex(readingPrefix.trim())}`, "i") }];
    }

    if (commonOnly === "true") {
      baseQuery.isCommon = true;
    }

    if (kanaOnly === "true") {
      baseQuery.isKanaOnly = true;
    }

    const query = { ...baseQuery };
    if (level.trim() === "none") {
      query.$and = [
        ...(query.$and ?? []),
        {
          $or: [{ level: null }, { level: "" }, { level: { $exists: false } }],
        },
      ];
    } else if (level.trim()) {
      query.level = level.trim();
    }

    const trimmedSearch = search.trim();
    const escapedSearch = escapeRegex(trimmedSearch);
    const exactPattern = `^${escapedSearch}$`;
    const prefixPattern = `^${escapedSearch}`;

    const [total, levelRows, items] = await Promise.all([
      database.collection("vocabularyItems").countDocuments(query),
      database
        .collection("vocabularyItems")
        .aggregate([
          { $match: baseQuery },
          { $group: { _id: { $ifNull: ["$level", "none"] }, count: { $sum: 1 } } },
        ])
        .toArray(),
      database
        .collection("vocabularyItems")
        .aggregate(
          [
            { $match: query },
            {
              $addFields: {
                relevanceScore: trimmedSearch
                  ? {
                      $switch: {
                        branches: [
                          { case: { $regexMatch: { input: "$word", regex: exactPattern, options: "i" } }, then: 0 },
                          { case: { $regexMatch: { input: "$reading", regex: exactPattern, options: "i" } }, then: 1 },
                          { case: { $regexMatch: { input: { $ifNull: ["$primarySpelling", ""] }, regex: exactPattern, options: "i" } }, then: 2 },
                          { case: { $regexMatch: { input: { $ifNull: ["$primaryReading", ""] }, regex: exactPattern, options: "i" } }, then: 3 },
                          { case: { $regexMatch: { input: "$word", regex: prefixPattern, options: "i" } }, then: 4 },
                          { case: { $regexMatch: { input: "$reading", regex: prefixPattern, options: "i" } }, then: 5 },
                          { case: { $regexMatch: { input: { $ifNull: ["$primarySpelling", ""] }, regex: prefixPattern, options: "i" } }, then: 6 },
                          { case: { $regexMatch: { input: { $ifNull: ["$primaryReading", ""] }, regex: prefixPattern, options: "i" } }, then: 7 },
                          { case: { $regexMatch: { input: "$meaning", regex: escapedSearch, options: "i" } }, then: 8 },
                        ],
                        default: 9,
                      },
                    }
                  : 9,
                levelSort: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$level", "N5"] }, then: 1 },
                      { case: { $eq: ["$level", "N4"] }, then: 2 },
                      { case: { $eq: ["$level", "N3"] }, then: 3 },
                      { case: { $eq: ["$level", "N2"] }, then: 4 },
                      { case: { $eq: ["$level", "N1"] }, then: 5 },
                    ],
                    default: 6,
                  },
                },
                sortReading: { $ifNull: ["$reading", ""] },
                sortWord: { $ifNull: ["$word", ""] },
                sortOrderValue: { $ifNull: ["$sortOrder", 0] },
              },
            },
            {
              $sort: {
                relevanceScore: 1,
                levelSort: 1,
                isCommon: -1,
                sortReading: 1,
                sortWord: 1,
                sortOrderValue: 1,
              },
            },
            { $skip: pageOffset },
            { $limit: pageSize },
          ],
          { collation: { locale: "ja" } }
        )
        .toArray(),
    ]);

    const levelCounts = {};
    for (const row of levelRows) {
      levelCounts[row._id] = row.count;
    }

    res.json({
      items: items.map((item) => ({
        id: item.id,
        entSeq: item.entSeq,
        word: item.word,
        primarySpelling: item.primarySpelling,
        reading: item.reading,
        primaryReading: item.primaryReading,
        romaji: item.romaji ?? null,
        meaning: item.meaning,
        word_type: item.wordType,
        wordType: item.wordType,
        level: item.level ?? null,
        tags: item.tags ?? [],
        sense_count: item.senseCount ?? 1,
        senseCount: item.senseCount ?? 1,
        is_common: Boolean(item.isCommon),
        isCommon: Boolean(item.isCommon),
        is_kana_only: Boolean(item.isKanaOnly),
        isKanaOnly: Boolean(item.isKanaOnly),
        source: item.source ?? "seed",
      })),
      total,
      limit: pageSize,
      offset: pageOffset,
      levelCounts,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/grammar", createResponseCache(10 * 60 * 1000), async (req, res, next) => {
  try {
    const database = await getDatabase();
    const { search = "", level = "", chapter = "" } = req.query;
    const query = {};

    if (search.trim()) {
      const regex = buildRegex(search);
      query.$or = [
        { patternName: regex },
        { meaning: regex },
        { structureText: regex },
        { exampleJapanese: regex },
        { chapterTitle: regex },
        { level: regex },
      ];
    }

    if (level.trim()) {
      query.level = level.trim();
    }

    if (chapter.trim()) {
      query.chapter = Number(chapter.trim());
    }

    const rows = await database.collection("grammarPatterns").find(query).sort({ sortOrder: 1, id: 1 }).toArray();
    res.json(
      rows.map((row) => ({
        id: row.id,
        pattern_name: row.patternName,
        meaning: row.meaning,
        structure_text: row.structureText,
        example_japanese: row.exampleJapanese,
        example_reading: row.exampleReading,
        example_meaning: row.exampleMeaning,
        level: row.level,
        chapter: row.chapter ?? null,
        lesson: row.lesson ?? null,
        chapter_title: row.chapterTitle ?? null,
        notes: row.notes ?? null,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.get("/readings", createResponseCache(10 * 60 * 1000), async (req, res, next) => {
  try {
    const database = await getDatabase();
    const { search = "", level = "", userId = "" } = req.query;
    const query = {};

    if (search.trim()) {
      const regex = buildRegex(search);
      query.$or = [
        { title: regex },
        { titleEn: regex },
        { japaneseText: regex },
        { englishText: regex },
      ];
    }

    if (level.trim()) {
      query.level = level.trim();
    }

    const [rows, userRows] = await Promise.all([
      database.collection("readings").find(query).sort({ sortOrder: 1, id: 1 }).toArray(),
      userId.trim()
        ? database
            .collection("userReadings")
            .find({
              userId: userId.trim(),
              ...(level.trim() ? { level: level.trim() } : {}),
              ...(search.trim()
                ? {
                    $or: [
                      { title: buildRegex(search) },
                      { titleEn: buildRegex(search) },
                      { japaneseText: buildRegex(search) },
                      { englishText: buildRegex(search) },
                    ],
                  }
                : {}),
            })
            .sort({ createdAt: -1 })
            .toArray()
        : Promise.resolve([]),
    ]);

    res.json(
      [...userRows, ...rows].map((row) => ({
        id: row.id,
        user_reading_id: row.userReadingId ?? null,
        title: row.title,
        title_en: row.titleEn,
        level: row.level,
        japanese_text: row.japaneseText,
        reading_text: row.readingText,
        english_text: row.englishText,
        vocab: row.vocab ?? [],
        source: row.userReadingId ? "user" : "seed",
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.get("/user-readings", async (req, res, next) => {
  try {
    const database = await getDatabase();
    const { userId = "" } = req.query;

    if (!userId.trim()) {
      return res.status(400).json({ message: "userId is required" });
    }

    const rows = await database.collection("userReadings").find({ userId: userId.trim() }).sort({ createdAt: -1 }).toArray();
    res.json(
      rows.map((row) => ({
        user_reading_id: row.userReadingId,
        title: row.title,
        title_en: row.titleEn,
        level: row.level,
        japanese_text: row.japaneseText,
        reading_text: row.readingText,
        english_text: row.englishText,
        vocab: row.vocab ?? [],
        created_at: row.createdAt,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.post("/user-readings", async (req, res, next) => {
  try {
    const database = await getDatabase();
    const {
      userId = "",
      title = "",
      titleEn = "",
      level = "N5",
      japaneseText = "",
      readingText = "",
      englishText = "",
      vocab = [],
    } = req.body ?? {};

    if (!userId.trim() || !title.trim() || !readingText.trim()) {
      return res.status(400).json({ message: "userId, title, and readingText are required" });
    }

    const document = {
      userReadingId: randomUUID(),
      userId: userId.trim(),
      title: title.trim(),
      titleEn: titleEn.trim(),
      level: level.trim() || "N5",
      japaneseText: japaneseText.trim(),
      readingText: readingText.trim(),
      englishText: englishText.trim(),
      vocab: Array.isArray(vocab)
        ? vocab
            .map((entry) => ({
              word: String(entry.word ?? "").trim(),
              reading: String(entry.reading ?? "").trim(),
              meaning: String(entry.meaning ?? "").trim(),
            }))
            .filter((entry) => entry.word || entry.reading || entry.meaning)
        : [],
      createdAt: new Date(),
    };

    await database.collection("userReadings").insertOne(document);

    res.status(201).json({
      user_reading_id: document.userReadingId,
      title: document.title,
      title_en: document.titleEn,
      level: document.level,
      japanese_text: document.japaneseText,
      reading_text: document.readingText,
      english_text: document.englishText,
      vocab: document.vocab,
      created_at: document.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/user-reading-sentences", async (req, res, next) => {
  try {
    const database = await getDatabase();
    const { userId = "", readingId = "", linkedVocab = "" } = req.query;

    if (!userId.trim()) {
      return res.status(400).json({ message: "userId is required" });
    }

    const query = { userId: userId.trim() };
    if (readingId !== "") {
      query.readingId = Number(readingId);
    }
    if (linkedVocab.trim()) {
      query.linkedVocabWords = linkedVocab.trim();
    }

    const rows = await database
      .collection("userReadingSentences")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(
      rows.map((row) => ({
        user_sentence_id: row.userSentenceId,
        reading_id: row.readingId,
        sentence_text: row.sentenceText,
        translation_text: row.translationText ?? "",
        linked_vocab_words: row.linkedVocabWords ?? [],
        linked_vocab_readings: row.linkedVocabReadings ?? [],
        created_at: row.createdAt,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.post("/user-reading-sentences", async (req, res, next) => {
  try {
    const database = await getDatabase();
    const {
      userId = "",
      readingId,
      sentenceText = "",
      translationText = "",
      linkedVocabWords = [],
      linkedVocabReadings = [],
    } = req.body ?? {};

    if (!userId.trim() || !Number.isFinite(Number(readingId)) || !sentenceText.trim()) {
      return res.status(400).json({ message: "userId, readingId, and sentenceText are required" });
    }

    const document = {
      userSentenceId: randomUUID(),
      userId: userId.trim(),
      readingId: Number(readingId),
      sentenceText: sentenceText.trim(),
      translationText: translationText.trim(),
      linkedVocabWords: Array.isArray(linkedVocabWords)
        ? linkedVocabWords.map((value) => String(value).trim()).filter(Boolean)
        : [],
      linkedVocabReadings: Array.isArray(linkedVocabReadings)
        ? linkedVocabReadings.map((value) => String(value).trim()).filter(Boolean)
        : [],
      createdAt: new Date(),
    };

    await database.collection("userReadingSentences").insertOne(document);

    res.status(201).json({
      user_sentence_id: document.userSentenceId,
      reading_id: document.readingId,
      sentence_text: document.sentenceText,
      translation_text: document.translationText,
      linked_vocab_words: document.linkedVocabWords,
      linked_vocab_readings: document.linkedVocabReadings,
      created_at: document.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
