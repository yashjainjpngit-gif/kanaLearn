# Counters Nav Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully-featured Counters tab (browse + practice) for JLPT N5 Japanese counter words, stored in MongoDB and following the exact patterns already in the codebase.

**Architecture:** Counter data is hand-authored in `scripts/generate-study-content.js` and seeded into a `counters` MongoDB collection at startup (same pattern as grammar/radicals). A new Express route serves the data; the frontend wires it through `useStudyData` into a new `CountersView` component and the existing practice infrastructure.

**Tech Stack:** Node.js/Express, MongoDB (via mongodb driver), React, React Query (`@tanstack/react-query`), React Router, Vite.

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `scripts/generate-study-content.js` | Add `counters` export with all 22 N5 counter entries |
| Modify | `backend/src/db/seedData.js` | Add `buildCounters()` + include in `buildSeedData()` |
| Modify | `backend/src/db/mongo.js` | Add `counters` indexes + seed insertion |
| Modify | `backend/src/routes/studyRoutes.js` | Add `GET /api/counters`, add `counters` to `GET /api/counts` |
| Modify | `frontend/src/api/kanjiApi.js` | Add `fetchCounters()` |
| Modify | `frontend/src/hooks/useStudyData.js` | Add `countersQuery`, expose `moduleItems` for counters tab |
| Modify | `frontend/src/components/StudyTabs.jsx` | Add counters tab entry |
| Modify | `frontend/src/App.jsx` | Add route, PAGE_TITLES entry, isPracticeTab, practiceSourceItems |
| Modify | `frontend/src/components/practiceUtils.js` | Add counters practice modes + value accessors |
| Create | `frontend/src/components/CountersView.jsx` | Browse view: category filter + card grid with full counter info |
| Modify | `frontend/src/components/AppContent.jsx` | Add counters branch |
| Modify | `frontend/src/styles.css` | Add counter card CSS |

---

## Task 1: Add counter seed data

**Files:**
- Modify: `scripts/generate-study-content.js`

- [ ] **Step 1.1 — Open the file and append the counters array before `module.exports`**

At the very end of `scripts/generate-study-content.js`, just before `module.exports = {`, add:

