const KANA_SECTION_CONFIG = [
  {
    value: "Basic",
    labels: ["A-row", "K-row", "S-row", "T-row", "N-row", "H-row", "M-row", "Y-row", "R-row", "W-row", "N-only"],
  },
  {
    value: "Dakuten",
    labels: ["G-row", "Z-row", "D-row", "B-row"],
  },
  {
    value: "Handakuten",
    labels: ["P-row"],
  },
  {
    value: "Yoon",
    labels: ["Kya-row", "Sha-row", "Cha-row", "Nya-row", "Hya-row", "Mya-row", "Rya-row", "Gya-row", "Ja-row", "Bya-row", "Pya-row"],
  },
];

export function getPracticeGroupOptions(activeTab, items) {
  if (activeTab !== "hiragana" && activeTab !== "katakana") {
    return [];
  }

  return KANA_SECTION_CONFIG
    .map((section) => ({
      value: section.value,
      label: section.value,
      count: items.filter((item) => section.labels.includes(item.row_label)).length,
    }))
    .filter((section) => section.count > 0);
}

export function filterPracticeItemsByGroup(activeTab, items, selectedGroups) {
  if (activeTab !== "hiragana" && activeTab !== "katakana") {
    return items;
  }

  const allowedLabels = new Set(
    KANA_SECTION_CONFIG.filter((section) => selectedGroups.includes(section.value)).flatMap(
      (section) => section.labels
    )
  );

  return items.filter((item) => item.row_label && allowedLabels.has(item.row_label));
}

export function getPracticeModes(activeTab) {
  const kanaQuizModes = [
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "typing", label: "Typing" },
    { value: "combo_typing", label: "Kana Combo" },
    { value: "draw", label: "Draw" },
  ];

  const config = {
    hiragana: {
      flashcardModes: [
        { value: "character_to_romaji", label: "Kana → Romaji" },
        { value: "romaji_to_character", label: "Romaji → Kana" },
      ],
      promptModes: [
        { value: "character", label: "Kana" },
        { value: "romaji", label: "Romaji" },
      ],
      answerModes: [
        { value: "character", label: "Kana" },
        { value: "romaji", label: "Romaji" },
      ],
      quizModes: kanaQuizModes,
    },
    katakana: {
      flashcardModes: [
        { value: "character_to_romaji", label: "Kana → Romaji" },
        { value: "romaji_to_character", label: "Romaji → Kana" },
      ],
      promptModes: [
        { value: "character", label: "Kana" },
        { value: "romaji", label: "Romaji" },
      ],
      answerModes: [
        { value: "character", label: "Kana" },
        { value: "romaji", label: "Romaji" },
      ],
      quizModes: kanaQuizModes,
    },
    kanji: {
      flashcardModes: [
        { value: "character_to_english", label: "Kanji → English" },
        { value: "english_to_character", label: "English → Kanji" },
        { value: "character_to_kana", label: "Kanji → Reading" },
        { value: "kana_to_character", label: "Reading → Kanji" },
      ],
      promptModes: [
        { value: "character", label: "Kanji" },
        { value: "kana", label: "Reading" },
        { value: "english", label: "English" },
      ],
      answerModes: [
        { value: "character", label: "Kanji" },
        { value: "kana", label: "Reading" },
        { value: "english", label: "English" },
      ],
      quizModes: [{ value: "multiple_choice", label: "Multiple Choice" }],
    },
    vocabulary: {
      flashcardModes: [
        { value: "word_to_meaning", label: "Word → Meaning" },
        { value: "meaning_to_word", label: "Meaning → Word" },
        { value: "word_to_reading", label: "Word → Reading" },
        { value: "reading_to_word", label: "Reading → Word" },
      ],
      promptModes: [
        { value: "word", label: "Word" },
        { value: "reading", label: "Reading" },
        { value: "meaning", label: "Meaning" },
      ],
      answerModes: [
        { value: "word", label: "Word" },
        { value: "reading", label: "Reading" },
        { value: "meaning", label: "Meaning" },
      ],
      quizModes: [{ value: "multiple_choice", label: "Multiple Choice" }],
    },
    counters: {
      flashcardModes: [
        { value: "counter_to_meaning", label: "Counter → Meaning" },
        { value: "counter_to_reading", label: "Counter → Reading" },
        { value: "meaning_to_counter", label: "Meaning → Counter" },
      ],
      promptModes: [
        { value: "counter", label: "Counter" },
        { value: "meaning", label: "Meaning" },
      ],
      answerModes: [
        { value: "counter", label: "Counter" },
        { value: "meaning", label: "Meaning" },
        { value: "reading", label: "Reading" },
      ],
      quizModes: [{ value: "multiple_choice", label: "Multiple Choice" }],
    },
  };

  return config[activeTab] ?? {
    flashcardModes: [],
    promptModes: [],
    answerModes: [],
    quizModes: [{ value: "multiple_choice", label: "Multiple Choice" }],
  };
}

export function getPracticeValue(item, activeTab, mode) {
  const valueMap = {
    hiragana: {
      character: item.character_symbol,
      romaji: item.romaji,
    },
    katakana: {
      character: item.character_symbol,
      romaji: item.romaji,
    },
    kanji: {
      character: item.character,
      kana: item.kunyomi || item.onyomi || item.example_reading,
      english: item.meaning,
    },
    vocabulary: {
      word: item.word,
      reading: item.reading,
      meaning: item.meaning,
    },
    counters: {
      counter: item.counter,
      meaning: item.meaning,
      reading: Array.isArray(item.readings) ? item.readings.join(" / ") : "",
    },
  };

  return valueMap[activeTab]?.[mode] ?? "";
}

export function getFlashcardFaces(item, activeTab, flashcardMode) {
  const [frontMode, backMode] = flashcardMode.split("_to_");

  return {
    front: getPracticeValue(item, activeTab, frontMode),
    back: getPracticeValue(item, activeTab, backMode),
    frontMode,
    backMode,
  };
}

export function getPracticeItemLabel(item, activeTab) {
  const labelMap = {
    hiragana: item.character_symbol,
    katakana: item.character_symbol,
    kanji: item.character,
    vocabulary: item.word,
    counters: item.counter,
  };

  return labelMap[activeTab] ?? String(item.id);
}

export function normalizePracticeInput(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "");
}
