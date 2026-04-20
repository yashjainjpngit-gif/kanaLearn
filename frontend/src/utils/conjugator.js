// Japanese verb/adjective conjugator.
// Given a dictionary form + JMdict POS tags (or heuristic fallback), returns
// all major conjugation forms grouped by category. Fully offline, rule-based.

const GODAN_MAP = {
  う: { i: "い", a: "わ", te: "って", ta: "った", e: "え", o: "お" },
  く: { i: "き", a: "か", te: "いて", ta: "いた", e: "け", o: "こ" },
  ぐ: { i: "ぎ", a: "が", te: "いで", ta: "いだ", e: "げ", o: "ご" },
  す: { i: "し", a: "さ", te: "して", ta: "した", e: "せ", o: "そ" },
  つ: { i: "ち", a: "た", te: "って", ta: "った", e: "て", o: "と" },
  ぬ: { i: "に", a: "な", te: "んで", ta: "んだ", e: "ね", o: "の" },
  ぶ: { i: "び", a: "ば", te: "んで", ta: "んだ", e: "べ", o: "ぼ" },
  む: { i: "み", a: "ま", te: "んで", ta: "んだ", e: "め", o: "も" },
  る: { i: "り", a: "ら", te: "って", ta: "った", e: "れ", o: "ろ" },
};

export const SECTIONS = [
  { title: "Polite forms (〜ます)", keys: ["Polite present", "Polite past", "Polite negative", "Polite past negative"] },
  { title: "Plain forms", keys: ["Plain present", "Plain past", "Plain negative", "Plain past negative"] },
  { title: "Te-form & stem uses", keys: ["Te-form", "Tai (want to)", "Mashou (let's)", "Nagara (while)", "Ni (purpose)"] },
  { title: "Advanced", keys: ["Potential", "Volitional (casual)", "Passive", "Causative", "Imperative"] },
  { title: "Conditional", keys: ["Conditional (ba)", "Conditional (tara)"] },
];

export const ADJ_SECTIONS = [
  { title: "Present & past", keys: ["Present (plain)", "Present (polite)", "Past", "Past (polite)"] },
  { title: "Negative", keys: ["Negative", "Negative (polite)", "Past negative", "Past negative (polite)"] },
  { title: "Modifier & adverb", keys: ["Before noun", "Adverb", "Te-form"] },
  { title: "Conditional & others", keys: ["Conditional (ba)", "Conditional (tara)", "Appearance (そう)"] },
];

function detectClass(tags = [], word = "") {
  for (const t of tags) {
    if (t === "Ichidan verb") return "ichidan";
    if (t === "suru verb - included" || t === "suru verb") return "suru";
    if (t === "Kuru verb - special class") return "kuru";
    if (t.startsWith("Godan verb - Iku")) return "godan-iku";
    if (t.startsWith("Godan verb")) return "godan";
    if (t === "adjective (keiyoushi)") return "i-adj";
    if (t.startsWith("adjectival nouns")) return "na-adj";
  }
  if (!word) return null;
  if (word === "する" || word.endsWith("する")) return "suru";
  if (word === "くる" || word === "来る" || word.endsWith("来る")) return "kuru";
  if (word === "いく" || word === "行く") return "godan-iku";
  if (/[あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん]い$/.test(word)) {
    return "i-adj";
  }
  if (word.endsWith("る")) return "ichidan";
  if (/[うくぐすつぬぶむ]$/.test(word)) return "godan";
  return null;
}

function wrap(kana, reading, word) {
  if (!word || word === reading) return { kana };
  const stemLen = reading.length - 1;
  const readingRoot = reading.slice(0, stemLen);
  const wordRoot = word.slice(0, word.length - (reading.length - stemLen));
  if (kana.startsWith(readingRoot) && wordRoot) {
    const tail = kana.slice(readingRoot.length);
    return { kana, kanji: wordRoot + tail };
  }
  return { kana };
}