```js
const counters = [
  {
    id: 1,
    counter: "人",
    readings: ["にん", "り"],
    romaji: ["nin", "ri"],
    meaning: "people / persons",
    category: "animate",
    appliesTo: ["person", "people", "student", "friend"],
    appliesToJa: ["人", "人々", "学生", "友達"],
    conjugations: [
      { number: 1,   kanji: "一人",   reading: "ひとり",       romaji: "hitori",      irregular: true  },
      { number: 2,   kanji: "二人",   reading: "ふたり",       romaji: "futari",      irregular: true  },
      { number: 3,   kanji: "三人",   reading: "さんにん",     romaji: "sannin",      irregular: false },
      { number: 4,   kanji: "四人",   reading: "よにん",       romaji: "yonin",       irregular: false },
      { number: 5,   kanji: "五人",   reading: "ごにん",       romaji: "gonin",       irregular: false },
      { number: 6,   kanji: "六人",   reading: "ろくにん",     romaji: "rokunin",     irregular: false },
      { number: 7,   kanji: "七人",   reading: "しちにん",     romaji: "shichinin",   irregular: false },
      { number: 8,   kanji: "八人",   reading: "はちにん",     romaji: "hachinin",    irregular: false },
      { number: 9,   kanji: "九人",   reading: "きゅうにん",   romaji: "kyuunin",     irregular: false },
      { number: 10,  kanji: "十人",   reading: "じゅうにん",   romaji: "juunin",      irregular: false },
      { number: null, kanji: "何人",  reading: "なんにん",     romaji: "nannin",      irregular: false },
    ],
    exampleSentences: [
      { japanese: "クラスに三十人います。", reading: "クラスにさんじゅうにんいます。", english: "There are thirty people in the class." },
      { japanese: "一人で来ました。",       reading: "ひとりできました。",             english: "I came alone." },
      { japanese: "二人で食べましょう。",   reading: "ふたりでたべましょう。",         english: "Let's eat together (the two of us)." },
    ],
    notes: "Irregular: ひとり (1), ふたり (2). All others use にん.",
    level: "N5",
    sortOrder: 1,
  },
  {
    id: 2,
    counter: "枚",
    readings: ["まい"],
    romaji: ["mai"],
    meaning: "flat / thin objects",
    category: "objects",
    appliesTo: ["paper", "shirt", "plate", "stamp", "ticket", "photo"],
    appliesToJa: ["紙", "シャツ", "お皿", "切手", "チケット", "写真"],
    conjugations: [
      { number: 1,   kanji: "一枚",  reading: "いちまい",   romaji: "ichimai",  irregular: false },
      { number: 2,   kanji: "二枚",  reading: "にまい",     romaji: "nimai",    irregular: false },
      { number: 3,   kanji: "三枚",  reading: "さんまい",   romaji: "sanmai",   irregular: false },
      { number: 4,   kanji: "四枚",  reading: "よんまい",   romaji: "yonmai",   irregular: false },
      { number: 5,   kanji: "五枚",  reading: "ごまい",     romaji: "gomai",    irregular: false },
      { number: 6,   kanji: "六枚",  reading: "ろくまい",   romaji: "rokumai",  irregular: false },
      { number: 7,   kanji: "七枚",  reading: "ななまい",   romaji: "nanamai",  irregular: false },
      { number: 8,   kanji: "八枚",  reading: "はちまい",   romaji: "hachimai", irregular: false },
      { number: 9,   kanji: "九枚",  reading: "きゅうまい", romaji: "kyuumai",  irregular: false },
      { number: 10,  kanji: "十枚",  reading: "じゅうまい", romaji: "juumai",   irregular: false },
      { number: null, kanji: "何枚", reading: "なんまい",   romaji: "nanmai",   irregular: false },
    ],
    exampleSentences: [
      { japanese: "紙を一枚ください。",       reading: "かみをいちまいください。",       english: "Please give me one sheet of paper." },
      { japanese: "シャツを三枚持っています。", reading: "シャツをさんまいもっています。", english: "I have three shirts." },
    ],
    notes: "No phonetic changes. まい is always used regardless of the preceding number.",
    level: "N5",
    sortOrder: 2,
  },
  {
    id: 3,
    counter: "本",
    readings: ["ほん", "ぽん", "ぼん"],
    romaji: ["hon", "pon", "bon"],
    meaning: "long thin objects",
    category: "objects",
    appliesTo: ["pen", "bottle", "umbrella", "tree", "river", "road", "movie"],
    appliesToJa: ["ペン", "ビン", "かさ", "木", "川", "道", "映画"],
    conjugations: [
      { number: 1,   kanji: "一本",  reading: "いっぽん",   romaji: "ippon",   irregular: true  },
      { number: 2,   kanji: "二本",  reading: "にほん",     romaji: "nihon",   irregular: false },
      { number: 3,   kanji: "三本",  reading: "さんぼん",   romaji: "sanbon",  irregular: true  },
      { number: 4,   kanji: "四本",  reading: "よんほん",   romaji: "yonhon",  irregular: false },
      { number: 5,   kanji: "五本",  reading: "ごほん",     romaji: "gohon",   irregular: false },
      { number: 6,   kanji: "六本",  reading: "ろっぽん",   romaji: "roppon",  irregular: true  },
      { number: 7,   kanji: "七本",  reading: "ななほん",   romaji: "nanahon", irregular: false },
      { number: 8,   kanji: "八本",  reading: "はっぽん",   romaji: "happon",  irregular: true  },
      { number: 9,   kanji: "九本",  reading: "きゅうほん", romaji: "kyuuhon", irregular: false },
      { number: 10,  kanji: "十本",  reading: "じゅっぽん", romaji: "juppon",  irregular: true  },
      { number: null, kanji: "何本", reading: "なんぼん",   romaji: "nanbon",  irregular: false },
    ],
    exampleSentences: [
      { japanese: "えんぴつを三本ください。", reading: "えんぴつをさんぼんください。",   english: "Please give me three pencils." },
      { japanese: "木が二本あります。",       reading: "きがにほんあります。",           english: "There are two trees." },
      { japanese: "映画を一本見ました。",     reading: "えいがをいっぽんみました。",     english: "I watched one movie." },
    ],
    notes: "Phonetic changes: いっぽん (1), さんぼん (3), ろっぽん (6), はっぽん (8), じゅっぽん (10).",
    level: "N5",
    sortOrder: 3,
  },
  {
    id: 4,
    counter: "匹",
    readings: ["ひき", "ぴき", "びき"],
    romaji: ["hiki", "piki", "biki"],
    meaning: "small animals",
    category: "animate",
    appliesTo: ["dog", "cat", "fish", "rabbit", "insect", "mouse"],
    appliesToJa: ["犬", "猫", "魚", "うさぎ", "虫", "ネズミ"],
    conjugations: [
      { number: 1,   kanji: "一匹",  reading: "いっぴき",   romaji: "ippiki",   irregular: true  },
      { number: 2,   kanji: "二匹",  reading: "にひき",     romaji: "nihiki",   irregular: false },
      { number: 3,   kanji: "三匹",  reading: "さんびき",   romaji: "sanbiki",  irregular: true  },
      { number: 4,   kanji: "四匹",  reading: "よんひき",   romaji: "yonhiki",  irregular: false },
      { number: 5,   kanji: "五匹",  reading: "ごひき",     romaji: "gohiki",   irregular: false },
      { number: 6,   kanji: "六匹",  reading: "ろっぴき",   romaji: "roppiki",  irregular: true  },
      { number: 7,   kanji: "七匹",  reading: "ななひき",   romaji: "nanahiki", irregular: false },
      { number: 8,   kanji: "八匹",  reading: "はっぴき",   romaji: "happiki",  irregular: true  },
      { number: 9,   kanji: "九匹",  reading: "きゅうひき", romaji: "kyuuhiki", irregular: false },
      { number: 10,  kanji: "十匹",  reading: "じゅっぴき", romaji: "juppiki",  irregular: true  },
      { number: null, kanji: "何匹", reading: "なんびき",   romaji: "nanbiki",  irregular: false },
    ],
    exampleSentences: [
      { japanese: "猫が三匹います。",       reading: "ねこがさんびきいます。",       english: "There are three cats." },
      { japanese: "金魚を一匹買いました。", reading: "きんぎょをいっぴきかいました。", english: "I bought one goldfish." },
    ],
    notes: "Phonetic changes: いっぴき (1), さんびき (3), ろっぴき (6), はっぴき (8), じゅっぴき (10).",
    level: "N5",
    sortOrder: 4,
  },
  {
    id: 5,
    counter: "台",
    readings: ["だい"],
    romaji: ["dai"],
    meaning: "machines / vehicles / furniture",
    category: "objects",
    appliesTo: ["car", "bicycle", "computer", "television", "piano", "camera"],
    appliesToJa: ["車", "自転車", "パソコン", "テレビ", "ピアノ", "カメラ"],
    conjugations: [
      { number: 1,   kanji: "一台",  reading: "いちだい",   romaji: "ichidai",  irregular: false },
      { number: 2,   kanji: "二台",  reading: "にだい",     romaji: "nidai",    irregular: false },
      { number: 3,   kanji: "三台",  reading: "さんだい",   romaji: "sandai",   irregular: false },
      { number: 4,   kanji: "四台",  reading: "よんだい",   romaji: "yondai",   irregular: false },
      { number: 5,   kanji: "五台",  reading: "ごだい",     romaji: "godai",    irregular: false },
      { number: 6,   kanji: "六台",  reading: "ろくだい",   romaji: "rokudai",  irregular: false },
      { number: 7,   kanji: "七台",  reading: "ななだい",   romaji: "nanadai",  irregular: false },
      { number: 8,   kanji: "八台",  reading: "はちだい",   romaji: "hachidai", irregular: false },
      { number: 9,   kanji: "九台",  reading: "きゅうだい", romaji: "kyuudai",  irregular: false },
      { number: 10,  kanji: "十台",  reading: "じゅうだい", romaji: "juudai",   irregular: false },
      { number: null, kanji: "何台", reading: "なんだい",   romaji: "nandai",   irregular: false },
    ],
    exampleSentences: [
      { japanese: "車が二台あります。",           reading: "くるまがにだいあります。",           english: "There are two cars." },
      { japanese: "パソコンを一台買いました。",   reading: "パソコンをいちだいかいました。",     english: "I bought one computer." },
    ],
    notes: "No phonetic changes. だい is always used.",
    level: "N5",
    sortOrder: 5,
  },
  {
    id: 6,
    counter: "番",
    readings: ["ばん"],
    romaji: ["ban"],
    meaning: "ordinal numbers (1st, 2nd…)",
    category: "order",
    appliesTo: ["rank", "number", "turn", "order", "line", "place"],
    appliesToJa: ["順位", "番号", "順番", "順序", "列", "場所"],
    conjugations: [
      { number: 1,  kanji: "一番",  reading: "いちばん",   romaji: "ichiban",  irregular: false },
      { number: 2,  kanji: "二番",  reading: "にばん",     romaji: "niban",    irregular: false },
      { number: 3,  kanji: "三番",  reading: "さんばん",   romaji: "sanban",   irregular: false },
      { number: 4,  kanji: "四番",  reading: "よんばん",   romaji: "yonban",   irregular: false },
      { number: 5,  kanji: "五番",  reading: "ごばん",     romaji: "goban",    irregular: false },
      { number: 6,  kanji: "六番",  reading: "ろくばん",   romaji: "rokuban",  irregular: false },
      { number: 7,  kanji: "七番",  reading: "ななばん",   romaji: "nanaban",  irregular: false },
      { number: 8,  kanji: "八番",  reading: "はちばん",   romaji: "hachiban", irregular: false },
      { number: 9,  kanji: "九番",  reading: "きゅうばん", romaji: "kyuuban",  irregular: false },
      { number: 10, kanji: "十番",  reading: "じゅうばん", romaji: "juuban",   irregular: false },
    ],
    exampleSentences: [
      { japanese: "一番が好きです。",     reading: "いちばんがすきです。",     english: "I like number one / I like it most." },
      { japanese: "三番の電車に乗ります。", reading: "さんばんのでんしゃにのります。", english: "I will take train number 3." },
    ],
    notes: "No phonetic changes. Note: 一番 (いちばん) also means 'most / best' as an adverb.",
    level: "N5",
    sortOrder: 6,
  },
  {
    id: 7,
    counter: "箇所",
    readings: ["かしょ"],
    romaji: ["kasho"],
    meaning: "places / locations / spots",
    category: "generic",
    appliesTo: ["place", "location", "spot", "point", "section", "area"],
    appliesToJa: ["場所", "地点", "箇所", "部分", "区間", "区域"],
    conjugations: [
      { number: 1,   kanji: "一箇所",  reading: "いっかしょ",   romaji: "ikkasho",   irregular: true  },
      { number: 2,   kanji: "二箇所",  reading: "にかしょ",     romaji: "nikasho",   irregular: false },
      { number: 3,   kanji: "三箇所",  reading: "さんかしょ",   romaji: "sankasho",  irregular: false },
      { number: 4,   kanji: "四箇所",  reading: "よんかしょ",   romaji: "yonkasho",  irregular: false },
      { number: 5,   kanji: "五箇所",  reading: "ごかしょ",     romaji: "gokasho",   irregular: false },
      { number: 6,   kanji: "六箇所",  reading: "ろっかしょ",   romaji: "rokkasho",  irregular: true  },
      { number: 7,   kanji: "七箇所",  reading: "ななかしょ",   romaji: "nanakasho", irregular: false },
      { number: 8,   kanji: "八箇所",  reading: "はっかしょ",   romaji: "hakkasho",  irregular: true  },
      { number: 9,   kanji: "九箇所",  reading: "きゅうかしょ", romaji: "kyuukasho", irregular: false },
      { number: 10,  kanji: "十箇所",  reading: "じゅっかしょ", romaji: "jukkasho",  irregular: true  },
      { number: null, kanji: "何箇所", reading: "なんかしょ",   romaji: "nankasho",  irregular: false },
    ],
    exampleSentences: [
      { japanese: "三箇所に傷があります。", reading: "さんかしょにきずがあります。", english: "There are scratches in three places." },
      { japanese: "一箇所だけ直します。",   reading: "いっかしょだけなおします。",   english: "I will fix just one spot." },
    ],
    notes: "Phonetic changes: いっかしょ (1), ろっかしょ (6), はっかしょ (8), じゅっかしょ (10).",
    level: "N5",
    sortOrder: 7,
  },
  {
    id: 8,
    counter: "冊",
    readings: ["さつ"],
    romaji: ["satsu"],
    meaning: "bound books / magazines / notebooks",
    category: "objects",
    appliesTo: ["book", "magazine", "notebook", "dictionary", "manga"],
    appliesToJa: ["本", "雑誌", "ノート", "辞書", "マンガ"],
    conjugations: [
      { number: 1,   kanji: "一冊",  reading: "いっさつ",   romaji: "issatsu",   irregular: true  },
      { number: 2,   kanji: "二冊",  reading: "にさつ",     romaji: "nisatsu",   irregular: false },
      { number: 3,   kanji: "三冊",  reading: "さんさつ",   romaji: "sansatsu",  irregular: false },
      { number: 4,   kanji: "四冊",  reading: "よんさつ",   romaji: "yonsatsu",  irregular: false },
      { number: 5,   kanji: "五冊",  reading: "ごさつ",     romaji: "gosatsu",   irregular: false },
      { number: 6,   kanji: "六冊",  reading: "ろくさつ",   romaji: "rokusatsu", irregular: false },
      { number: 7,   kanji: "七冊",  reading: "ななさつ",   romaji: "nanasatsu", irregular: false },
      { number: 8,   kanji: "八冊",  reading: "はっさつ",   romaji: "hassatsu",  irregular: true  },
      { number: 9,   kanji: "九冊",  reading: "きゅうさつ", romaji: "kyuusatsu", irregular: false },
      { number: 10,  kanji: "十冊",  reading: "じゅっさつ", romaji: "jussatsu",  irregular: true  },
      { number: null, kanji: "何冊", reading: "なんさつ",   romaji: "nansatsu",  irregular: false },
    ],
    exampleSentences: [
      { japanese: "本を三冊読みました。",   reading: "ほんをさんさつよみました。",   english: "I read three books." },
      { japanese: "ノートを一冊ください。", reading: "ノートをいっさつください。",   english: "Please give me one notebook." },
    ],
    notes: "Phonetic changes: いっさつ (1), はっさつ (8), じゅっさつ (10).",
    level: "N5",
    sortOrder: 8,
  },
  {
    id: 9,
    counter: "つ",
    readings: ["つ"],
    romaji: ["tsu"],
    meaning: "generic objects (native Japanese counting, 1–10)",
    category: "generic",
    appliesTo: ["any object", "apple", "orange", "thing", "item"],
    appliesToJa: ["もの", "りんご", "みかん", "品物", "アイテム"],
    conjugations: [
      { number: 1,  kanji: "一つ",  reading: "ひとつ",     romaji: "hitotsu",    irregular: true },
      { number: 2,  kanji: "二つ",  reading: "ふたつ",     romaji: "futatsu",    irregular: true },
      { number: 3,  kanji: "三つ",  reading: "みっつ",     romaji: "mittsu",     irregular: true },
      { number: 4,  kanji: "四つ",  reading: "よっつ",     romaji: "yottsu",     irregular: true },
      { number: 5,  kanji: "五つ",  reading: "いつつ",     romaji: "itsutsu",    irregular: true },
      { number: 6,  kanji: "六つ",  reading: "むっつ",     romaji: "muttsu",     irregular: true },
      { number: 7,  kanji: "七つ",  reading: "ななつ",     romaji: "nanatsu",    irregular: true },
      { number: 8,  kanji: "八つ",  reading: "やっつ",     romaji: "yattsu",     irregular: true },
      { number: 9,  kanji: "九つ",  reading: "ここのつ",   romaji: "kokonotsu",  irregular: true },
      { number: 10, kanji: "十",    reading: "とお",       romaji: "too",         irregular: true },
    ],
    exampleSentences: [
      { japanese: "りんごを三つ食べました。", reading: "りんごをみっつたべました。", english: "I ate three apples." },
      { japanese: "いくつありますか。",       reading: "いくつありますか。",         english: "How many are there?" },
    ],
    notes: "All forms are irregular — these are native Japanese (和語) numbers. Only works for 1–10; use Sino-Japanese numbers (個, 本, etc.) for 11+.",
    level: "N5",
    sortOrder: 9,
  },
  {
    id: 10,
    counter: "個",
    readings: ["こ"],
    romaji: ["ko"],
    meaning: "small compact objects",
    category: "objects",
    appliesTo: ["ball", "egg", "candy", "stone", "button", "coin"],
    appliesToJa: ["ボール", "卵", "あめ", "石", "ボタン", "コイン"],
    conjugations: [
      { number: 1,   kanji: "一個",  reading: "いっこ",   romaji: "ikko",   irregular: true  },
      { number: 2,   kanji: "二個",  reading: "にこ",     romaji: "niko",   irregular: false },
      { number: 3,   kanji: "三個",  reading: "さんこ",   romaji: "sanko",  irregular: false },
      { number: 4,   kanji: "四個",  reading: "よんこ",   romaji: "yonko",  irregular: false },
      { number: 5,   kanji: "五個",  reading: "ごこ",     romaji: "goko",   irregular: false },
      { number: 6,   kanji: "六個",  reading: "ろっこ",   romaji: "rokko",  irregular: true  },
      { number: 7,   kanji: "七個",  reading: "ななこ",   romaji: "nanako", irregular: false },
      { number: 8,   kanji: "八個",  reading: "はっこ",   romaji: "hakko",  irregular: true  },
      { number: 9,   kanji: "九個",  reading: "きゅうこ", romaji: "kyuuko", irregular: false },
      { number: 10,  kanji: "十個",  reading: "じゅっこ", romaji: "jukko",  irregular: true  },
      { number: null, kanji: "何個", reading: "なんこ",   romaji: "nanko",  irregular: false },
    ],
    exampleSentences: [
      { japanese: "卵を六個買いました。",     reading: "たまごをろっこかいました。",   english: "I bought six eggs." },
      { japanese: "あめを一個ください。",     reading: "あめをいっこください。",       english: "Please give me one candy." },
    ],
    notes: "Phonetic changes: いっこ (1), ろっこ (6), はっこ (8), じゅっこ (10).",
    level: "N5",
    sortOrder: 10,
  },
  {
    id: 11,
    counter: "頭",
    readings: ["とう"],
    romaji: ["tou"],
    meaning: "large animals",
    category: "animate",
    appliesTo: ["horse", "cow", "elephant", "whale", "bear", "lion"],
    appliesToJa: ["馬", "牛", "ゾウ", "クジラ", "クマ", "ライオン"],
    conjugations: [
      { number: 1,   kanji: "一頭",  reading: "いっとう",   romaji: "ittou",   irregular: true  },
      { number: 2,   kanji: "二頭",  reading: "にとう",     romaji: "nitou",   irregular: false },
      { number: 3,   kanji: "三頭",  reading: "さんとう",   romaji: "santou",  irregular: false },
      { number: 4,   kanji: "四頭",  reading: "よんとう",   romaji: "yontou",  irregular: false },
      { number: 5,   kanji: "五頭",  reading: "ごとう",     romaji: "gotou",   irregular: false },
      { number: 6,   kanji: "六頭",  reading: "ろくとう",   romaji: "rokutou", irregular: false },
      { number: 7,   kanji: "七頭",  reading: "ななとう",   romaji: "nanatou", irregular: false },
      { number: 8,   kanji: "八頭",  reading: "はっとう",   romaji: "hattou",  irregular: true  },
      { number: 9,   kanji: "九頭",  reading: "きゅうとう", romaji: "kyuutou", irregular: false },
      { number: 10,  kanji: "十頭",  reading: "じゅっとう", romaji: "juttou",  irregular: true  },
      { number: null, kanji: "何頭", reading: "なんとう",   romaji: "nantou",  irregular: false },
    ],
    exampleSentences: [
      { japanese: "牧場に牛が五頭います。", reading: "ぼくじょうにうしがごとういます。", english: "There are five cows on the farm." },
      { japanese: "ゾウを三頭見ました。",   reading: "ゾウをさんとうみました。",         english: "I saw three elephants." },
    ],
    notes: "Phonetic changes: いっとう (1), はっとう (8), じゅっとう (10). Use 匹 for small animals, 頭 for large ones.",
    level: "N5",
    sortOrder: 11,
  },
  {
    id: 12,
    counter: "羽",
    readings: ["わ", "ば", "は"],
    romaji: ["wa", "ba", "ha"],
    meaning: "birds / rabbits",
    category: "animate",
    appliesTo: ["bird", "sparrow", "pigeon", "rabbit", "chicken", "eagle"],
    appliesToJa: ["鳥", "スズメ", "ハト", "うさぎ", "にわとり", "ワシ"],
    conjugations: [
      { number: 1,   kanji: "一羽",  reading: "いちわ",   romaji: "ichiwa",  irregular: false },
      { number: 2,   kanji: "二羽",  reading: "にわ",     romaji: "niwa",    irregular: false },
      { number: 3,   kanji: "三羽",  reading: "さんわ",   romaji: "sanwa",   irregular: false },
      { number: 4,   kanji: "四羽",  reading: "よんわ",   romaji: "yonwa",   irregular: false },
      { number: 5,   kanji: "五羽",  reading: "ごわ",     romaji: "gowa",    irregular: false },
      { number: 6,   kanji: "六羽",  reading: "ろくわ",   romaji: "rokuwa",  irregular: false },
      { number: 7,   kanji: "七羽",  reading: "ななわ",   romaji: "nanawa",  irregular: false },
      { number: 8,   kanji: "八羽",  reading: "はちわ",   romaji: "hachiwa", irregular: false },
      { number: 9,   kanji: "九羽",  reading: "きゅうわ", romaji: "kyuuwa",  irregular: false },
      { number: 10,  kanji: "十羽",  reading: "じゅうわ", romaji: "juuwa",   irregular: false },
      { number: null, kajai: "何羽", reading: "なんわ",   romaji: "nanwa",   irregular: false },
    ],
    exampleSentences: [
      { japanese: "鳥が三羽います。",         reading: "とりがさんわいます。",         english: "There are three birds." },
      { japanese: "うさぎを二羽飼っています。", reading: "うさぎをにわかっています。",   english: "I keep two rabbits." },
    ],
    notes: "Rabbits use 羽 (not 匹) because they were historically counted like birds. Minor variants ば/は exist for 3, 6.",
    level: "N5",
    sortOrder: 12,
  },
  {
    id: 13,
    counter: "杯",
    readings: ["はい", "ばい", "ぱい"],
    romaji: ["hai", "bai", "pai"],
    meaning: "cups / glasses / bowls (liquid containers)",
    category: "objects",
    appliesTo: ["cup", "glass", "bowl", "coffee", "tea", "soup", "beer"],
    appliesToJa: ["コップ", "グラス", "お椀", "コーヒー", "お茶", "スープ", "ビール"],
    conjugations: [
      { number: 1,   kanji: "一杯",  reading: "いっぱい",   romaji: "ippai",   irregular: true  },
      { number: 2,   kanji: "二杯",  reading: "にはい",     romaji: "nihai",   irregular: false },
      { number: 3,   kanji: "三杯",  reading: "さんばい",   romaji: "sanbai",  irregular: true  },
      { number: 4,   kanji: "四杯",  reading: "よんはい",   romaji: "yonhai",  irregular: false },
      { number: 5,   kanji: "五杯",  reading: "ごはい",     romaji: "gohai",   irregular: false },
      { number: 6,   kanji: "六杯",  reading: "ろっぱい",   romaji: "roppai",  irregular: true  },
      { number: 7,   kanji: "七杯",  reading: "ななはい",   romaji: "nanahai", irregular: false },
      { number: 8,   kanji: "八杯",  reading: "はっぱい",   romaji: "happai",  irregular: true  },
      { number: 9,   kanji: "九杯",  reading: "きゅうはい", romaji: "kyuuhai", irregular: false },
      { number: 10,  kanji: "十杯",  reading: "じゅっぱい", romaji: "juppai",  irregular: true  },
      { number: null, kanji: "何杯", reading: "なんばい",   romaji: "nanbai",  irregular: false },
    ],
    exampleSentences: [
      { japanese: "コーヒーを一杯飲みました。", reading: "コーヒーをいっぱいのみました。", english: "I drank one cup of coffee." },
      { japanese: "お茶を三杯ください。",       reading: "おちゃをさんばいください。",   english: "Please give me three cups of tea." },
    ],
    notes: "Phonetic changes: いっぱい (1), さんばい (3), ろっぱい (6), はっぱい (8), じゅっぱい (10). Note: 一杯 also means 'full / a lot'.",
    level: "N5",
    sortOrder: 13,
  },
  {
    id: 14,
    counter: "階",
    readings: ["かい", "がい"],
    romaji: ["kai", "gai"],
    meaning: "floors of a building",
    category: "objects",
    appliesTo: ["floor", "story", "level", "basement"],
    appliesToJa: ["階", "フロア", "レベル", "地下"],
    conjugations: [
      { number: 1,   kanji: "一階",  reading: "いっかい",   romaji: "ikkai",   irregular: true  },
      { number: 2,   kanji: "二階",  reading: "にかい",     romaji: "nikai",   irregular: false },
      { number: 3,   kanji: "三階",  reading: "さんがい",   romaji: "sangai",  irregular: true  },
      { number: 4,   kanji: "四階",  reading: "よんかい",   romaji: "yonkai",  irregular: false },
      { number: 5,   kanji: "五階",  reading: "ごかい",     romaji: "gokai",   irregular: false },
      { number: 6,   kanji: "六階",  reading: "ろっかい",   romaji: "rokkai",  irregular: true  },
      { number: 7,   kanji: "七階",  reading: "ななかい",   romaji: "nanakai", irregular: false },
      { number: 8,   kanji: "八階",  reading: "はっかい",   romaji: "hakkai",  irregular: true  },
      { number: 9,   kanji: "九階",  reading: "きゅうかい", romaji: "kyuukai", irregular: false },
      { number: 10,  kanji: "十階",  reading: "じゅっかい", romaji: "jukkai",  irregular: true  },
      { number: null, kanji: "何階", reading: "なんかい",   romaji: "nankai",  irregular: false },
    ],
    exampleSentences: [
      { japanese: "エレベーターで三階に行きます。", reading: "エレベーターでさんがいにいきます。", english: "I'll go to the third floor by elevator." },
      { japanese: "部屋は二階にあります。",         reading: "へやはにかいにあります。",           english: "The room is on the second floor." },
    ],
    notes: "Phonetic changes: いっかい (1), さんがい (3), ろっかい (6), はっかい (8), じゅっかい (10).",
    level: "N5",
    sortOrder: 14,
  },
  {
    id: 15,
    counter: "時",
    readings: ["じ"],
    romaji: ["ji"],
    meaning: "hours (o'clock)",
    category: "time",
    appliesTo: ["hour", "o'clock", "time"],
    appliesToJa: ["時間", "時刻", "時"],
    conjugations: [
      { number: 1,  kanji: "一時",   reading: "いちじ",     romaji: "ichiji",    irregular: false },
      { number: 2,  kanji: "二時",   reading: "にじ",       romaji: "niji",      irregular: false },
      { number: 3,  kanji: "三時",   reading: "さんじ",     romaji: "sanji",     irregular: false },
      { number: 4,  kanji: "四時",   reading: "よじ",       romaji: "yoji",      irregular: true  },
      { number: 5,  kanji: "五時",   reading: "ごじ",       romaji: "goji",      irregular: false },
      { number: 6,  kanji: "六時",   reading: "ろくじ",     romaji: "rokuji",    irregular: false },
      { number: 7,  kanji: "七時",   reading: "しちじ",     romaji: "shichiji",  irregular: false },
      { number: 8,  kanji: "八時",   reading: "はちじ",     romaji: "hachiji",   irregular: false },
      { number: 9,  kanji: "九時",   reading: "くじ",       romaji: "kuji",      irregular: true  },
      { number: 10, kanji: "十時",   reading: "じゅうじ",   romaji: "juuji",     irregular: false },
      { number: 11, kanji: "十一時", reading: "じゅういちじ", romaji: "juuichiji", irregular: false },
      { number: 12, kanji: "十二時", reading: "じゅうにじ", romaji: "juuniji",   irregular: false },
      { number: null, kanji: "何時", reading: "なんじ",     romaji: "nanji",     irregular: false },
    ],
    exampleSentences: [
      { japanese: "今、三時です。",       reading: "いま、さんじです。",       english: "It's three o'clock now." },
      { japanese: "四時に会いましょう。", reading: "よじにあいましょう。",     english: "Let's meet at four o'clock." },
    ],
    notes: "Irregular: よじ (4 o'clock, not よんじ), くじ (9 o'clock, not きゅうじ).",
    level: "N5",
    sortOrder: 15,
  },
  {
    id: 16,
    counter: "分",
    readings: ["ふん", "ぷん"],
    romaji: ["fun", "pun"],
    meaning: "minutes",
    category: "time",
    appliesTo: ["minute", "time"],
    appliesToJa: ["分", "時間"],
    conjugations: [
      { number: 1,   kanji: "一分",  reading: "いっぷん",   romaji: "ippun",   irregular: true  },
      { number: 2,   kanji: "二分",  reading: "にふん",     romaji: "nifun",   irregular: false },
      { number: 3,   kanji: "三分",  reading: "さんぷん",   romaji: "sanpun",  irregular: true  },
      { number: 4,   kanji: "四分",  reading: "よんぷん",   romaji: "yonpun",  irregular: true  },
      { number: 5,   kanji: "五分",  reading: "ごふん",     romaji: "gofun",   irregular: false },
      { number: 6,   kanji: "六分",  reading: "ろっぷん",   romaji: "roppun",  irregular: true  },
      { number: 7,   kanji: "七分",  reading: "ななふん",   romaji: "nanafun", irregular: false },
      { number: 8,   kanji: "八分",  reading: "はっぷん",   romaji: "happun",  irregular: true  },
      { number: 9,   kanji: "九分",  reading: "きゅうふん", romaji: "kyuufun", irregular: false },
      { number: 10,  kanji: "十分",  reading: "じゅっぷん", romaji: "juppun",  irregular: true  },
      { number: 15,  kanji: "十五分", reading: "じゅうごふん", romaji: "juugofun", irregular: false },
      { number: 30,  kanji: "三十分", reading: "さんじゅっぷん", romaji: "sanjuppun", irregular: false },
      { number: null, kanji: "何分", reading: "なんぷん",   romaji: "nanpun",  irregular: false },
    ],
    exampleSentences: [
      { japanese: "三時十五分です。",     reading: "さんじじゅうごふんです。",   english: "It is 3:15." },
      { japanese: "五分後に来ます。",     reading: "ごふんごにきます。",         english: "I'll come in five minutes." },
    ],
    notes: "Phonetic changes: ぷん with 1, 3, 4, 6, 8, 10. ふん with 2, 5, 7, 9.",
    level: "N5",
    sortOrder: 16,
  },
  {
    id: 17,
    counter: "円",
    readings: ["えん"],
    romaji: ["en"],
    meaning: "Japanese yen (currency)",
    category: "generic",
    appliesTo: ["yen", "price", "cost", "fee", "amount"],
    appliesToJa: ["円", "値段", "金額", "料金"],
    conjugations: [
      { number: 1,    kanji: "一円",    reading: "いちえん",     romaji: "ichien",    irregular: false },
      { number: 5,    kanji: "五円",    reading: "ごえん",       romaji: "goen",      irregular: false },
      { number: 10,   kanji: "十円",    reading: "じゅうえん",   romaji: "juuen",     irregular: false },
      { number: 50,   kanji: "五十円",  reading: "ごじゅうえん", romaji: "gojuuen",   irregular: false },
      { number: 100,  kanji: "百円",    reading: "ひゃくえん",   romaji: "hyakuen",   irregular: false },
      { number: 500,  kanji: "五百円",  reading: "ごひゃくえん", romaji: "gohyakuen", irregular: false },
      { number: 1000, kanji: "千円",    reading: "せんえん",     romaji: "senen",     irregular: false },
      { number: null,  kanji: "何円",   reading: "なんえん",     romaji: "nanen",     irregular: false },
    ],
    exampleSentences: [
      { japanese: "これは三百円です。",   reading: "これはさんびゃくえんです。", english: "This is 300 yen." },
      { japanese: "いくらですか。",       reading: "いくらですか。",             english: "How much is it?" },
    ],
    notes: "No phonetic changes for えん itself. Note 百 (ひゃく→びゃく→ぴゃく) and 千 (せん→ぜん) change with preceding numbers.",
    level: "N5",
    sortOrder: 17,
  },
  {
    id: 18,
    counter: "歳",
    readings: ["さい"],
    romaji: ["sai"],
    meaning: "age (years old)",
    category: "generic",
    appliesTo: ["age", "years old"],
    appliesToJa: ["年齢", "歳"],
    conjugations: [
      { number: 1,  kanji: "一歳",   reading: "いっさい",     romaji: "issai",     irregular: true  },
      { number: 2,  kanji: "二歳",   reading: "にさい",       romaji: "nisai",     irregular: false },
      { number: 3,  kanji: "三歳",   reading: "さんさい",     romaji: "sansai",    irregular: false },
      { number: 4,  kanji: "四歳",   reading: "よんさい",     romaji: "yonsai",    irregular: false },
      { number: 5,  kanji: "五歳",   reading: "ごさい",       romaji: "gosai",     irregular: false },
      { number: 6,  kanji: "六歳",   reading: "ろくさい",     romaji: "rokusai",   irregular: false },
      { number: 7,  kanji: "七歳",   reading: "ななさい",     romaji: "nanasai",   irregular: false },
      { number: 8,  kanji: "八歳",   reading: "はっさい",     romaji: "hassai",    irregular: true  },
      { number: 9,  kanji: "九歳",   reading: "きゅうさい",   romaji: "kyuusai",   irregular: false },
      { number: 10, kanji: "十歳",   reading: "じゅっさい",   romaji: "jussai",    irregular: true  },
      { number: 20, kanji: "二十歳", reading: "はたち",       romaji: "hatachi",   irregular: true  },
      { number: null, kanji: "何歳", reading: "なんさい",     romaji: "nansai",    irregular: false },
    ],
    exampleSentences: [
      { japanese: "私は二十歳です。",     reading: "わたしははたちです。",       english: "I am twenty years old." },
      { japanese: "何歳ですか。",         reading: "なんさいですか。",           english: "How old are you?" },
    ],
    notes: "Phonetic changes: いっさい (1), はっさい (8), じゅっさい (10). Special: はたち (20) is the coming-of-age age.",
    level: "N5",
    sortOrder: 18,
  },
  {
    id: 19,
    counter: "年",
    readings: ["ねん"],
    romaji: ["nen"],
    meaning: "years (duration)",
    category: "time",
    appliesTo: ["year", "years", "duration"],
    appliesToJa: ["年", "年間"],
    conjugations: [
      { number: 1,   kanji: "一年",  reading: "いちねん",   romaji: "ichinen",  irregular: false },
      { number: 2,   kanji: "二年",  reading: "にねん",     romaji: "ninen",    irregular: false },
      { number: 3,   kanji: "三年",  reading: "さんねん",   romaji: "sannen",   irregular: false },
      { number: 4,   kanji: "四年",  reading: "よねん",     romaji: "yonen",    irregular: true  },
      { number: 5,   kanji: "五年",  reading: "ごねん",     romaji: "gonen",    irregular: false },
      { number: 6,   kanji: "六年",  reading: "ろくねん",   romaji: "rokunen",  irregular: false },
      { number: 7,   kanji: "七年",  reading: "ななねん",   romaji: "nananen",  irregular: false },
      { number: 8,   kanji: "八年",  reading: "はちねん",   romaji: "hachinen", irregular: false },
      { number: 9,   kanji: "九年",  reading: "きゅうねん", romaji: "kyuunen",  irregular: false },
      { number: 10,  kanji: "十年",  reading: "じゅうねん", romaji: "juunen",   irregular: false },
      { number: null, kanji: "何年", reading: "なんねん",   romaji: "nannen",   irregular: false },
    ],
    exampleSentences: [
      { japanese: "三年間日本語を勉強しました。", reading: "さんねんかんにほんごをべんきょうしました。", english: "I studied Japanese for three years." },
      { japanese: "来年、日本に行きます。",       reading: "らいねん、にほんにいきます。",             english: "I will go to Japan next year." },
    ],
    notes: "Mostly regular. Note: 四年 is often read よねん (not よんねん). Used for duration; for calendar years use 年 with the year number.",
    level: "N5",
    sortOrder: 19,
  },
  {
    id: 20,
    counter: "月",
    readings: ["がつ", "つき"],
    romaji: ["gatsu", "tsuki"],
    meaning: "months (of the year)",
    category: "time",
    appliesTo: ["month", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    appliesToJa: ["月", "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
    conjugations: [
      { number: 1,  kanji: "一月",   reading: "いちがつ",     romaji: "ichigatsu",  irregular: false },
      { number: 2,  kanji: "二月",   reading: "にがつ",       romaji: "nigatsu",    irregular: false },
      { number: 3,  kanji: "三月",   reading: "さんがつ",     romaji: "sangatsu",   irregular: false },
      { number: 4,  kanji: "四月",   reading: "しがつ",       romaji: "shigatsu",   irregular: true  },
      { number: 5,  kanji: "五月",   reading: "ごがつ",       romaji: "gogatsu",    irregular: false },
      { number: 6,  kanji: "六月",   reading: "ろくがつ",     romaji: "rokugatsu",  irregular: false },
      { number: 7,  kanji: "七月",   reading: "しちがつ",     romaji: "shichigatsu", irregular: false },
      { number: 8,  kanji: "八月",   reading: "はちがつ",     romaji: "hachigatsu", irregular: false },
      { number: 9,  kanji: "九月",   reading: "くがつ",       romaji: "kugatsu",    irregular: true  },
      { number: 10, kanji: "十月",   reading: "じゅうがつ",   romaji: "juugatsu",   irregular: false },
      { number: 11, kanji: "十一月", reading: "じゅういちがつ", romaji: "juuichigatsu", irregular: false },
      { number: 12, kanji: "十二月", reading: "じゅうにがつ", romaji: "juunigatsu", irregular: false },
      { number: null, kanji: "何月", reading: "なんがつ",     romaji: "nangatsu",   irregular: false },
    ],
    exampleSentences: [
      { japanese: "四月に日本に来ました。",   reading: "しがつにほんにきました。",   english: "I came to Japan in April." },
      { japanese: "誕生日は九月です。",       reading: "たんじょうびはくがつです。", english: "My birthday is in September." },
    ],
    notes: "Irregular: しがつ (April, not よんがつ), くがつ (September, not きゅうがつ). がつ for named months; つき for 'a month' (duration).",
    level: "N5",
    sortOrder: 20,
  },
  {
    id: 21,
    counter: "日",
    readings: ["にち", "か"],
    romaji: ["nichi", "ka"],
    meaning: "days of the month",
    category: "time",
    appliesTo: ["day", "date", "day of month"],
    appliesToJa: ["日", "日付", "日にち"],
    conjugations: [
      { number: 1,  kanji: "一日",   reading: "ついたち",   romaji: "tsuitachi", irregular: true  },
      { number: 2,  kanji: "二日",   reading: "ふつか",     romaji: "futsuka",   irregular: true  },
      { number: 3,  kanji: "三日",   reading: "みっか",     romaji: "mikka",     irregular: true  },
      { number: 4,  kanji: "四日",   reading: "よっか",     romaji: "yokka",     irregular: true  },
      { number: 5,  kanji: "五日",   reading: "いつか",     romaji: "itsuka",    irregular: true  },
      { number: 6,  kanji: "六日",   reading: "むいか",     romaji: "muika",     irregular: true  },
      { number: 7,  kanji: "七日",   reading: "なのか",     romaji: "nanoka",    irregular: true  },
      { number: 8,  kanji: "八日",   reading: "ようか",     romaji: "youka",     irregular: true  },
      { number: 9,  kanji: "九日",   reading: "ここのか",   romaji: "kokonoka",  irregular: true  },
      { number: 10, kanji: "十日",   reading: "とおか",     romaji: "tooka",     irregular: true  },
      { number: 14, kanji: "十四日", reading: "じゅうよっか", romaji: "juuyokka", irregular: true  },
      { number: 20, kanji: "二十日", reading: "はつか",     romaji: "hatsuka",   irregular: true  },
      { number: 24, kanji: "二十四日", reading: "にじゅうよっか", romaji: "nijuuyokka", irregular: true },
      { number: null, kanji: "何日", reading: "なんにち",   romaji: "nannichi",  irregular: false },
    ],
    exampleSentences: [
      { japanese: "今日は三日です。",         reading: "きょうはみっかです。",         english: "Today is the 3rd." },
      { japanese: "誕生日は八日です。",       reading: "たんじょうびはようかです。",   english: "My birthday is the 8th." },
    ],
    notes: "Almost entirely irregular — uses native Japanese (和語) counting. Must memorize each form: ついたち (1st), ふつか (2nd) through とおか (10th), then mixed forms.",
    level: "N5",
    sortOrder: 21,
  },
  {
    id: 22,
    counter: "週間",
    readings: ["しゅうかん"],
    romaji: ["shuukan"],
    meaning: "weeks (duration)",
    category: "time",
    appliesTo: ["week", "weeks", "duration"],
    appliesToJa: ["週", "週間"],
    conjugations: [
      { number: 1,   kanji: "一週間",  reading: "いっしゅうかん",   romaji: "isshuukan",   irregular: true  },
      { number: 2,   kanji: "二週間",  reading: "にしゅうかん",     romaji: "nishuukan",   irregular: false },
      { number: 3,   kanji: "三週間",  reading: "さんしゅうかん",   romaji: "sanshuukan",  irregular: false },
      { number: 4,   kanji: "四週間",  reading: "よんしゅうかん",   romaji: "yonshuukan",  irregular: false },
      { number: 5,   kanji: "五週間",  reading: "ごしゅうかん",     romaji: "goshuukan",   irregular: false },
      { number: 6,   kanji: "六週間",  reading: "ろくしゅうかん",   romaji: "rokushuukan", irregular: false },
      { number: 7,   kanji: "七週間",  reading: "ななしゅうかん",   romaji: "nanashuukan", irregular: false },
      { number: 8,   kanji: "八週間",  reading: "はっしゅうかん",   romaji: "hasshuukan",  irregular: true  },
      { number: 9,   kanji: "九週間",  reading: "きゅうしゅうかん", romaji: "kyuushuukan", irregular: false },
      { number: 10,  kanji: "十週間",  reading: "じゅっしゅうかん", romaji: "jusshuukan",  irregular: true  },
      { number: null, kanji: "何週間", reading: "なんしゅうかん",   romaji: "nanshuukan",  irregular: false },
    ],
    exampleSentences: [
      { japanese: "二週間後に帰ります。", reading: "にしゅうかんごにかえります。", english: "I will return in two weeks." },
      { japanese: "一週間に何回運動しますか。", reading: "いっしゅうかんにかいかいうんどうしますか。", english: "How many times a week do you exercise?" },
    ],
    notes: "Phonetic changes: いっしゅうかん (1), はっしゅうかん (8), じゅっしゅうかん (10).",
    level: "N5",
    sortOrder: 22,
  },
  {
    id: 23,
    counter: "回",
    readings: ["かい"],
    romaji: ["kai"],
    meaning: "times / occurrences / rounds",
    category: "generic",
    appliesTo: ["time", "occurrence", "round", "attempt", "visit", "dose"],
    appliesToJa: ["回", "度", "ラウンド", "試み", "訪問", "服用"],
    conjugations: [
      { number: 1,   kanji: "一回",  reading: "いっかい",   romaji: "ikkai",   irregular: true  },
      { number: 2,   kanji: "二回",  reading: "にかい",     romaji: "nikai",   irregular: false },
      { number: 3,   kanji: "三回",  reading: "さんかい",   romaji: "sankai",  irregular: false },
      { number: 4,   kanji: "四回",  reading: "よんかい",   romaji: "yonkai",  irregular: false },
      { number: 5,   kanji: "五回",  reading: "ごかい",     romaji: "gokai",   irregular: false },
      { number: 6,   kanji: "六回",  reading: "ろっかい",   romaji: "rokkai",  irregular: true  },
      { number: 7,   kanji: "七回",  reading: "ななかい",   romaji: "nanakai", irregular: false },
      { number: 8,   kanji: "八回",  reading: "はっかい",   romaji: "hakkai",  irregular: true  },
      { number: 9,   kanji: "九回",  reading: "きゅうかい", romaji: "kyuukai", irregular: false },
      { number: 10,  kanji: "十回",  reading: "じゅっかい", romaji: "jukkai",  irregular: true  },
      { number: null, kanji: "何回", reading: "なんかい",   romaji: "nankai",  irregular: false },
    ],
    exampleSentences: [
      { japanese: "一日三回飲んでください。", reading: "いちにちさんかいのんでください。", english: "Please take it three times a day." },
      { japanese: "何回も練習しました。",     reading: "なんかいもれんしゅうしました。",   english: "I practiced many times." },
    ],
    notes: "Phonetic changes: いっかい (1), ろっかい (6), はっかい (8), じゅっかい (10). Note: 一回 (いっかい) and 一階 (いっかい) sound identical — context determines meaning.",
    level: "N5",
    sortOrder: 23,
  },
];
```

