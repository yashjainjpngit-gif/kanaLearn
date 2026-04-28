# Counters Nav Feature — Design Spec
Date: 2026-04-28

## Overview

Add a **Counters** tab to the Kanji Study app covering all JLPT N5 Japanese counter words (助数詞). The tab fits the existing nav/theme pattern, stores data in MongoDB, and supports both a rich browse view and a practice/quiz mode.

---

## 1. Data & Schema

### MongoDB collection: `counters`

Each document:

```js
{
  id: Number,                        // sequential, 1-based
  counter: String,                   // "本"
  readings: [String],                // ["ほん", "ぽん", "ぼん"] — all phonetic variants
  romaji: [String],                  // ["hon", "pon", "bon"]
  meaning: String,                   // "long thin objects"
  category: String,                  // "objects" | "animate" | "time" | "order" | "generic"
  appliesTo: [String],               // ["pen", "bottle", "umbrella"]
  appliesToJa: [String],             // ["ペン", "ビン", "かさ"]
  conjugations: [
    {
      number: Number,                // 1–10, 100, special (? = なん)
      kanji: String,                 // "一本"
      reading: String,               // "いっぽん"
      romaji: String,                // "ippon"
      irregular: Boolean             // true → highlight in UI
    }
  ],
  exampleSentences: [
    {
      japanese: String,              // "えんぴつを三本ください。"
      reading: String,               // "えんぴつをさんぼんください。"
      english: String                // "Please give me three pencils."
    }
  ],
  notes: String,                     // phonetic change rules summary
  level: String,                     // "N5"
  sortOrder: Number
}
```

### Indexes

```
counters.id       — unique
counters.level    — for filtering
counters.category — for filtering
```

### Counter list (~22 entries)

| Counter | Readings | Category | Counts |
|---------|----------|----------|--------|
| 人 | にん / り | animate | people |
| 枚 | まい | objects | flat/thin items (paper, shirt, plate) |
| 本 | ほん / ぽん / ぼん | objects | long thin objects (pen, bottle, umbrella) |
| 匹 | ひき / ぴき / びき | animate | small animals (dog, cat, fish) |
| 台 | だい | objects | machines / vehicles (car, PC) |
| 番 | ばん | order | ordinal numbers (1st, 2nd…) |
| 箇所 | かしょ | generic | places / locations |
| 冊 | さつ | objects | bound books / magazines |
| つ | つ | generic | generic objects (native Japanese 1–10) |
| 個 | こ | objects | small objects |
| 頭 | とう | animate | large animals (horse, cow) |
| 羽 | わ / ば / は | animate | birds / rabbits |
| 杯 | はい / ばい / ぱい | objects | cups / glasses / bowls |
| 階 | かい / がい | objects | floors of a building |
| 時 | じ | time | o'clock |
| 分 | ふん / ぷん | time | minutes |
| 円 | えん | generic | yen (currency) |
| 歳 | さい | generic | age |
| 年 | ねん | time | years |
| 月 | がつ / つき | time | months |
| 日 | にち / か | time | days of month |
| 週間 | しゅうかん | time | weeks |
| 回 | かい / がい | generic | times / occurrences |

---

## 2. Backend

### New route — `studyRoutes.js`

```
GET /api/counters?search=&level=&category=
```

Searches across `counter`, `readings`, `meaning`, `appliesTo`, `appliesToJa`. Returns full documents. Cached 10 minutes (same as grammar/radicals).

### Updated route — `/api/counts`

Add `counters` to the counts response:
```js
counters: database.collection("counters").countDocuments()
```

### Seed data — `generate-study-content.js` + `seedData.js`

- All 22+ counter entries authored in `generate-study-content.js` as `exports.counters`
- `buildSeedData()` in `seedData.js` gains a `buildCounters()` function and includes `counters` in the returned seed object
- `ensureSeedData()` in `mongo.js` inserts the `counters` collection on first boot (same pattern as `readings`)

---

## 3. Frontend

### Routing & Navigation

| File | Change |
|------|--------|
| `StudyTabs.jsx` | Add `["counters", "Counters", "/counters"]` to `TAB_CONFIG` (after Grammar, before Readings) |
| `App.jsx` | Add `counters: "Counters"` to `PAGE_TITLES`; add `/counters` to `getActiveTabFromPathname`; add `"counters"` to `isPracticeTab` set |
| `AppContent.jsx` | Add `if (activeTab === "counters")` branch rendering `<CountersView />` |
| `kanjiApi.js` | Add `fetchCounters({ search, level, category })` function |
| `useStudyData.js` | Add counters query (same pattern as grammar/radicals) |

### New component: `CountersView.jsx`

**Browse layout:**
- Category filter pills at top: All / Objects / Animate / Time / Order / Generic (styled same as existing `CategoryFilter`)
- 2-column card grid on desktop, 1-column on mobile
- Each card contains:
  - Large counter character + reading badges (`ほん / ぽん / ぼん`)
  - Category badge
  - Applies-to chips (Japanese + English)
  - Inline conjugation table (1–10 + 100 + なん), irregular readings highlighted in `--learned-text` amber
  - 2–3 example sentences (collapsed behind a "Show examples" toggle)
  - Notes row for phonetic change rules
- Click card → opens `StudyItemModal` with full counter detail layout

### Practice mode

Integrates with existing practice infrastructure (`practiceUtils.js`, `PracticeView`, `FlashcardPractice`, `QuizPractice`).

**Flash card modes:**
- Front: number + object (e.g., "3 bottles / ビン 3つ") → Back: `さんぼん (三本)`
- Front: counter character (本) → Back: meaning + applies-to

**Quiz modes (multiple choice):**
- *Counter → meaning*: shown `匹` → pick "small animals" from 4 options
- *Number + object → reading*: shown "6 bottles" → pick `ろっぽん` from 4 options

Practice items have two granularities:
- For "counter → meaning" quiz: each counter document is one item (22 items)
- For "number + object → reading" quiz: each conjugation row is one item (up to 22 × 12 = 264 items), so a learner can drill specific numbers across all counters

---

## 4. Styling

No new CSS classes needed. The counter cards reuse:
- `.kanji-card` / `.module-grid` patterns for the card layout
- `.category-filter` for the pill buttons
- `--learned-text` / `--learned-bg` for irregular conjugation highlights
- `--surface`, `--border`, `--text`, `--muted` for the card shell

---

## 5. Out of scope

- N4/N3 counters (future extension — level field is present for this)
- Audio pronunciation
- Stroke order for counter kanji
- User-authored custom counters