function conjugateGodan(reading, word, { isIku = false } = {}) {
  const last = reading.slice(-1);
  const root = reading.slice(0, -1);
  const m = GODAN_MAP[last];
  if (!m) return null;
  const stemI = root + m.i;
  const stemA = root + m.a;
  const te = isIku && last === "く" ? root + "って" : root + m.te;
  const ta = isIku && last === "く" ? root + "った" : root + m.ta;

  const raw = {
    "Polite present": stemI + "ます",
    "Polite past": stemI + "ました",
    "Polite negative": stemI + "ません",
    "Polite past negative": stemI + "ませんでした",
    "Plain present": reading,
    "Plain past": ta,
    "Plain negative": stemA + "ない",
    "Plain past negative": stemA + "なかった",
    "Te-form": te,
    "Tai (want to)": stemI + "たい",
    "Mashou (let's)": stemI + "ましょう",
    "Nagara (while)": stemI + "ながら",
    "Ni (purpose)": stemI + "に",
    Potential: root + m.e + "る",
    "Volitional (casual)": root + m.o + "う",
    Passive: stemA + "れる",
    Causative: stemA + "せる",
    Imperative: root + m.e,
    "Conditional (ba)": root + m.e + "ば",
    "Conditional (tara)": ta + "ら",
  };
  const forms = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, wrap(v, reading, word)]));
  return { group: "Group I (Godan / う-verbs)", sections: SECTIONS, forms };
}

function conjugateIchidan(reading, word) {
  if (!reading.endsWith("る")) return null;
  const stem = reading.slice(0, -1);
  const raw = {
    "Polite present": stem + "ます",
    "Polite past": stem + "ました",
    "Polite negative": stem + "ません",
    "Polite past negative": stem + "ませんでした",
    "Plain present": reading,
    "Plain past": stem + "た",
    "Plain negative": stem + "ない",
    "Plain past negative": stem + "なかった",
    "Te-form": stem + "て",
    "Tai (want to)": stem + "たい",
    "Mashou (let's)": stem + "ましょう",
    "Nagara (while)": stem + "ながら",
    "Ni (purpose)": stem + "に",
    Potential: stem + "られる",
    "Volitional (casual)": stem + "よう",
    Passive: stem + "られる",
    Causative: stem + "させる",
    Imperative: stem + "ろ",
    "Conditional (ba)": stem + "れば",
    "Conditional (tara)": stem + "たら",
  };
  const forms = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, wrap(v, reading, word)]));
  return { group: "Group II (Ichidan / る-verbs)", sections: SECTIONS, forms };
}

function prefixForms(baseForms, prefixKana, prefixKanji) {
  return Object.fromEntries(
    Object.entries(baseForms).map(([k, v]) => [
      k,
      {
        kana: prefixKana + v.kana,
        ...(prefixKanji != null ? { kanji: prefixKanji + v.kana } : {}),
      },
    ])
  );
}

function conjugateSuru(reading = "する", word = "する") {
  const prefix = reading.slice(0, -2);
  const wordPrefix = word && word !== reading ? word.slice(0, word.length - 2) : null;
  const base = {
    "Polite present": { kana: "します" },
    "Polite past": { kana: "しました" },
    "Polite negative": { kana: "しません" },
    "Polite past negative": { kana: "しませんでした" },
    "Plain present": { kana: "する" },
    "Plain past": { kana: "した" },
    "Plain negative": { kana: "しない" },
    "Plain past negative": { kana: "しなかった" },
    "Te-form": { kana: "して" },
    "Tai (want to)": { kana: "したい" },
    "Mashou (let's)": { kana: "しましょう" },
    "Nagara (while)": { kana: "しながら" },
    "Ni (purpose)": { kana: "しに" },
    Potential: { kana: "できる" },
    "Volitional (casual)": { kana: "しよう" },
    Passive: { kana: "される" },
    Causative: { kana: "させる" },
    Imperative: { kana: "しろ" },
    "Conditional (ba)": { kana: "すれば" },
    "Conditional (tara)": { kana: "したら" },
  };
  if (!prefix) {
    return { group: "Group III (Irregular — する)", sections: SECTIONS, forms: base };
  }
  return {
    group: "Group III (Irregular — 〜する compound)",
    sections: SECTIONS,
    forms: prefixForms(base, prefix, wordPrefix),
  };
}