- [ ] **Step 1.2 — Add `counters` to `module.exports`**

Find and replace the existing `module.exports` block at the bottom of the file:

```js
// Before:
module.exports = {
  radicals,
  kanaRows,
  vocabulary,
  grammar,
  readings,
};

// After:
module.exports = {
  radicals,
  kanaRows,
  vocabulary,
  grammar,
  readings,
  counters,
};
```

- [ ] **Step 1.3 — Verify the file parses without error**

```bash
node -e "const d = require('./scripts/generate-study-content.js'); console.log('counters:', d.counters.length)"
```

Expected output: `counters: 23`

- [ ] **Step 1.4 — Commit**

```bash
git add scripts/generate-study-content.js
git commit -m "feat: add N5 counter seed data (23 counters)"
```

---

## Task 2: Wire seed data into MongoDB

**Files:**
- Modify: `backend/src/db/seedData.js`
- Modify: `backend/src/db/mongo.js`

- [ ] **Step 2.1 — Add `buildCounters()` to `seedData.js`**

Open `backend/src/db/seedData.js`. After the `buildReadings` function (around line 196) and before `export function buildSeedData()`, add:

```js
function buildCounters(counters) {
  return counters.map((c) => ({
    id: c.id,
    counter: c.counter,
    readings: c.readings,
    romaji: c.romaji,
    meaning: c.meaning,
    category: c.category,
    appliesTo: c.appliesTo,
    appliesToJa: c.appliesToJa,
    conjugations: c.conjugations,
    exampleSentences: c.exampleSentences,
    notes: c.notes ?? null,
    level: c.level,
    sortOrder: c.sortOrder,
  }));
}
```

- [ ] **Step 2.2 — Include counters in `buildSeedData()`**

Find `export function buildSeedData()` in `backend/src/db/seedData.js`. Update it:

```js
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
    counters: buildCounters(studySourceData.counters ?? []),
  };
}
```

- [ ] **Step 2.3 — Add counters indexes to `mongo.js`**

Open `backend/src/db/mongo.js`. In `ensureIndexes(database)`, add to the `Promise.all([...])` array:

```js
database.collection("counters").createIndex({ id: 1 }, { unique: true }),
database.collection("counters").createIndex({ level: 1 }),
database.collection("counters").createIndex({ category: 1 }),
```

- [ ] **Step 2.4 — Seed counters collection in `ensureSeedData()`**

In `backend/src/db/mongo.js`, in the `ensureSeedData` function, add a reseed check for when counters collection is empty on an existing DB (same pattern as the `readingsCount` check). After the kanaItems reseed block, add:

```js
// Seed counters if the collection is empty (new feature on existing DB)
const countersCount = await database.collection("counters").countDocuments({}, { limit: 1 });
if (countersCount === 0) {
  const seedData = buildSeedData();
  if (seedData.counters.length) {
    await database.collection("counters").insertMany(seedData.counters, { ordered: true });
  }
}
```

- [ ] **Step 2.5 — Add counters to the initial seed collections list**