function conjugateKuru(reading = "くる", word = "くる") {
  const hasKanji = word === "来る" || word.endsWith("来る");
  const prefix = hasKanji && word.length > 2 ? word.slice(0, -2) : "";
  const k = (form) => (hasKanji ? { kana: form, kanji: prefix + "来" + form.slice(1) } : { kana: form });
  const forms = {
    "Polite present": k("きます"),
    "Polite past": k("きました"),
    "Polite negative": k("きません"),
    "Polite past negative": k("きませんでした"),
    "Plain present": hasKanji ? { kana: "くる", kanji: prefix + "来る" } : { kana: "くる" },
    "Plain past": k("きた"),
    "Plain negative": k("こない"),
    "Plain past negative": k("こなかった"),
    "Te-form": k("きて"),
    "Tai (want to)": k("きたい"),
    "Mashou (let's)": k("きましょう"),
    "Nagara (while)": k("きながら"),
    "Ni (purpose)": k("きに"),
    Potential: k("こられる"),
    "Volitional (casual)": k("こよう"),
    Passive: k("こられる"),
    Causative: k("こさせる"),
    Imperative: k("こい"),
    "Conditional (ba)": hasKanji ? { kana: "くれば", kanji: prefix + "来れば" } : { kana: "くれば" },
    "Conditional (tara)": k("きたら"),
  };
  return { group: "Group III (Irregular — 来る)", sections: SECTIONS, forms };
}

function conjugateIAdj(reading, word) {
  if (!reading.endsWith("い")) return null;
  const isII = reading === "いい";
  const root = isII ? "よ" : reading.slice(0, -1);
  const rawForms = {
    "Present (plain)": reading,
    "Present (polite)": reading + "です",
    Past: root + "かった",
    "Past (polite)": root + "かったです",
    Negative: root + "くない",
    "Negative (polite)": root + "くないです",
    "Past negative": root + "くなかった",
    "Past negative (polite)": root + "くなかったです",
    "Before noun": reading,
    Adverb: root + "く",
    "Te-form": root + "くて",
    "Conditional (ba)": root + "ければ",
    "Conditional (tara)": root + "かったら",
    "Appearance (そう)": root + "そう",
  };
  const forms = Object.fromEntries(Object.entries(rawForms).map(([k, v]) => [k, wrap(v, reading, word)]));
  return { group: "い-adjective", sections: ADJ_SECTIONS, forms };
}

function conjugateNaAdj(reading, word) {
  const root = reading;
  const wordRoot = word && word !== reading ? word : null;
  const k = (suffix) => ({
    kana: root + suffix,
    ...(wordRoot ? { kanji: wordRoot + suffix } : {}),
  });
  const forms = {
    "Present (plain)": k("だ"),
    "Present (polite)": k("です"),
    Past: k("だった"),
    "Past (polite)": k("でした"),
    Negative: k("じゃない"),
    "Negative (polite)": k("じゃないです"),
    "Past negative": k("じゃなかった"),
    "Past negative (polite)": k("じゃなかったです"),
    "Before noun": k("な"),
    Adverb: k("に"),
    "Te-form": k("で"),
    "Conditional (ba)": k("であれば"),
    "Conditional (tara)": k("だったら"),
    "Appearance (そう)": k("そう"),
  };
  return { group: "な-adjective", sections: ADJ_SECTIONS, forms };
}

export function conjugate({ word = "", reading = "", tags = [] } = {}) {
  const base = reading || word;
  if (!base) return null;
  const cls = detectClass(tags, reading || word);
  if (!cls) {
    return {
      error: "Could not determine the verb/adjective class. Try a common dictionary-form word like 食べる or 飲む.",
    };
  }
  switch (cls) {
    case "godan":
      return conjugateGodan(base, word);
    case "godan-iku":
      return conjugateGodan(base, word, { isIku: true });
    case "ichidan":
      return conjugateIchidan(base, word);
    case "suru":
      return conjugateSuru(base, word);
    case "kuru":
      return conjugateKuru(base, word);
    case "i-adj":
      return conjugateIAdj(base, word);
    case "na-adj":
      return conjugateNaAdj(base, word);
    default:
      return null;
  }
}