In `ensureSeedData`, find the `collections` array used for first-time seeding:

```js
const collections = [
  ["categories", seedData.categories],
  ["kanjiItems", seedData.kanjiItems],
  ["radicals", seedData.radicals],
  ["kanaItems", seedData.kanaItems],
  ["vocabularyItems", seedData.vocabularyItems],
  ["grammarPatterns", seedData.grammarPatterns],
  ["readings", seedData.readings],
  ["counters", seedData.counters],   // add this line
];
```

- [ ] **Step 2.6 — Commit**

```bash
git add backend/src/db/seedData.js backend/src/db/mongo.js
git commit -m "feat: seed counters collection in MongoDB"
```

---

## Task 3: Add backend API routes

**Files:**
- Modify: `backend/src/routes/studyRoutes.js`

- [ ] **Step 3.1 — Add `counters` to `GET /api/counts`**

Find the `/counts` route handler in `backend/src/routes/studyRoutes.js` (around line 34). Update it to count counters:

```js
router.get("/counts", createResponseCache(10 * 60 * 1000), async (_req, res, next) => {
  try {
    const database = await getDatabase();
    const [kanji, radicals, hiragana, katakana, vocabulary, grammar, readings, counters] = await Promise.all([
      database.collection("kanjiItems").countDocuments(),
      database.collection("radicals").countDocuments(),
      database.collection("kanaItems").countDocuments({ script: "hiragana" }),
      database.collection("kanaItems").countDocuments({ script: "katakana" }),
      database.collection("vocabularyItems").countDocuments(),
      database.collection("grammarPatterns").countDocuments(),
      database.collection("readings").countDocuments(),
      database.collection("counters").countDocuments(),
    ]);

    res.json({ radicals, hiragana, katakana, kanji, vocabulary, grammar, readings, counters });
  } catch (error) {
    next(error);
  }
});
```

- [ ] **Step 3.2 — Add `GET /api/counters` route**

After the `/grammar` route (around line 350) and before the `/readings` route, add:

```js
router.get("/counters", createResponseCache(10 * 60 * 1000), async (req, res, next) => {
  try {
    const database = await getDatabase();
    const { search = "", level = "", category = "" } = req.query;
    const query = {};

    if (search.trim()) {
      const regex = buildRegex(search);
      query.$or = [
        { counter: regex },
        { readings: regex },
        { meaning: regex },
        { appliesTo: regex },
        { appliesToJa: regex },
      ];
    }

    if (level.trim()) {
      query.level = level.trim();
    }

    if (category.trim()) {
      query.category = category.trim();
    }

    const rows = await database.collection("counters").find(query).sort({ sortOrder: 1, id: 1 }).toArray();

    res.json(
      rows.map((row) => ({
        id: row.id,
        counter: row.counter,
        readings: row.readings,
        romaji: row.romaji,
        meaning: row.meaning,
        category: row.category,
        appliesTo: row.appliesTo,
        appliesToJa: row.appliesToJa,
        conjugations: row.conjugations,
        exampleSentences: row.exampleSentences,
        notes: row.notes ?? null,
        level: row.level,
        sortOrder: row.sortOrder,
      }))
    );
  } catch (error) {
    next(error);
  }
});
```

- [ ] **Step 3.3 — Restart the backend and verify the API**

```bash
# In backend/ directory
npm run dev
```

In a new terminal:
```bash
curl http://localhost:4000/api/counters | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const j=JSON.parse(d); console.log('count:', j.length, '| first:', j[0].counter, j[0].readings)"
```

Expected: `count: 23 | first: 人 [ 'にん', 'り' ]`

```bash
curl "http://localhost:4000/api/counters?category=animate" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const j=JSON.parse(d); console.log(j.map(x=>x.counter))"
```

Expected: `[ '人', '匹', '頭', '羽' ]`

```bash
curl http://localhost:4000/api/counts | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); console.log(JSON.parse(d))"
```

Expected: object containing `counters: 23`.

- [ ] **Step 3.4 — Commit**

```bash
git add backend/src/routes/studyRoutes.js
git commit -m "feat: add GET /api/counters route and counters count"
```

---

## Task 4: Frontend API function and data hook

**Files:**
- Modify: `frontend/src/api/kanjiApi.js`
- Modify: `frontend/src/hooks/useStudyData.js`

- [ ] **Step 4.1 — Add `fetchCounters` to `kanjiApi.js`**

Open `frontend/src/api/kanjiApi.js`. After `fetchGrammar`, add:

```js
export async function fetchCounters({ search = "", level = "", category = "" } = {}) {
  const response = await fetch(buildUrl("counters", { search, level, category }));
  return handleResponse(response);
}
```

- [ ] **Step 4.2 — Add counters query to `useStudyData.js`**

Open `frontend/src/hooks/useStudyData.js`.

Add `fetchCounters` to the import at the top:

```js
import {
  fetchCategories,
  fetchCounts,
  fetchCounters,
  fetchGrammar,
  fetchKana,
  fetchKanji,
  fetchPracticeDashboard,
  fetchPracticeProgress,
  fetchRadicals,
  fetchReadings,
  fetchVocabulary,
} from "../api/kanjiApi";
```

After `readingsQuery`, add the counters query:

```js
const countersQuery = useQuery({
  queryKey: ["counters", search],
  queryFn: () => fetchCounters({ search }),
  enabled: activeTab === "counters",
});
```

Update `currentDataQuery` to include counters:

```js
const currentDataQuery = useMemo(() => {
  if (activeTab === "kanji") return kanjiQuery;
  if (activeTab === "radicals") return radicalsQuery;
  if (activeTab === "hiragana" || activeTab === "katakana") return kanaQuery;
  if (activeTab === "vocabulary") return vocabularyQuery;
  if (activeTab === "grammar") return grammarQuery;
  if (activeTab === "readings") return readingsQuery;
  if (activeTab === "counters") return countersQuery;
  if (activeTab === "dashboard") return dashboardQuery;
  return null;
}, [activeTab, countersQuery, dashboardQuery, grammarQuery, kanaQuery, kanjiQuery, radicalsQuery, readingsQuery, vocabularyQuery]);
```

Update `moduleItems` in the return value to include the counters case:

```js
moduleItems:
  activeTab === "vocabulary"
    ? vocabularyQuery.data?.items ?? []
    : activeTab === "radicals"
      ? radicalsQuery.data ?? []
      : activeTab === "hiragana" || activeTab === "katakana"
        ? kanaQuery.data ?? []
        : activeTab === "grammar"
          ? grammarQuery.data ?? []
          : activeTab === "readings"
            ? readingsQuery.data ?? []
            : activeTab === "counters"
              ? countersQuery.data ?? []
              : [],
```

- [ ] **Step 4.3 — Commit**

```bash
git add frontend/src/api/kanjiApi.js frontend/src/hooks/useStudyData.js
git commit -m "feat: add fetchCounters API and counters query in useStudyData"
```

---

## Task 5: Navigation and routing

**Files:**
- Modify: `frontend/src/components/StudyTabs.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 5.1 — Add counters tab to `StudyTabs.jsx`**

Open `frontend/src/components/StudyTabs.jsx`. Add counters after grammar (before readings) in `TAB_CONFIG`:

```js
const TAB_CONFIG = [
  ["dashboard", "Dashboard", "/dashboard"],
  ["challenges", "Challenges", "/challenges"],
  ["radicals", "Radicals", "/radicals"],
  ["hiragana", "Hiragana", "/hiragana"],
  ["katakana", "Katakana", "/katakana"],
  ["kanji", "Kanji", "/kanji"],
  ["vocabulary", "Vocabulary", "/vocabulary"],
  ["grammar", "Grammar", "/grammar"],
  ["counters", "Counters", "/counters"],
  ["readings", "Readings", "/readings"],
  ["conjugator", "Conjugator", "/conjugator"],
];
```

- [ ] **Step 5.2 — Update `App.jsx` — PAGE_TITLES**

Find `PAGE_TITLES` in `frontend/src/App.jsx` and add counters:

```js
const PAGE_TITLES = {
  dashboard: "Dashboard",
  challenges: "Challenges",
  kanji: "Kanji",
  radicals: "Radicals",
  hiragana: "Hiragana",
  katakana: "Katakana",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  counters: "Counters",
  readings: "Readings",
  conjugator: "Conjugator",
  addReading: "Add Reading",
};
```

- [ ] **Step 5.3 — Update `App.jsx` — `getActiveTabFromPathname`**

Add counters route (before `return null`):

```js
function getActiveTabFromPathname(pathname) {
  if (pathname === "/dashboard") return "dashboard";
  if (pathname === "/challenges" || pathname.startsWith("/challenges/")) return "challenges";
  if (pathname === "/radicals") return "radicals";
  if (pathname === "/hiragana") return "hiragana";
  if (pathname === "/katakana") return "katakana";
  if (pathname === "/kanji") return "kanji";
  if (pathname === "/vocabulary") return "vocabulary";
  if (pathname === "/grammar") return "grammar";
  if (pathname === "/counters") return "counters";
  if (pathname === "/readings") return "readings";
  if (pathname === "/readings/add") return "readings";
  if (pathname === "/conjugator") return "conjugator";
  return null;
}
```

- [ ] **Step 5.4 — Update `App.jsx` — `isPracticeTab`**

Find:
```js
const isPracticeTab = ["hiragana", "katakana", "kanji", "vocabulary"].includes(activeTab);
```

Replace with:
```js
const isPracticeTab = ["hiragana", "katakana", "kanji", "vocabulary", "counters"].includes(activeTab);
```

- [ ] **Step 5.5 — Commit**

```bash
git add frontend/src/components/StudyTabs.jsx frontend/src/App.jsx
git commit -m "feat: add counters nav tab and routing"
```

---

## Task 6: Practice mode configuration

**Files:**
- Modify: `frontend/src/components/practiceUtils.js`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 6.1 — Add counters to `getPracticeModes` in `practiceUtils.js`**

Open `frontend/src/components/practiceUtils.js`. In `getPracticeModes`, add a `counters` entry to the `config` object (before the closing `}`):

```js
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
```

- [ ] **Step 6.2 — Add counters to `getPracticeValue` in `practiceUtils.js`**

Find `getPracticeValue`. Add counters to `valueMap`:

```js
counters: {
  counter: item.counter,
  meaning: item.meaning,
  reading: Array.isArray(item.readings) ? item.readings.join(" / ") : "",
},
```

- [ ] **Step 6.3 — Add counters to `getPracticeItemLabel` in `practiceUtils.js`**

Find `getPracticeItemLabel`. Add counters to `labelMap`:

```js
counters: item.counter,
```

- [ ] **Step 6.4 — Add counters to `practiceSourceItems` in `App.jsx`**

Open `frontend/src/App.jsx`. Find the `practiceSourceItems` useMemo block (around line 263). Before `return []` at the end, add:

```js
if (activeTab === "counters") {
  if (practiceSourceMode === "learned") {
    return filteredModuleItems.filter((item) => learnedSet.has(item.id));
  }
  if (practiceSourceMode === "unlearned") {
    return filteredModuleItems.filter((item) => !learnedSet.has(item.id));
  }
  return filteredModuleItems;
}
```

- [ ] **Step 6.5 — Commit**

```bash
git add frontend/src/components/practiceUtils.js frontend/src/App.jsx
git commit -m "feat: add counters practice modes and source items"
```

---

## Task 7: Create CountersView component

**Files:**
- Create: `frontend/src/components/CountersView.jsx`

- [ ] **Step 7.1 — Create the file**

Create `frontend/src/components/CountersView.jsx` with this full content:

```jsx
import { useState } from "react";

const CATEGORIES = ["all", "objects", "animate", "time", "order", "generic"];

function CounterCard({ item, expanded, onToggle }) {
  return (
    <div className="counter-card">
      <div className="counter-card-header">
        <span className="counter-char">{item.counter}</span>
        <div className="counter-header-right">
          <div className="counter-readings">
            {item.readings.map((r, i) => (
              <span key={i} className="counter-reading-badge">{r}</span>
            ))}
          </div>
          <span className={`counter-category-badge counter-category-${item.category}`}>
            {item.category}
          </span>
        </div>
      </div>

      <p className="counter-meaning">{item.meaning}</p>

      <div className="counter-applies-to">
        {item.appliesToJa.map((ja, i) => (
          <span key={i} className="counter-applies-chip">
            <span className="applies-ja">{ja}</span>
            {item.appliesTo[i] && <span className="applies-en">{item.appliesTo[i]}</span>}
          </span>
        ))}
      </div>

      <div className="conjugation-table-wrapper">
        <table className="conjugation-table">
          <thead>
            <tr>
              <th>#</th>
              <th>漢字</th>
              <th>読み方</th>
              <th>Romaji</th>
            </tr>
          </thead>
          <tbody>
            {item.conjugations.map((conj, i) => (
              <tr key={i} className={conj.irregular ? "conj-irregular" : ""}>
                <td className="conj-num">{conj.number === null ? "?" : conj.number}</td>
                <td className="conj-kanji">{conj.kanji}</td>
                <td className={`conj-reading ${conj.irregular ? "conj-reading-irregular" : ""}`}>
                  {conj.reading}
                </td>
                <td className="conj-romaji">{conj.romaji}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {item.notes && (
        <p className="counter-notes">{item.notes}</p>
      )}

      <button className="counter-sentences-toggle" onClick={onToggle}>
        {expanded
          ? "Hide examples"
          : `Show ${item.exampleSentences.length} example${item.exampleSentences.length !== 1 ? "s" : ""}`}
      </button>

      {expanded && (
        <div className="counter-example-sentences">
          {item.exampleSentences.map((s, i) => (
            <div key={i} className="counter-sentence">
              <p className="sentence-ja">{s.japanese}</p>
              <p className="sentence-reading">{s.reading}</p>
              <p className="sentence-en">{s.english}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CountersView({ items, search }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedIds, setExpandedIds] = useState(new Set());

  const filtered = items.filter(
    (item) => activeCategory === "all" || item.category === activeCategory
  );

  function toggleSentences(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="counters-view">
      <div className="counters-category-filter">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`counter-cat-pill ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="counters-empty">
          {search ? `No counters match "${search}"` : "No counters in this category."}
        </p>
      )}

      <div className="counters-grid">
        {filtered.map((item) => (
          <CounterCard
            key={item.id}
            item={item}
            expanded={expandedIds.has(item.id)}
            onToggle={() => toggleSentences(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7.2 — Commit**

```bash
git add frontend/src/components/CountersView.jsx
git commit -m "feat: add CountersView component"
```

---

## Task 8: Wire CountersView into AppContent

**Files:**
- Modify: `frontend/src/components/AppContent.jsx`

- [ ] **Step 8.1 — Import CountersView**

Open `frontend/src/components/AppContent.jsx`. Add import at the top:

```js
import CountersView from "./CountersView";
```

- [ ] **Step 8.2 — Add counters branch**

Find the `if (activeTab === "grammar")` block. Add the counters branch immediately before it:

```js
if (activeTab === "counters") {
  return <CountersView items={visibleItems} search={search} />;
}
```

- [ ] **Step 8.3 — Commit**

```bash
git add frontend/src/components/AppContent.jsx
git commit -m "feat: wire CountersView into AppContent"
```

---

## Task 9: Add counter card CSS

**Files:**
- Modify: `frontend/src/styles.css`

- [ ] **Step 9.1 — Append counter styles**

Open `frontend/src/styles.css` and append to the end of the file:

```css
/* ──────────────────────────────────────────────
   COUNTERS VIEW
────────────────────────────────────────────── */
.counters-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.counters-category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.counter-cat-pill {
  padding: 4px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.counter-cat-pill:hover {
  border-color: var(--border-strong);
}

.counter-cat-pill.active {
  background: var(--active-bg);
  color: var(--active-text);
  border-color: var(--active-bg);
}

.counters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: 20px;
}

@media (max-width: 600px) {
  .counters-grid {
    grid-template-columns: 1fr;
  }
}

.counter-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.counter-card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.counter-char {
  font-size: 3rem;
  line-height: 1;
  font-weight: 700;
  color: var(--text);
  flex-shrink: 0;
}

.counter-header-right {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
}

.counter-readings {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.counter-reading-badge {
  font-size: 0.85rem;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: "Noto Serif JP", serif;
}

.counter-category-badge {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  width: fit-content;
}

.counter-category-objects  { background: #dbeafe; color: #1d4ed8; }
.counter-category-animate  { background: #dcfce7; color: #15803d; }
.counter-category-time     { background: #fef9c3; color: #a16207; }
.counter-category-order    { background: #f3e8ff; color: #7e22ce; }
.counter-category-generic  { background: #f1f5f9; color: #475569; }

.counter-meaning {
  font-size: 0.95rem;
  color: var(--text);
  margin: 0;
}

.counter-applies-to {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.counter-applies-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 6px;
  background: var(--bg);
  border: 1px solid var(--border);
  font-size: 0.82rem;
}

.applies-ja {
  color: var(--text);
  font-family: "Noto Serif JP", serif;
}

.applies-en {
  color: var(--muted);
}

.conjugation-table-wrapper {
  overflow-x: auto;
}

.conjugation-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.conjugation-table th {
  text-align: left;
  padding: 4px 10px;
  border-bottom: 1px solid var(--border);
  color: var(--muted);
  font-weight: 500;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.conjugation-table td {
  padding: 5px 10px;
  border-bottom: 1px solid var(--border);
}

.conjugation-table tbody tr:last-child td {
  border-bottom: none;
}

.conjugation-table .conj-irregular {
  background: var(--learned-bg);
}

.conj-reading-irregular {
  color: var(--learned-text);
  font-weight: 600;
}

.conj-num {
  color: var(--muted);
  width: 36px;
}

.conj-kanji {
  font-family: "Noto Serif JP", serif;
  font-size: 1rem;
}

.conj-reading {
  font-family: "Noto Serif JP", serif;
}

.conj-romaji {
  color: var(--muted);
  font-size: 0.8rem;
}

.counter-notes {
  font-size: 0.82rem;
  color: var(--muted);
  margin: 0;
  padding: 8px 12px;
  background: var(--bg);
  border-radius: 6px;
  border-left: 3px solid var(--border-strong);
}

.counter-sentences-toggle {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 0.82rem;
  color: var(--muted);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, color 0.15s;
  width: fit-content;
}

.counter-sentences-toggle:hover {
  border-color: var(--border-strong);
  color: var(--text);
}

.counter-example-sentences {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 4px;
}

.counter-sentence {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--bg);
  border: 1px solid var(--border);
}

.sentence-ja {
  font-family: "Noto Serif JP", serif;
  font-size: 1rem;
  margin: 0;
  color: var(--text);
}

.sentence-reading {
  font-family: "Noto Serif JP", serif;
  font-size: 0.82rem;
  color: var(--muted);
  margin: 0;
}

.sentence-en {
  font-size: 0.85rem;
  color: var(--text);
  margin: 0;
}

.counters-empty {
  color: var(--muted);
  font-size: 0.9rem;
  padding: 32px 0;
  text-align: center;
}
```

- [ ] **Step 9.2 — Commit**

```bash
git add frontend/src/styles.css
git commit -m "feat: add counter card CSS"
```

---

## Task 10: End-to-end verification

- [ ] **Step 10.1 — Start the full stack**

Terminal 1 (backend):
```bash
cd backend && npm run dev
```

Terminal 2 (frontend):
```bash
cd frontend && npm run dev
```

- [ ] **Step 10.2 — Verify browse view**

Open `http://localhost:5173` in a browser.

Check:
- "Counters" tab appears in the nav between Grammar and Readings
- Count badge appears next to "Counters" showing 23
- Clicking "Counters" navigates to `/counters`
- All 23 counter cards render in the grid
- Category filter pills (All / Objects / Animate / Time / Order / Generic) appear and filter correctly
- Each card shows: large counter character, reading badges, category badge, applies-to chips, full conjugation table (irregular rows highlighted in amber), notes, "Show examples" toggle
- Clicking "Show examples" expands the example sentences
- Search bar filters counters by character, reading, or meaning

- [ ] **Step 10.3 — Verify practice mode**

Click the practice mode toggle (flashcard/quiz icon) on the Counters tab.

Check:
- Practice mode selector appears
- Flash card mode options show: Counter → Meaning, Counter → Reading, Meaning → Counter
- Starting a round shows counter cards as flash cards
- Flipping a card reveals the correct answer

- [ ] **Step 10.4 — Verify page title and nav state**

- Browser tab title shows "Counters"
- The "Counters" nav link shows as active when on `/counters`
- Navigating away and back preserves the tab state

---

## Self-Review

**Spec coverage:**
- ✅ 22+ N5 counters with full data (23 implemented)
- ✅ `readings` array with all phonetic variants surfaced
- ✅ `conjugations` table with `irregular: true` flag
- ✅ `exampleSentences` per counter
- ✅ `notes` on phonetic change rules
- ✅ `appliesTo` + `appliesToJa`
- ✅ `category` field
- ✅ MongoDB collection with indexes
- ✅ `GET /api/counters` with search/level/category filters
- ✅ `counters` count in `GET /api/counts`
- ✅ Nav tab added (between Grammar and Readings)
- ✅ Category filter pills in browse view
- ✅ Conjugation table with irregular highlighting
- ✅ Example sentences toggleable
- ✅ Practice mode wired (flash card + quiz)
- ✅ `getPracticeValue`, `getPracticeItemLabel`, `getPracticeModes` updated

**Type consistency:** `item.readings` (array) used consistently. `item.id` (number) used as practice item ID throughout.

**No placeholders confirmed.**
