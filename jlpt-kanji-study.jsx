import { useState, useEffect, useCallback, useMemo, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════════
   JLPT N5 & N4 KANJI + VOCABULARY STUDY APP
   Features: Stroke order (via KanjiVG API), N4/N5 vocab tabs, quiz, flashcards
   ═══════════════════════════════════════════════════════════════════════════════ */

// ─── Kanji Data ────────────────────────────────────────────────────────────────
const KANJI_DATA = {
  "Numbers 数": [
    { kanji: "一", meaning: "One", onyomi: "イチ", kunyomi: "ひと(つ)", example: "一つ", exReading: "ひとつ", exMeaning: "one thing", level: "N5", strokes: 1 },
    { kanji: "二", meaning: "Two", onyomi: "ニ", kunyomi: "ふた(つ)", example: "二つ", exReading: "ふたつ", exMeaning: "two things", level: "N5", strokes: 2 },
    { kanji: "三", meaning: "Three", onyomi: "サン", kunyomi: "み(つ)", example: "三つ", exReading: "みっつ", exMeaning: "three things", level: "N5", strokes: 3 },
    { kanji: "四", meaning: "Four", onyomi: "シ", kunyomi: "よ(つ)", example: "四つ", exReading: "よっつ", exMeaning: "four things", level: "N5", strokes: 5 },
    { kanji: "五", meaning: "Five", onyomi: "ゴ", kunyomi: "いつ(つ)", example: "五つ", exReading: "いつつ", exMeaning: "five things", level: "N5", strokes: 4 },
    { kanji: "六", meaning: "Six", onyomi: "ロク", kunyomi: "む(つ)", example: "六つ", exReading: "むっつ", exMeaning: "six things", level: "N5", strokes: 4 },
    { kanji: "七", meaning: "Seven", onyomi: "シチ", kunyomi: "なな(つ)", example: "七つ", exReading: "ななつ", exMeaning: "seven things", level: "N5", strokes: 2 },
    { kanji: "八", meaning: "Eight", onyomi: "ハチ", kunyomi: "や(つ)", example: "八つ", exReading: "やっつ", exMeaning: "eight things", level: "N5", strokes: 2 },
    { kanji: "九", meaning: "Nine", onyomi: "キュウ", kunyomi: "ここの(つ)", example: "九つ", exReading: "ここのつ", exMeaning: "nine things", level: "N5", strokes: 2 },
    { kanji: "十", meaning: "Ten", onyomi: "ジュウ", kunyomi: "とお", example: "十分", exReading: "じゅうぶん", exMeaning: "enough", level: "N5", strokes: 2 },
    { kanji: "百", meaning: "Hundred", onyomi: "ヒャク", kunyomi: "—", example: "百円", exReading: "ひゃくえん", exMeaning: "100 yen", level: "N5", strokes: 6 },
    { kanji: "千", meaning: "Thousand", onyomi: "セン", kunyomi: "ち", example: "千円", exReading: "せんえん", exMeaning: "1000 yen", level: "N5", strokes: 3 },
    { kanji: "万", meaning: "Ten Thousand", onyomi: "マン", kunyomi: "—", example: "一万", exReading: "いちまん", exMeaning: "ten thousand", level: "N5", strokes: 3 },
  ],
  "Time 暦": [
    { kanji: "日", meaning: "Day / Sun", onyomi: "ニチ・ジツ", kunyomi: "ひ・か", example: "毎日", exReading: "まいにち", exMeaning: "every day", level: "N5", strokes: 4 },
    { kanji: "月", meaning: "Month / Moon", onyomi: "ゲツ・ガツ", kunyomi: "つき", example: "月曜日", exReading: "げつようび", exMeaning: "Monday", level: "N5", strokes: 4 },
    { kanji: "年", meaning: "Year", onyomi: "ネン", kunyomi: "とし", example: "今年", exReading: "ことし", exMeaning: "this year", level: "N5", strokes: 6 },
    { kanji: "週", meaning: "Week", onyomi: "シュウ", kunyomi: "—", example: "今週", exReading: "こんしゅう", exMeaning: "this week", level: "N4", strokes: 11 },
    { kanji: "時", meaning: "Time / Hour", onyomi: "ジ", kunyomi: "とき", example: "時間", exReading: "じかん", exMeaning: "time", level: "N5", strokes: 10 },
    { kanji: "分", meaning: "Minute", onyomi: "ブン・フン", kunyomi: "わ(ける)", example: "十分", exReading: "じゅっぷん", exMeaning: "ten minutes", level: "N5", strokes: 4 },
    { kanji: "半", meaning: "Half", onyomi: "ハン", kunyomi: "なか(ば)", example: "半分", exReading: "はんぶん", exMeaning: "half", level: "N5", strokes: 5 },
    { kanji: "今", meaning: "Now", onyomi: "コン・キン", kunyomi: "いま", example: "今日", exReading: "きょう", exMeaning: "today", level: "N5", strokes: 4 },
    { kanji: "毎", meaning: "Every", onyomi: "マイ", kunyomi: "—", example: "毎朝", exReading: "まいあさ", exMeaning: "every morning", level: "N5", strokes: 6 },
    { kanji: "午", meaning: "Noon", onyomi: "ゴ", kunyomi: "—", example: "午後", exReading: "ごご", exMeaning: "afternoon", level: "N5", strokes: 4 },
    { kanji: "前", meaning: "Before", onyomi: "ゼン", kunyomi: "まえ", example: "前日", exReading: "ぜんじつ", exMeaning: "the day before", level: "N5", strokes: 9 },
    { kanji: "後", meaning: "After", onyomi: "ゴ・コウ", kunyomi: "あと・うし(ろ)", example: "午後", exReading: "ごご", exMeaning: "afternoon", level: "N5", strokes: 9 },
    { kanji: "先", meaning: "Previous", onyomi: "セン", kunyomi: "さき", example: "先週", exReading: "せんしゅう", exMeaning: "last week", level: "N5", strokes: 6 },
    { kanji: "来", meaning: "Come / Next", onyomi: "ライ", kunyomi: "く(る)", example: "来月", exReading: "らいげつ", exMeaning: "next month", level: "N5", strokes: 7 },
    { kanji: "去", meaning: "Past", onyomi: "キョ・コ", kunyomi: "さ(る)", example: "去年", exReading: "きょねん", exMeaning: "last year", level: "N4", strokes: 5 },
  ],
  "Directions 方": [
    { kanji: "上", meaning: "Up / Above", onyomi: "ジョウ", kunyomi: "うえ", example: "上手", exReading: "じょうず", exMeaning: "skillful", level: "N5", strokes: 3 },
    { kanji: "下", meaning: "Down / Below", onyomi: "カ・ゲ", kunyomi: "した", example: "下手", exReading: "へた", exMeaning: "unskillful", level: "N5", strokes: 3 },
    { kanji: "左", meaning: "Left", onyomi: "サ", kunyomi: "ひだり", example: "左手", exReading: "ひだりて", exMeaning: "left hand", level: "N5", strokes: 5 },
    { kanji: "右", meaning: "Right", onyomi: "ウ・ユウ", kunyomi: "みぎ", example: "右手", exReading: "みぎて", exMeaning: "right hand", level: "N5", strokes: 5 },
    { kanji: "中", meaning: "Middle", onyomi: "チュウ", kunyomi: "なか", example: "中学", exReading: "ちゅうがく", exMeaning: "middle school", level: "N5", strokes: 4 },
    { kanji: "外", meaning: "Outside", onyomi: "ガイ・ゲ", kunyomi: "そと", example: "外国", exReading: "がいこく", exMeaning: "foreign country", level: "N5", strokes: 5 },
    { kanji: "東", meaning: "East", onyomi: "トウ", kunyomi: "ひがし", example: "東京", exReading: "とうきょう", exMeaning: "Tokyo", level: "N5", strokes: 8 },
    { kanji: "西", meaning: "West", onyomi: "セイ・サイ", kunyomi: "にし", example: "西口", exReading: "にしぐち", exMeaning: "west exit", level: "N5", strokes: 6 },
    { kanji: "南", meaning: "South", onyomi: "ナン", kunyomi: "みなみ", example: "南口", exReading: "みなみぐち", exMeaning: "south exit", level: "N5", strokes: 9 },
    { kanji: "北", meaning: "North", onyomi: "ホク", kunyomi: "きた", example: "北海道", exReading: "ほっかいどう", exMeaning: "Hokkaido", level: "N5", strokes: 5 },
    { kanji: "内", meaning: "Inside", onyomi: "ナイ・ダイ", kunyomi: "うち", example: "国内", exReading: "こくない", exMeaning: "domestic", level: "N4", strokes: 4 },
    { kanji: "間", meaning: "Between", onyomi: "カン・ケン", kunyomi: "あいだ", example: "時間", exReading: "じかん", exMeaning: "time", level: "N5", strokes: 12 },
    { kanji: "近", meaning: "Near", onyomi: "キン", kunyomi: "ちか(い)", example: "近く", exReading: "ちかく", exMeaning: "nearby", level: "N4", strokes: 7 },
    { kanji: "遠", meaning: "Far", onyomi: "エン", kunyomi: "とお(い)", example: "遠い", exReading: "とおい", exMeaning: "far away", level: "N4", strokes: 13 },
  ],
  "People 衆": [
    { kanji: "人", meaning: "Person", onyomi: "ジン・ニン", kunyomi: "ひと", example: "日本人", exReading: "にほんじん", exMeaning: "Japanese person", level: "N5", strokes: 2 },
    { kanji: "男", meaning: "Man", onyomi: "ダン", kunyomi: "おとこ", example: "男の子", exReading: "おとこのこ", exMeaning: "boy", level: "N5", strokes: 7 },
    { kanji: "女", meaning: "Woman", onyomi: "ジョ", kunyomi: "おんな", example: "女の子", exReading: "おんなのこ", exMeaning: "girl", level: "N5", strokes: 3 },
    { kanji: "子", meaning: "Child", onyomi: "シ・ス", kunyomi: "こ", example: "子供", exReading: "こども", exMeaning: "child", level: "N5", strokes: 3 },
    { kanji: "父", meaning: "Father", onyomi: "フ", kunyomi: "ちち", example: "お父さん", exReading: "おとうさん", exMeaning: "father", level: "N5", strokes: 4 },
    { kanji: "母", meaning: "Mother", onyomi: "ボ", kunyomi: "はは", example: "お母さん", exReading: "おかあさん", exMeaning: "mother", level: "N5", strokes: 5 },
    { kanji: "友", meaning: "Friend", onyomi: "ユウ", kunyomi: "とも", example: "友達", exReading: "ともだち", exMeaning: "friend", level: "N5", strokes: 4 },
    { kanji: "生", meaning: "Life / Birth", onyomi: "セイ・ショウ", kunyomi: "い(きる)", example: "学生", exReading: "がくせい", exMeaning: "student", level: "N5", strokes: 5 },
    { kanji: "名", meaning: "Name", onyomi: "メイ・ミョウ", kunyomi: "な", example: "名前", exReading: "なまえ", exMeaning: "name", level: "N5", strokes: 6 },
    { kanji: "私", meaning: "I / Private", onyomi: "シ", kunyomi: "わたし", example: "私立", exReading: "しりつ", exMeaning: "private", level: "N4", strokes: 7 },
    { kanji: "彼", meaning: "He / That", onyomi: "ヒ", kunyomi: "かれ", example: "彼女", exReading: "かのじょ", exMeaning: "she / girlfriend", level: "N4", strokes: 8 },
    { kanji: "何", meaning: "What", onyomi: "カ", kunyomi: "なに・なん", example: "何時", exReading: "なんじ", exMeaning: "what time", level: "N5", strokes: 7 },
  ],
  "School 習": [
    { kanji: "学", meaning: "Study", onyomi: "ガク", kunyomi: "まな(ぶ)", example: "大学", exReading: "だいがく", exMeaning: "university", level: "N5", strokes: 8 },
    { kanji: "校", meaning: "School", onyomi: "コウ", kunyomi: "—", example: "学校", exReading: "がっこう", exMeaning: "school", level: "N5", strokes: 10 },
    { kanji: "文", meaning: "Writing", onyomi: "ブン・モン", kunyomi: "ふみ", example: "文化", exReading: "ぶんか", exMeaning: "culture", level: "N4", strokes: 4 },
    { kanji: "字", meaning: "Character", onyomi: "ジ", kunyomi: "あざ", example: "漢字", exReading: "かんじ", exMeaning: "kanji", level: "N4", strokes: 6 },
    { kanji: "本", meaning: "Book", onyomi: "ホン", kunyomi: "もと", example: "日本", exReading: "にほん", exMeaning: "Japan", level: "N5", strokes: 5 },
    { kanji: "読", meaning: "Read", onyomi: "ドク", kunyomi: "よ(む)", example: "読書", exReading: "どくしょ", exMeaning: "reading", level: "N5", strokes: 14 },
    { kanji: "書", meaning: "Write", onyomi: "ショ", kunyomi: "か(く)", example: "図書館", exReading: "としょかん", exMeaning: "library", level: "N5", strokes: 10 },
    { kanji: "話", meaning: "Talk", onyomi: "ワ", kunyomi: "はな(す)", example: "電話", exReading: "でんわ", exMeaning: "telephone", level: "N5", strokes: 13 },
    { kanji: "聞", meaning: "Hear / Ask", onyomi: "ブン・モン", kunyomi: "き(く)", example: "新聞", exReading: "しんぶん", exMeaning: "newspaper", level: "N5", strokes: 14 },
    { kanji: "語", meaning: "Language", onyomi: "ゴ", kunyomi: "かた(る)", example: "日本語", exReading: "にほんご", exMeaning: "Japanese", level: "N5", strokes: 14 },
    { kanji: "勉", meaning: "Effort", onyomi: "ベン", kunyomi: "—", example: "勉強", exReading: "べんきょう", exMeaning: "study", level: "N4", strokes: 10 },
    { kanji: "強", meaning: "Strong", onyomi: "キョウ", kunyomi: "つよ(い)", example: "勉強", exReading: "べんきょう", exMeaning: "study", level: "N4", strokes: 11 },
  ],
  "Actions 動": [
    { kanji: "行", meaning: "Go", onyomi: "コウ・ギョウ", kunyomi: "い(く)", example: "旅行", exReading: "りょこう", exMeaning: "travel", level: "N5", strokes: 6 },
    { kanji: "帰", meaning: "Return", onyomi: "キ", kunyomi: "かえ(る)", example: "帰国", exReading: "きこく", exMeaning: "return home", level: "N4", strokes: 10 },
    { kanji: "食", meaning: "Eat", onyomi: "ショク", kunyomi: "た(べる)", example: "食べる", exReading: "たべる", exMeaning: "to eat", level: "N5", strokes: 9 },
    { kanji: "飲", meaning: "Drink", onyomi: "イン", kunyomi: "の(む)", example: "飲み物", exReading: "のみもの", exMeaning: "beverage", level: "N5", strokes: 12 },
    { kanji: "見", meaning: "See", onyomi: "ケン", kunyomi: "み(る)", example: "花見", exReading: "はなみ", exMeaning: "flower viewing", level: "N5", strokes: 7 },
    { kanji: "作", meaning: "Make", onyomi: "サク・サ", kunyomi: "つく(る)", example: "作文", exReading: "さくぶん", exMeaning: "composition", level: "N4", strokes: 7 },
    { kanji: "使", meaning: "Use", onyomi: "シ", kunyomi: "つか(う)", example: "大使", exReading: "たいし", exMeaning: "ambassador", level: "N4", strokes: 8 },
    { kanji: "買", meaning: "Buy", onyomi: "バイ", kunyomi: "か(う)", example: "買い物", exReading: "かいもの", exMeaning: "shopping", level: "N5", strokes: 12 },
    { kanji: "待", meaning: "Wait", onyomi: "タイ", kunyomi: "ま(つ)", example: "期待", exReading: "きたい", exMeaning: "expectation", level: "N4", strokes: 9 },
    { kanji: "持", meaning: "Hold", onyomi: "ジ", kunyomi: "も(つ)", example: "気持ち", exReading: "きもち", exMeaning: "feeling", level: "N4", strokes: 9 },
  ],
  "Places 所": [
    { kanji: "家", meaning: "House", onyomi: "カ・ケ", kunyomi: "いえ・や", example: "家族", exReading: "かぞく", exMeaning: "family", level: "N4", strokes: 10 },
    { kanji: "店", meaning: "Shop", onyomi: "テン", kunyomi: "みせ", example: "喫茶店", exReading: "きっさてん", exMeaning: "café", level: "N4", strokes: 8 },
    { kanji: "駅", meaning: "Station", onyomi: "エキ", kunyomi: "—", example: "東京駅", exReading: "とうきょうえき", exMeaning: "Tokyo Station", level: "N4", strokes: 14 },
    { kanji: "国", meaning: "Country", onyomi: "コク", kunyomi: "くに", example: "外国", exReading: "がいこく", exMeaning: "foreign country", level: "N5", strokes: 8 },
    { kanji: "会", meaning: "Meet", onyomi: "カイ・エ", kunyomi: "あ(う)", example: "会社", exReading: "かいしゃ", exMeaning: "company", level: "N4", strokes: 6 },
    { kanji: "社", meaning: "Company", onyomi: "シャ", kunyomi: "やしろ", example: "神社", exReading: "じんじゃ", exMeaning: "shrine", level: "N4", strokes: 7 },
    { kanji: "部", meaning: "Part / Club", onyomi: "ブ", kunyomi: "—", example: "全部", exReading: "ぜんぶ", exMeaning: "all", level: "N4", strokes: 11 },
    { kanji: "屋", meaning: "Shop / Roof", onyomi: "オク", kunyomi: "や", example: "部屋", exReading: "へや", exMeaning: "room", level: "N4", strokes: 9 },
    { kanji: "町", meaning: "Town", onyomi: "チョウ", kunyomi: "まち", example: "町中", exReading: "まちなか", exMeaning: "downtown", level: "N4", strokes: 7 },
    { kanji: "市", meaning: "City", onyomi: "シ", kunyomi: "いち", example: "市場", exReading: "いちば", exMeaning: "market", level: "N4", strokes: 5 },
    { kanji: "村", meaning: "Village", onyomi: "ソン", kunyomi: "むら", example: "村人", exReading: "むらびと", exMeaning: "villager", level: "N4", strokes: 7 },
  ],
  "Nature 自": [
    { kanji: "山", meaning: "Mountain", onyomi: "サン", kunyomi: "やま", example: "富士山", exReading: "ふじさん", exMeaning: "Mt. Fuji", level: "N5", strokes: 3 },
    { kanji: "川", meaning: "River", onyomi: "セン", kunyomi: "かわ", example: "小川", exReading: "おがわ", exMeaning: "stream", level: "N5", strokes: 3 },
    { kanji: "木", meaning: "Tree", onyomi: "モク・ボク", kunyomi: "き", example: "木曜日", exReading: "もくようび", exMeaning: "Thursday", level: "N5", strokes: 4 },
    { kanji: "林", meaning: "Grove", onyomi: "リン", kunyomi: "はやし", example: "林業", exReading: "りんぎょう", exMeaning: "forestry", level: "N4", strokes: 8 },
    { kanji: "森", meaning: "Forest", onyomi: "シン", kunyomi: "もり", example: "森林", exReading: "しんりん", exMeaning: "forest", level: "N4", strokes: 12 },
    { kanji: "石", meaning: "Stone", onyomi: "セキ", kunyomi: "いし", example: "石橋", exReading: "いしばし", exMeaning: "stone bridge", level: "N4", strokes: 5 },
    { kanji: "空", meaning: "Sky / Empty", onyomi: "クウ", kunyomi: "そら", example: "空気", exReading: "くうき", exMeaning: "air", level: "N5", strokes: 8 },
    { kanji: "海", meaning: "Sea", onyomi: "カイ", kunyomi: "うみ", example: "海外", exReading: "かいがい", exMeaning: "overseas", level: "N4", strokes: 9 },
    { kanji: "花", meaning: "Flower", onyomi: "カ", kunyomi: "はな", example: "花見", exReading: "はなみ", exMeaning: "flower viewing", level: "N5", strokes: 7 },
    { kanji: "草", meaning: "Grass", onyomi: "ソウ", kunyomi: "くさ", example: "草原", exReading: "そうげん", exMeaning: "grassland", level: "N4", strokes: 9 },
    { kanji: "天", meaning: "Heaven", onyomi: "テン", kunyomi: "あめ", example: "天気", exReading: "てんき", exMeaning: "weather", level: "N5", strokes: 4 },
    { kanji: "気", meaning: "Spirit", onyomi: "キ・ケ", kunyomi: "—", example: "元気", exReading: "げんき", exMeaning: "healthy", level: "N5", strokes: 6 },
    { kanji: "雨", meaning: "Rain", onyomi: "ウ", kunyomi: "あめ", example: "大雨", exReading: "おおあめ", exMeaning: "heavy rain", level: "N5", strokes: 8 },
    { kanji: "雪", meaning: "Snow", onyomi: "セツ", kunyomi: "ゆき", example: "雪山", exReading: "ゆきやま", exMeaning: "snowy mountain", level: "N4", strokes: 11 },
    { kanji: "風", meaning: "Wind", onyomi: "フウ・フ", kunyomi: "かぜ", example: "台風", exReading: "たいふう", exMeaning: "typhoon", level: "N4", strokes: 9 },
  ],
  "Transport 運": [
    { kanji: "車", meaning: "Car", onyomi: "シャ", kunyomi: "くるま", example: "自転車", exReading: "じてんしゃ", exMeaning: "bicycle", level: "N5", strokes: 7 },
    { kanji: "電", meaning: "Electricity", onyomi: "デン", kunyomi: "—", example: "電車", exReading: "でんしゃ", exMeaning: "train", level: "N5", strokes: 13 },
    { kanji: "道", meaning: "Road", onyomi: "ドウ", kunyomi: "みち", example: "道路", exReading: "どうろ", exMeaning: "road", level: "N4", strokes: 12 },
    { kanji: "線", meaning: "Line", onyomi: "セン", kunyomi: "—", example: "新幹線", exReading: "しんかんせん", exMeaning: "bullet train", level: "N4", strokes: 15 },
    { kanji: "鉄", meaning: "Iron", onyomi: "テツ", kunyomi: "—", example: "地下鉄", exReading: "ちかてつ", exMeaning: "subway", level: "N4", strokes: 13 },
    { kanji: "旅", meaning: "Travel", onyomi: "リョ", kunyomi: "たび", example: "旅行", exReading: "りょこう", exMeaning: "travel", level: "N4", strokes: 10 },
    { kanji: "通", meaning: "Pass", onyomi: "ツウ", kunyomi: "とお(る)", example: "交通", exReading: "こうつう", exMeaning: "traffic", level: "N4", strokes: 10 },
    { kanji: "歩", meaning: "Walk", onyomi: "ホ・ブ", kunyomi: "ある(く)", example: "散歩", exReading: "さんぽ", exMeaning: "stroll", level: "N4", strokes: 8 },
  ],
  "Body 身": [
    { kanji: "体", meaning: "Body", onyomi: "タイ・テイ", kunyomi: "からだ", example: "体育", exReading: "たいいく", exMeaning: "P.E.", level: "N4", strokes: 7 },
    { kanji: "目", meaning: "Eye", onyomi: "モク", kunyomi: "め", example: "目的", exReading: "もくてき", exMeaning: "purpose", level: "N4", strokes: 5 },
    { kanji: "耳", meaning: "Ear", onyomi: "ジ", kunyomi: "みみ", example: "耳鼻科", exReading: "じびか", exMeaning: "ENT clinic", level: "N4", strokes: 6 },
    { kanji: "手", meaning: "Hand", onyomi: "シュ", kunyomi: "て", example: "上手", exReading: "じょうず", exMeaning: "skillful", level: "N5", strokes: 4 },
    { kanji: "足", meaning: "Foot / Leg", onyomi: "ソク", kunyomi: "あし", example: "不足", exReading: "ふそく", exMeaning: "shortage", level: "N5", strokes: 7 },
    { kanji: "口", meaning: "Mouth", onyomi: "コウ・ク", kunyomi: "くち", example: "入口", exReading: "いりぐち", exMeaning: "entrance", level: "N5", strokes: 3 },
    { kanji: "心", meaning: "Heart / Mind", onyomi: "シン", kunyomi: "こころ", example: "安心", exReading: "あんしん", exMeaning: "relief", level: "N4", strokes: 4 },
    { kanji: "元", meaning: "Origin", onyomi: "ゲン・ガン", kunyomi: "もと", example: "元気", exReading: "げんき", exMeaning: "healthy", level: "N5", strokes: 4 },
    { kanji: "病", meaning: "Illness", onyomi: "ビョウ", kunyomi: "や(む)", example: "病院", exReading: "びょういん", exMeaning: "hospital", level: "N4", strokes: 10 },
  ],
  "Food 膳": [
    { kanji: "米", meaning: "Rice", onyomi: "ベイ・マイ", kunyomi: "こめ", example: "米国", exReading: "べいこく", exMeaning: "America", level: "N4", strokes: 6 },
    { kanji: "茶", meaning: "Tea", onyomi: "チャ・サ", kunyomi: "—", example: "お茶", exReading: "おちゃ", exMeaning: "tea", level: "N4", strokes: 9 },
    { kanji: "酒", meaning: "Alcohol", onyomi: "シュ", kunyomi: "さけ", example: "日本酒", exReading: "にほんしゅ", exMeaning: "sake", level: "N4", strokes: 10 },
    { kanji: "魚", meaning: "Fish", onyomi: "ギョ", kunyomi: "さかな", example: "金魚", exReading: "きんぎょ", exMeaning: "goldfish", level: "N5", strokes: 11 },
    { kanji: "肉", meaning: "Meat", onyomi: "ニク", kunyomi: "—", example: "牛肉", exReading: "ぎゅうにく", exMeaning: "beef", level: "N4", strokes: 6 },
    { kanji: "野", meaning: "Field", onyomi: "ヤ", kunyomi: "の", example: "野菜", exReading: "やさい", exMeaning: "vegetables", level: "N4", strokes: 11 },
    { kanji: "菜", meaning: "Vegetable", onyomi: "サイ", kunyomi: "な", example: "野菜", exReading: "やさい", exMeaning: "vegetables", level: "N4", strokes: 11 },
    { kanji: "果", meaning: "Fruit", onyomi: "カ", kunyomi: "は(たす)", example: "果物", exReading: "くだもの", exMeaning: "fruit", level: "N4", strokes: 8 },
    { kanji: "料", meaning: "Fee / Material", onyomi: "リョウ", kunyomi: "—", example: "料理", exReading: "りょうり", exMeaning: "cooking", level: "N4", strokes: 10 },
    { kanji: "理", meaning: "Reason", onyomi: "リ", kunyomi: "—", example: "無理", exReading: "むり", exMeaning: "impossible", level: "N4", strokes: 11 },
  ],
  "Adjectives 形": [
    { kanji: "大", meaning: "Big", onyomi: "ダイ・タイ", kunyomi: "おお(きい)", example: "大人", exReading: "おとな", exMeaning: "adult", level: "N5", strokes: 3 },
    { kanji: "小", meaning: "Small", onyomi: "ショウ", kunyomi: "ちい(さい)", example: "小学校", exReading: "しょうがっこう", exMeaning: "elementary", level: "N5", strokes: 3 },
    { kanji: "高", meaning: "High / Expensive", onyomi: "コウ", kunyomi: "たか(い)", example: "高校", exReading: "こうこう", exMeaning: "high school", level: "N5", strokes: 10 },
    { kanji: "安", meaning: "Cheap / Peace", onyomi: "アン", kunyomi: "やす(い)", example: "安全", exReading: "あんぜん", exMeaning: "safety", level: "N5", strokes: 6 },
    { kanji: "新", meaning: "New", onyomi: "シン", kunyomi: "あたら(しい)", example: "新聞", exReading: "しんぶん", exMeaning: "newspaper", level: "N5", strokes: 13 },
    { kanji: "古", meaning: "Old (things)", onyomi: "コ", kunyomi: "ふる(い)", example: "中古", exReading: "ちゅうこ", exMeaning: "secondhand", level: "N5", strokes: 5 },
    { kanji: "長", meaning: "Long", onyomi: "チョウ", kunyomi: "なが(い)", example: "社長", exReading: "しゃちょう", exMeaning: "president", level: "N5", strokes: 8 },
    { kanji: "短", meaning: "Short", onyomi: "タン", kunyomi: "みじか(い)", example: "短期", exReading: "たんき", exMeaning: "short term", level: "N4", strokes: 12 },
    { kanji: "多", meaning: "Many", onyomi: "タ", kunyomi: "おお(い)", example: "多分", exReading: "たぶん", exMeaning: "probably", level: "N5", strokes: 6 },
    { kanji: "少", meaning: "Few", onyomi: "ショウ", kunyomi: "すく(ない)", example: "少し", exReading: "すこし", exMeaning: "a little", level: "N5", strokes: 4 },
    { kanji: "早", meaning: "Early", onyomi: "ソウ・サッ", kunyomi: "はや(い)", example: "早朝", exReading: "そうちょう", exMeaning: "early morning", level: "N4", strokes: 6 },
    { kanji: "遅", meaning: "Late / Slow", onyomi: "チ", kunyomi: "おそ(い)", example: "遅刻", exReading: "ちこく", exMeaning: "being late", level: "N4", strokes: 12 },
  ],
  "Work 働": [
    { kanji: "仕", meaning: "Serve", onyomi: "シ・ジ", kunyomi: "つか(える)", example: "仕事", exReading: "しごと", exMeaning: "work", level: "N4", strokes: 5 },
    { kanji: "事", meaning: "Thing / Matter", onyomi: "ジ・ズ", kunyomi: "こと", example: "食事", exReading: "しょくじ", exMeaning: "meal", level: "N4", strokes: 8 },
    { kanji: "業", meaning: "Business", onyomi: "ギョウ・ゴウ", kunyomi: "わざ", example: "授業", exReading: "じゅぎょう", exMeaning: "class", level: "N4", strokes: 13 },
    { kanji: "工", meaning: "Construction", onyomi: "コウ・ク", kunyomi: "—", example: "工場", exReading: "こうじょう", exMeaning: "factory", level: "N4", strokes: 3 },
    { kanji: "員", meaning: "Member", onyomi: "イン", kunyomi: "—", example: "会社員", exReading: "かいしゃいん", exMeaning: "office worker", level: "N4", strokes: 10 },
    { kanji: "同", meaning: "Same", onyomi: "ドウ", kunyomi: "おな(じ)", example: "同じ", exReading: "おなじ", exMeaning: "same", level: "N4", strokes: 6 },
    { kanji: "主", meaning: "Main / Master", onyomi: "シュ・ス", kunyomi: "ぬし", example: "主人", exReading: "しゅじん", exMeaning: "husband", level: "N4", strokes: 5 },
  ],
  "Money 銭": [
    { kanji: "円", meaning: "Yen / Circle", onyomi: "エン", kunyomi: "まる(い)", example: "百円", exReading: "ひゃくえん", exMeaning: "100 yen", level: "N5", strokes: 4 },
    { kanji: "貸", meaning: "Lend", onyomi: "タイ", kunyomi: "か(す)", example: "貸す", exReading: "かす", exMeaning: "to lend", level: "N4", strokes: 12 },
    { kanji: "借", meaning: "Borrow", onyomi: "シャク", kunyomi: "か(りる)", example: "借りる", exReading: "かりる", exMeaning: "to borrow", level: "N4", strokes: 10 },
    { kanji: "費", meaning: "Cost", onyomi: "ヒ", kunyomi: "つい(やす)", example: "学費", exReading: "がくひ", exMeaning: "tuition", level: "N4", strokes: 12 },
    { kanji: "値", meaning: "Value / Price", onyomi: "チ", kunyomi: "ね・あたい", example: "値段", exReading: "ねだん", exMeaning: "price", level: "N4", strokes: 10 },
  ],
  "Verbs 述": [
    { kanji: "思", meaning: "Think", onyomi: "シ", kunyomi: "おも(う)", example: "思い出", exReading: "おもいで", exMeaning: "memory", level: "N4", strokes: 9 },
    { kanji: "知", meaning: "Know", onyomi: "チ", kunyomi: "し(る)", example: "知識", exReading: "ちしき", exMeaning: "knowledge", level: "N4", strokes: 8 },
    { kanji: "考", meaning: "Consider", onyomi: "コウ", kunyomi: "かんが(える)", example: "考える", exReading: "かんがえる", exMeaning: "to think", level: "N4", strokes: 6 },
    { kanji: "起", meaning: "Wake / Rise", onyomi: "キ", kunyomi: "お(きる)", example: "起きる", exReading: "おきる", exMeaning: "to wake up", level: "N4", strokes: 10 },
    { kanji: "寝", meaning: "Sleep", onyomi: "シン", kunyomi: "ね(る)", example: "寝室", exReading: "しんしつ", exMeaning: "bedroom", level: "N4", strokes: 13 },
    { kanji: "住", meaning: "Live / Reside", onyomi: "ジュウ", kunyomi: "す(む)", example: "住所", exReading: "じゅうしょ", exMeaning: "address", level: "N4", strokes: 7 },
    { kanji: "開", meaning: "Open", onyomi: "カイ", kunyomi: "あ(ける)", example: "開始", exReading: "かいし", exMeaning: "start", level: "N4", strokes: 12 },
    { kanji: "閉", meaning: "Close", onyomi: "ヘイ", kunyomi: "し(める)", example: "閉店", exReading: "へいてん", exMeaning: "closing", level: "N4", strokes: 11 },
    { kanji: "始", meaning: "Begin", onyomi: "シ", kunyomi: "はじ(める)", example: "開始", exReading: "かいし", exMeaning: "start", level: "N4", strokes: 8 },
    { kanji: "終", meaning: "End", onyomi: "シュウ", kunyomi: "お(わる)", example: "終了", exReading: "しゅうりょう", exMeaning: "finish", level: "N4", strokes: 11 },
  ],
  "Colors 彩": [
    { kanji: "白", meaning: "White", onyomi: "ハク", kunyomi: "しろ(い)", example: "白い", exReading: "しろい", exMeaning: "white", level: "N5", strokes: 5 },
    { kanji: "黒", meaning: "Black", onyomi: "コク", kunyomi: "くろ(い)", example: "黒い", exReading: "くろい", exMeaning: "black", level: "N4", strokes: 11 },
    { kanji: "赤", meaning: "Red", onyomi: "セキ", kunyomi: "あか(い)", example: "赤ちゃん", exReading: "あかちゃん", exMeaning: "baby", level: "N4", strokes: 7 },
    { kanji: "青", meaning: "Blue", onyomi: "セイ", kunyomi: "あお(い)", example: "青空", exReading: "あおぞら", exMeaning: "blue sky", level: "N4", strokes: 8 },
    { kanji: "色", meaning: "Color", onyomi: "ショク・シキ", kunyomi: "いろ", example: "景色", exReading: "けしき", exMeaning: "scenery", level: "N4", strokes: 6 },
    { kanji: "音", meaning: "Sound", onyomi: "オン・イン", kunyomi: "おと", example: "音楽", exReading: "おんがく", exMeaning: "music", level: "N4", strokes: 9 },
    { kanji: "楽", meaning: "Comfort / Music", onyomi: "ガク・ラク", kunyomi: "たの(しい)", example: "楽しい", exReading: "たのしい", exMeaning: "fun", level: "N4", strokes: 13 },
    { kanji: "映", meaning: "Reflect", onyomi: "エイ", kunyomi: "うつ(す)", example: "映画", exReading: "えいが", exMeaning: "movie", level: "N4", strokes: 9 },
    { kanji: "画", meaning: "Picture", onyomi: "ガ・カク", kunyomi: "—", example: "映画", exReading: "えいが", exMeaning: "movie", level: "N4", strokes: 8 },
    { kanji: "真", meaning: "True", onyomi: "シン", kunyomi: "ま", example: "写真", exReading: "しゃしん", exMeaning: "photo", level: "N4", strokes: 10 },
    { kanji: "写", meaning: "Copy / Photo", onyomi: "シャ", kunyomi: "うつ(す)", example: "写真", exReading: "しゃしん", exMeaning: "photo", level: "N4", strokes: 5 },
  ],
};

// ─── Vocabulary Data ───────────────────────────────────────────────────────────
const VOCAB_DATA = {
  N5: [
    { word: "食べる", reading: "たべる", meaning: "to eat", type: "Verb" },
    { word: "飲む", reading: "のむ", meaning: "to drink", type: "Verb" },
    { word: "行く", reading: "いく", meaning: "to go", type: "Verb" },
    { word: "来る", reading: "くる", meaning: "to come", type: "Verb" },
    { word: "見る", reading: "みる", meaning: "to see / look", type: "Verb" },
    { word: "聞く", reading: "きく", meaning: "to hear / ask", type: "Verb" },
    { word: "読む", reading: "よむ", meaning: "to read", type: "Verb" },
    { word: "書く", reading: "かく", meaning: "to write", type: "Verb" },
    { word: "話す", reading: "はなす", meaning: "to speak", type: "Verb" },
    { word: "買う", reading: "かう", meaning: "to buy", type: "Verb" },
    { word: "ある", reading: "ある", meaning: "to exist (inanimate)", type: "Verb" },
    { word: "いる", reading: "いる", meaning: "to exist (animate)", type: "Verb" },
    { word: "する", reading: "する", meaning: "to do", type: "Verb" },
    { word: "分かる", reading: "わかる", meaning: "to understand", type: "Verb" },
    { word: "入る", reading: "はいる", meaning: "to enter", type: "Verb" },
    { word: "出る", reading: "でる", meaning: "to exit / leave", type: "Verb" },
    { word: "待つ", reading: "まつ", meaning: "to wait", type: "Verb" },
    { word: "立つ", reading: "たつ", meaning: "to stand", type: "Verb" },
    { word: "座る", reading: "すわる", meaning: "to sit", type: "Verb" },
    { word: "会う", reading: "あう", meaning: "to meet", type: "Verb" },
    { word: "大きい", reading: "おおきい", meaning: "big", type: "Adjective" },
    { word: "小さい", reading: "ちいさい", meaning: "small", type: "Adjective" },
    { word: "新しい", reading: "あたらしい", meaning: "new", type: "Adjective" },
    { word: "古い", reading: "ふるい", meaning: "old (things)", type: "Adjective" },
    { word: "高い", reading: "たかい", meaning: "high / expensive", type: "Adjective" },
    { word: "安い", reading: "やすい", meaning: "cheap", type: "Adjective" },
    { word: "長い", reading: "ながい", meaning: "long", type: "Adjective" },
    { word: "白い", reading: "しろい", meaning: "white", type: "Adjective" },
    { word: "良い", reading: "いい / よい", meaning: "good", type: "Adjective" },
    { word: "悪い", reading: "わるい", meaning: "bad", type: "Adjective" },
    { word: "暑い", reading: "あつい", meaning: "hot (weather)", type: "Adjective" },
    { word: "寒い", reading: "さむい", meaning: "cold (weather)", type: "Adjective" },
    { word: "近い", reading: "ちかい", meaning: "near / close", type: "Adjective" },
    { word: "遠い", reading: "とおい", meaning: "far", type: "Adjective" },
    { word: "おいしい", reading: "おいしい", meaning: "delicious", type: "Adjective" },
    { word: "学校", reading: "がっこう", meaning: "school", type: "Noun" },
    { word: "先生", reading: "せんせい", meaning: "teacher", type: "Noun" },
    { word: "学生", reading: "がくせい", meaning: "student", type: "Noun" },
    { word: "大学", reading: "だいがく", meaning: "university", type: "Noun" },
    { word: "友達", reading: "ともだち", meaning: "friend", type: "Noun" },
    { word: "家族", reading: "かぞく", meaning: "family", type: "Noun" },
    { word: "お父さん", reading: "おとうさん", meaning: "father", type: "Noun" },
    { word: "お母さん", reading: "おかあさん", meaning: "mother", type: "Noun" },
    { word: "子供", reading: "こども", meaning: "child", type: "Noun" },
    { word: "名前", reading: "なまえ", meaning: "name", type: "Noun" },
    { word: "日本語", reading: "にほんご", meaning: "Japanese language", type: "Noun" },
    { word: "英語", reading: "えいご", meaning: "English language", type: "Noun" },
    { word: "電車", reading: "でんしゃ", meaning: "train", type: "Noun" },
    { word: "電話", reading: "でんわ", meaning: "telephone", type: "Noun" },
    { word: "時間", reading: "じかん", meaning: "time / hour", type: "Noun" },
    { word: "毎日", reading: "まいにち", meaning: "every day", type: "Noun" },
    { word: "今日", reading: "きょう", meaning: "today", type: "Noun" },
    { word: "明日", reading: "あした", meaning: "tomorrow", type: "Noun" },
    { word: "昨日", reading: "きのう", meaning: "yesterday", type: "Noun" },
    { word: "天気", reading: "てんき", meaning: "weather", type: "Noun" },
    { word: "水", reading: "みず", meaning: "water", type: "Noun" },
    { word: "お茶", reading: "おちゃ", meaning: "tea", type: "Noun" },
    { word: "朝", reading: "あさ", meaning: "morning", type: "Noun" },
    { word: "昼", reading: "ひる", meaning: "noon / daytime", type: "Noun" },
    { word: "夜", reading: "よる", meaning: "night", type: "Noun" },
  ],
  N4: [
    { word: "開ける", reading: "あける", meaning: "to open", type: "Verb" },
    { word: "閉める", reading: "しめる", meaning: "to close", type: "Verb" },
    { word: "始まる", reading: "はじまる", meaning: "to begin (intrans.)", type: "Verb" },
    { word: "終わる", reading: "おわる", meaning: "to end", type: "Verb" },
    { word: "住む", reading: "すむ", meaning: "to live / reside", type: "Verb" },
    { word: "働く", reading: "はたらく", meaning: "to work", type: "Verb" },
    { word: "走る", reading: "はしる", meaning: "to run", type: "Verb" },
    { word: "泳ぐ", reading: "およぐ", meaning: "to swim", type: "Verb" },
    { word: "遊ぶ", reading: "あそぶ", meaning: "to play", type: "Verb" },
    { word: "届ける", reading: "とどける", meaning: "to deliver", type: "Verb" },
    { word: "送る", reading: "おくる", meaning: "to send", type: "Verb" },
    { word: "届く", reading: "とどく", meaning: "to arrive / reach", type: "Verb" },
    { word: "決める", reading: "きめる", meaning: "to decide", type: "Verb" },
    { word: "変わる", reading: "かわる", meaning: "to change", type: "Verb" },
    { word: "壊れる", reading: "こわれる", meaning: "to break", type: "Verb" },
    { word: "落ちる", reading: "おちる", meaning: "to fall / drop", type: "Verb" },
    { word: "思う", reading: "おもう", meaning: "to think", type: "Verb" },
    { word: "考える", reading: "かんがえる", meaning: "to consider", type: "Verb" },
    { word: "知る", reading: "しる", meaning: "to know", type: "Verb" },
    { word: "起きる", reading: "おきる", meaning: "to wake up", type: "Verb" },
    { word: "寝る", reading: "ねる", meaning: "to sleep", type: "Verb" },
    { word: "帰る", reading: "かえる", meaning: "to return", type: "Verb" },
    { word: "使う", reading: "つかう", meaning: "to use", type: "Verb" },
    { word: "作る", reading: "つくる", meaning: "to make", type: "Verb" },
    { word: "持つ", reading: "もつ", meaning: "to hold / have", type: "Verb" },
    { word: "借りる", reading: "かりる", meaning: "to borrow", type: "Verb" },
    { word: "貸す", reading: "かす", meaning: "to lend", type: "Verb" },
    { word: "払う", reading: "はらう", meaning: "to pay", type: "Verb" },
    { word: "選ぶ", reading: "えらぶ", meaning: "to choose", type: "Verb" },
    { word: "探す", reading: "さがす", meaning: "to search", type: "Verb" },
    { word: "簡単", reading: "かんたん", meaning: "simple / easy", type: "Adjective" },
    { word: "複雑", reading: "ふくざつ", meaning: "complicated", type: "Adjective" },
    { word: "便利", reading: "べんり", meaning: "convenient", type: "Adjective" },
    { word: "不便", reading: "ふべん", meaning: "inconvenient", type: "Adjective" },
    { word: "危ない", reading: "あぶない", meaning: "dangerous", type: "Adjective" },
    { word: "安全", reading: "あんぜん", meaning: "safe", type: "Adjective" },
    { word: "元気", reading: "げんき", meaning: "healthy / energetic", type: "Adjective" },
    { word: "大丈夫", reading: "だいじょうぶ", meaning: "okay / alright", type: "Adjective" },
    { word: "特別", reading: "とくべつ", meaning: "special", type: "Adjective" },
    { word: "有名", reading: "ゆうめい", meaning: "famous", type: "Adjective" },
    { word: "大切", reading: "たいせつ", meaning: "important", type: "Adjective" },
    { word: "必要", reading: "ひつよう", meaning: "necessary", type: "Adjective" },
    { word: "社会", reading: "しゃかい", meaning: "society", type: "Noun" },
    { word: "経済", reading: "けいざい", meaning: "economy", type: "Noun" },
    { word: "政治", reading: "せいじ", meaning: "politics", type: "Noun" },
    { word: "文化", reading: "ぶんか", meaning: "culture", type: "Noun" },
    { word: "歴史", reading: "れきし", meaning: "history", type: "Noun" },
    { word: "地図", reading: "ちず", meaning: "map", type: "Noun" },
    { word: "世界", reading: "せかい", meaning: "world", type: "Noun" },
    { word: "交通", reading: "こうつう", meaning: "traffic", type: "Noun" },
    { word: "旅行", reading: "りょこう", meaning: "travel", type: "Noun" },
    { word: "空港", reading: "くうこう", meaning: "airport", type: "Noun" },
    { word: "会議", reading: "かいぎ", meaning: "meeting", type: "Noun" },
    { word: "授業", reading: "じゅぎょう", meaning: "class / lesson", type: "Noun" },
    { word: "宿題", reading: "しゅくだい", meaning: "homework", type: "Noun" },
    { word: "試験", reading: "しけん", meaning: "exam", type: "Noun" },
    { word: "問題", reading: "もんだい", meaning: "problem / question", type: "Noun" },
    { word: "答え", reading: "こたえ", meaning: "answer", type: "Noun" },
    { word: "意味", reading: "いみ", meaning: "meaning", type: "Noun" },
    { word: "理由", reading: "りゆう", meaning: "reason", type: "Noun" },
  ],
};

const CATEGORY_COLORS = {
  "Numbers 数": "#f59e0b",
  "Time 暦": "#3b82f6",
  "Directions 方": "#10b981",
  "People 衆": "#ec4899",
  "School 習": "#8b5cf6",        
  "Actions 動": "#f97316",
  "Places 所": "#6366f1",
  "Nature 自": "#22c55e",
  "Transport 運": "#a855f7",
  "Body 身": "#f43f5e",
  "Food 膳": "#eab308",
  "Adjectives 形": "#14b8a6",
  "Work 働": "#64748b",
  "Money 銭": "#d97706",
  "Verbs 述": "#0ea5e9",
  "Colors 彩": "#d946ef",
};

// ─── Stroke Order Component ────────────────────────────────────────────────────
function StrokeOrderDisplay({ kanji, dark }) {
  const [svgContent, setSvgContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [currentStroke, setCurrentStroke] = useState(-1);
  const svgRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setSvgContent(null);
    setCurrentStroke(-1);
    setAnimating(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const codePoint = kanji.codePointAt(0).toString(16).padStart(5, "0");
    const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${codePoint}.svg`;

    fetch(url)
      .then(r => { if (!r.ok) throw new Error(); return r.text(); })
      .then(text => { setSvgContent(text); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [kanji]);

  const playAnimation = useCallback(() => {
    if (!svgRef.current) return;
    const paths = svgRef.current.querySelectorAll("path");
    if (!paths.length) return;

    setAnimating(true);
    setCurrentStroke(-1);
    paths.forEach(p => { p.style.opacity = "0"; p.style.transition = "none"; });

    let i = 0;
    intervalRef.current = setInterval(() => {
      if (i < paths.length) {
        paths[i].style.transition = "opacity 0.3s";
        paths[i].style.opacity = "1";
        setCurrentStroke(i);
        i++;
      } else {
        clearInterval(intervalRef.current);
        setAnimating(false);
      }
    }, 600);
  }, []);

  const resetStrokes = useCallback(() => {
    if (!svgRef.current) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const paths = svgRef.current.querySelectorAll("path");
    paths.forEach(p => { p.style.opacity = "1"; p.style.transition = "none"; });
    setCurrentStroke(-1);
    setAnimating(false);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: dark ? "#555 transparent #555 #555" : "#ccc transparent #ccc #ccc" }} />
        <div className="text-xs mt-3 opacity-50">Loading stroke order...</div>
      </div>
    );
  }

  if (error || !svgContent) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <div className="text-6xl mb-3 opacity-20" style={{ fontFamily: "'Noto Serif JP', serif" }}>{kanji}</div>
        <div className="text-xs opacity-40">Stroke data unavailable</div>
      </div>
    );
  }

  const processedSvg = svgContent
    .replace(/stroke:\s*#[0-9a-fA-F]+/g, `stroke: ${dark ? "#e0e0e0" : "#1a1a2e"}`)
    .replace(/fill:\s*#[0-9a-fA-F]+/g, "fill: none")
    .replace(/width="[^"]*"/, 'width="100%"')
    .replace(/height="[^"]*"/, 'height="100%"');

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-[200px] aspect-square rounded-2xl p-4 relative overflow-hidden"
        style={{ background: dark ? "#0f0f17" : "#f8f7f4", border: `1px solid ${dark ? "#2a2a3a" : "#e5e2db"}` }}>
        <div className="absolute inset-4 opacity-10" style={{
          backgroundImage: `linear-gradient(${dark ? "#444" : "#999"} 1px, transparent 1px), linear-gradient(90deg, ${dark ? "#444" : "#999"} 1px, transparent 1px)`,
          backgroundSize: "50% 50%"
        }} />
        <div ref={svgRef} className="relative z-10 w-full h-full"
          style={{ filter: dark ? "none" : "none" }}
          dangerouslySetInnerHTML={{ __html: processedSvg }} />
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={animating ? resetStrokes : playAnimation}
          className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: animating ? (dark ? "#7f1d1d" : "#fecaca") : (dark ? "#1e3a5f" : "#dbeafe"),
            color: animating ? (dark ? "#fca5a5" : "#991b1b") : (dark ? "#93c5fd" : "#1e40af"),
          }}>
          {animating ? "⏹ Reset" : "▶ Animate"}
        </button>
      </div>
      {currentStroke >= 0 && (
        <div className="text-xs mt-2 opacity-50">Stroke {currentStroke + 1}</div>
      )}
    </div>
  );
}

// ─── Kanji Card ────────────────────────────────────────────────────────────────
function KanjiCard({ item, accent, onClick, isLearned, dark }) {
  return (
    <div onClick={() => onClick(item)} className="group cursor-pointer">
      <div className="relative rounded-2xl p-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        style={{
          background: dark ? "#1a1a28" : "#fff",
          border: `1.5px solid ${dark ? "#2a2a3a" : accent + "25"}`,
          boxShadow: `0 1px 8px ${accent}08`,
        }}>
        {isLearned && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ background: "#22c55e" }}>✓</div>
        )}
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold opacity-70" style={{ background: accent + "18", color: accent }}>
          {item.level}
        </div>
        <div className="text-center mt-3">
          <div className="text-4xl sm:text-5xl mb-1.5 transition-transform duration-300 group-hover:scale-110" style={{ fontFamily: "'Noto Serif JP', serif", color: dark ? "#e0e0e0" : "#1a1a2e" }}>
            {item.kanji}
          </div>
          <div className="text-xs font-semibold mb-0.5" style={{ color: dark ? "#bbb" : "#374151" }}>{item.meaning}</div>
          <div className="text-[10px] opacity-50" style={{ color: dark ? "#888" : "#6b7280" }}>
            {item.onyomi}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Kanji Detail Modal ────────────────────────────────────────────────────────
function KanjiModal({ item, accent, onClose, dark, isLearned, onToggleLearn }) {
  const [tab, setTab] = useState("info");
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)" }} onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl animate-in"
        style={{ background: dark ? "#1a1a28" : "#fff" }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 pt-6 pb-4 text-center rounded-t-3xl" style={{ background: dark ? "#1a1a28" : "#fff", borderBottom: `1px solid ${dark ? "#2a2a3a" : "#f0f0f0"}` }}>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: dark ? "#2a2a3a" : "#f0f0f0", color: dark ? "#888" : "#999" }}>✕</button>
          <div className="text-7xl mb-2" style={{ fontFamily: "'Noto Serif JP', serif", color: dark ? "#e0e0e0" : "#1a1a2e" }}>{item.kanji}</div>
          <div className="text-xl font-bold mb-1" style={{ color: dark ? "#ccc" : "#374151" }}>{item.meaning}</div>
          <div className="flex items-center justify-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: accent + "18", color: accent }}>{item.level}</span>
            <span className="text-xs opacity-40">{item.strokes} strokes</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: dark ? "#2a2a3a" : "#f0f0f0" }}>
          {["info", "strokes"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all"
              style={{
                color: tab === t ? accent : (dark ? "#666" : "#999"),
                borderBottom: tab === t ? `2px solid ${accent}` : "2px solid transparent",
              }}>
              {t === "info" ? "Details" : "Stroke Order"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === "info" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "On'yomi", value: item.onyomi },
                  { label: "Kun'yomi", value: item.kunyomi },
                  { label: "Strokes", value: String(item.strokes) },
                  { label: "Level", value: item.level },
                ].map(b => (
                  <div key={b.label} className="rounded-xl p-3" style={{ background: dark ? "#0f0f17" : "#f8f7f4" }}>
                    <div className="text-[10px] uppercase tracking-wider mb-0.5 opacity-40">{b.label}</div>
                    <div className="text-sm font-semibold" style={{ color: dark ? "#e0e0e0" : "#1a1a2e" }}>{b.value}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-4" style={{ background: dark ? "#0f0f17" : "#f8f7f4" }}>
                <div className="text-[10px] uppercase tracking-wider mb-2 opacity-40">Example Word</div>
                <div className="text-2xl mb-1" style={{ fontFamily: "'Noto Serif JP', serif", color: dark ? "#e0e0e0" : "#1a1a2e" }}>{item.example}</div>
                <div className="text-sm" style={{ color: dark ? "#aaa" : "#6b7280" }}>{item.exReading} — {item.exMeaning}</div>
              </div>
            </div>
          ) : (
            <StrokeOrderDisplay kanji={item.kanji} dark={dark} />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 flex gap-3" style={{ background: dark ? "#1a1a28" : "#fff", borderTop: `1px solid ${dark ? "#2a2a3a" : "#f0f0f0"}` }}>
          <button onClick={onToggleLearn} className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all" style={{ background: isLearned ? "#22c55e" : accent, color: "#fff" }}>
            {isLearned ? "✓ Learned" : "Mark as Learned"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Vocabulary Tab ────────────────────────────────────────────────────────────
function VocabTab({ dark, vocabLevel, setVocabLevel }) {
  const [vocabSearch, setVocabSearch] = useState("");
  const [vocabFilter, setVocabFilter] = useState("All");

  const items = VOCAB_DATA[vocabLevel] || [];
  const types = ["All", ...new Set(items.map(v => v.type))];

  const filtered = items.filter(v => {
    const matchType = vocabFilter === "All" || v.type === vocabFilter;
    const q = vocabSearch.toLowerCase();
    const matchSearch = !q || v.word.includes(q) || v.reading.includes(q) || v.meaning.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      {/* Level Toggle */}
      <div className="flex justify-center gap-2 mb-6">
        {["N5", "N4"].map(lv => (
          <button key={lv} onClick={() => { setVocabLevel(lv); setVocabFilter("All"); }}
            className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: vocabLevel === lv ? "#c2185b" : (dark ? "#1a1a28" : "#fff"),
              color: vocabLevel === lv ? "#fff" : (dark ? "#888" : "#666"),
              border: `2px solid ${vocabLevel === lv ? "#c2185b" : (dark ? "#2a2a3a" : "#e5e7eb")}`,
            }}>
            {lv} ({VOCAB_DATA[lv].length} words)
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-6 relative">
        <input type="text" value={vocabSearch} onChange={e => setVocabSearch(e.target.value)}
          placeholder="Search vocabulary..."
          className="w-full px-4 py-3 pl-10 rounded-xl text-sm outline-none"
          style={{ background: dark ? "#1a1a28" : "#fff", color: dark ? "#e0e0e0" : "#1a1a2e", border: `1.5px solid ${dark ? "#2a2a3a" : "#e5e7eb"}` }} />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm opacity-40">🔍</span>
      </div>

      {/* Type Filter */}
      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {types.map(t => (
          <button key={t} onClick={() => setVocabFilter(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: vocabFilter === t ? "#8b5cf6" : (dark ? "#1a1a28" : "#fff"),
              color: vocabFilter === t ? "#fff" : (dark ? "#888" : "#666"),
              border: `1px solid ${vocabFilter === t ? "#8b5cf6" : (dark ? "#2a2a3a" : "#e5e7eb")}`,
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Vocab Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${dark ? "#2a2a3a" : "#e5e7eb"}` }}>
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-wider font-bold"
          style={{ background: dark ? "#0f0f17" : "#f8f7f4", color: dark ? "#666" : "#999" }}>
          <div className="col-span-3">Word</div>
          <div className="col-span-3">Reading</div>
          <div className="col-span-4">Meaning</div>
          <div className="col-span-2 text-right">Type</div>
        </div>
        {/* Rows */}
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {filtered.map((v, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors"
              style={{
                background: i % 2 === 0 ? "transparent" : (dark ? "#0f0f1708" : "#f8f7f405"),
                borderTop: `1px solid ${dark ? "#1a1a28" : "#f0f0f0"}`,
              }}>
              <div className="col-span-3 text-base font-bold" style={{ fontFamily: "'Noto Serif JP', serif", color: dark ? "#e0e0e0" : "#1a1a2e" }}>
                {v.word}
              </div>
              <div className="col-span-3 text-sm" style={{ color: dark ? "#aaa" : "#6b7280" }}>{v.reading}</div>
              <div className="col-span-4 text-sm" style={{ color: dark ? "#ccc" : "#374151" }}>{v.meaning}</div>
              <div className="col-span-2 text-right">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: v.type === "Verb" ? "#3b82f620" : v.type === "Adjective" ? "#f59e0b20" : "#22c55e20",
                    color: v.type === "Verb" ? "#3b82f6" : v.type === "Adjective" ? "#f59e0b" : "#22c55e",
                  }}>
                  {v.type}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm opacity-40">No vocabulary found</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Flashcard Mode ────────────────────────────────────────────────────────────
function FlashcardMode({ allKanji, dark, onExit, learned, onToggleLearn }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [deck, setDeck] = useState([]);

  useEffect(() => {
    setDeck([...allKanji].sort(() => Math.random() - 0.5));
    setIdx(0); setFlipped(false);
  }, [allKanji]);

  const current = deck[idx];
  if (!current) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: dark ? "#0f0f17" : "#faf9f6" }}>
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onExit} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: dark ? "#1a1a28" : "#fff", color: dark ? "#ccc" : "#374151", border: `1px solid ${dark ? "#2a2a3a" : "#e5e7eb"}` }}>← Back</button>
          <span className="text-sm" style={{ color: dark ? "#666" : "#999" }}>{idx + 1}/{deck.length}</span>
        </div>
        <div className="cursor-pointer" onClick={() => setFlipped(f => !f)} style={{ perspective: "1000px" }}>
          <div className="relative w-full transition-transform duration-500" style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "", minHeight: "340px" }}>
            <div className="absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center" style={{ backfaceVisibility: "hidden", background: dark ? "#1a1a28" : "#fff", border: `2px solid ${dark ? "#2a2a3a" : "#e5e7eb"}`, boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
              <div className="text-xs uppercase tracking-widest mb-6 opacity-30">Tap to reveal</div>
              <div className="text-9xl" style={{ fontFamily: "'Noto Serif JP', serif", color: dark ? "#e0e0e0" : "#1a1a2e" }}>{current.kanji}</div>
            </div>
            <div className="absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: dark ? "#1a1a2e" : "#f0f9ff", border: `2px solid ${dark ? "#2a2a3a" : "#bae6fd"}` }}>
              <div className="text-5xl mb-3" style={{ fontFamily: "'Noto Serif JP', serif", color: dark ? "#e0e0e0" : "#1a1a2e" }}>{current.kanji}</div>
              <div className="text-2xl font-bold mb-2" style={{ color: dark ? "#ccc" : "#374151" }}>{current.meaning}</div>
              <div className="text-sm mb-1" style={{ color: dark ? "#aaa" : "#6b7280" }}>On: {current.onyomi} &nbsp;|&nbsp; Kun: {current.kunyomi}</div>
              <div className="mt-4 rounded-xl px-4 py-2" style={{ background: dark ? "#0f0f17" : "#fff" }}>
                <span className="text-lg" style={{ fontFamily: "'Noto Serif JP', serif" }}>{current.example}</span>
                <span className="text-sm ml-2" style={{ color: dark ? "#888" : "#999" }}>({current.exReading}) — {current.exMeaning}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={() => { setFlipped(false); setTimeout(() => setIdx(i => Math.max(0, i - 1)), 120); }} disabled={idx === 0}
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold disabled:opacity-30"
            style={{ background: dark ? "#1a1a28" : "#fff", border: `1px solid ${dark ? "#2a2a3a" : "#e5e7eb"}` }}>‹</button>
          <button onClick={() => onToggleLearn(current.kanji)} className="px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ background: learned.has(current.kanji) ? "#22c55e" : (dark ? "#2a2a3a" : "#e5e7eb"), color: learned.has(current.kanji) ? "#fff" : (dark ? "#ccc" : "#374151") }}>
            {learned.has(current.kanji) ? "✓ Learned" : "Mark Learned"}
          </button>
          <button onClick={() => { setFlipped(false); setTimeout(() => setIdx(i => Math.min(deck.length - 1, i + 1)), 120); }} disabled={idx === deck.length - 1}
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold disabled:opacity-30"
            style={{ background: dark ? "#1a1a28" : "#fff", border: `1px solid ${dark ? "#2a2a3a" : "#e5e7eb"}` }}>›</button>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz Mode ─────────────────────────────────────────────────────────────────
function QuizMode({ allKanji, dark, onExit }) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [done, setDone] = useState(false);

  const generate = useCallback(() => {
    const shuffled = [...allKanji].sort(() => Math.random() - 0.5).slice(0, 10);
    const qs = shuffled.map(q => {
      const wrongs = allKanji.filter(k => k.kanji !== q.kanji).sort(() => Math.random() - 0.5).slice(0, 3);
      return { ...q, options: [q, ...wrongs].sort(() => Math.random() - 0.5) };
    });
    setQuestions(qs); setQIdx(0); setSelected(null); setScore(0); setDone(false);
  }, [allKanji]);

  useEffect(() => { generate(); }, [generate]);

  const current = questions[qIdx];
  if (!current) return null;

  const handleSelect = (opt) => {
    if (selected) return;
    setSelected(opt.kanji);
    if (opt.kanji === current.kanji) setScore(s => s + 1);
    setTimeout(() => {
      if (qIdx < questions.length - 1) { setQIdx(i => i + 1); setSelected(null); }
      else setDone(true);
    }, 1000);
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: dark ? "#0f0f17" : "#faf9f6" }}>
        <div className="text-center rounded-3xl p-10 w-full max-w-md" style={{ background: dark ? "#1a1a28" : "#fff", border: `2px solid ${dark ? "#2a2a3a" : "#e5e7eb"}` }}>
          <div className="text-6xl mb-4">{score >= 8 ? "🎉" : score >= 5 ? "👏" : "💪"}</div>
          <div className="text-3xl font-bold mb-2" style={{ color: dark ? "#e0e0e0" : "#1a1a2e" }}>{score}/10</div>
          <div className="text-sm mb-6 opacity-60">{score >= 8 ? "Excellent!" : score >= 5 ? "Good job!" : "Keep practicing!"}</div>
          <div className="flex gap-3 justify-center">
            <button onClick={generate} className="px-6 py-3 rounded-xl font-semibold text-sm text-white" style={{ background: "#8b5cf6" }}>Try Again</button>
            <button onClick={onExit} className="px-6 py-3 rounded-xl font-semibold text-sm" style={{ background: dark ? "#2a2a3a" : "#e5e7eb", color: dark ? "#ccc" : "#374151" }}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: dark ? "#0f0f17" : "#faf9f6" }}>
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onExit} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: dark ? "#1a1a28" : "#fff", color: dark ? "#ccc" : "#374151", border: `1px solid ${dark ? "#2a2a3a" : "#e5e7eb"}` }}>← Back</button>
          <div className="flex gap-3 text-sm"><span style={{ color: "#22c55e" }}>✓ {score}</span><span style={{ color: dark ? "#666" : "#999" }}>{qIdx + 1}/10</span></div>
        </div>
        <div className="rounded-3xl p-8 text-center mb-6" style={{ background: dark ? "#1a1a28" : "#fff", border: `2px solid ${dark ? "#2a2a3a" : "#e5e7eb"}` }}>
          <div className="text-xs uppercase tracking-widest mb-4 opacity-30">What does this kanji mean?</div>
          <div className="text-8xl" style={{ fontFamily: "'Noto Serif JP', serif", color: dark ? "#e0e0e0" : "#1a1a2e" }}>{current.kanji}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {current.options.map(opt => {
            const isCorrect = opt.kanji === current.kanji;
            const isSelected = selected === opt.kanji;
            let bg = dark ? "#1a1a28" : "#fff";
            let border = dark ? "#2a2a3a" : "#e5e7eb";
            if (selected) { if (isCorrect) { bg = "#22c55e18"; border = "#22c55e"; } else if (isSelected) { bg = "#ef444418"; border = "#ef4444"; } }
            return (
              <button key={opt.kanji} onClick={() => handleSelect(opt)} className="p-4 rounded-xl text-left transition-all" style={{ background: bg, border: `2px solid ${border}` }}>
                <div className="text-sm font-semibold" style={{ color: dark ? "#e0e0e0" : "#374151" }}>{opt.meaning}</div>
                <div className="text-xs mt-0.5 opacity-50">{opt.onyomi}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("kanji"); // kanji | vocab
  const [activeCategory, setActiveCategory] = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const [mode, setMode] = useState("browse");
  const [learned, setLearned] = useState(new Set());
  const [vocabLevel, setVocabLevel] = useState("N5");
  const [mobileMenu, setMobileMenu] = useState(false);
  const catRefs = useRef({});

  const allKanji = useMemo(() => Object.values(KANJI_DATA).flat(), []);
  const totalKanji = allKanji.length;
  const learnedCount = learned.size;
  const progress = totalKanji > 0 ? Math.round((learnedCount / totalKanji) * 100) : 0;

  const toggleLearn = (k) => setLearned(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const filteredData = useMemo(() => {
    if (!search.trim()) return KANJI_DATA;
    const q = search.toLowerCase();
    const r = {};
    for (const [cat, items] of Object.entries(KANJI_DATA)) {
      const f = items.filter(k => k.kanji.includes(q) || k.meaning.toLowerCase().includes(q) || k.onyomi.includes(q) || k.kunyomi.includes(q) || k.example.includes(q) || k.exMeaning.toLowerCase().includes(q));
      if (f.length) r[cat] = f;
    }
    return r;
  }, [search]);

  const modalAccent = modalItem ? (CATEGORY_COLORS[Object.keys(KANJI_DATA).find(c => KANJI_DATA[c].some(k => k.kanji === modalItem.kanji))] || "#8b5cf6") : "#8b5cf6";

  if (mode === "flashcard") return <FlashcardMode allKanji={activeCategory ? (KANJI_DATA[activeCategory] || allKanji) : allKanji} dark={dark} onExit={() => setMode("browse")} learned={learned} onToggleLearn={toggleLearn} />;
  if (mode === "quiz") return <QuizMode allKanji={activeCategory ? (KANJI_DATA[activeCategory] || allKanji) : allKanji} dark={dark} onExit={() => setMode("browse")} />;

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: dark ? "#0f0f17" : "#faf9f6", color: dark ? "#e0e0e0" : "#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=Outfit:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Outfit', sans-serif; }
        body { overflow-x: hidden; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #88888830; border-radius: 3px; }
        .animate-in { animation: slideUp 0.35s cubic-bezier(0.16,1,0.3,1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40" style={{ background: dark ? "#0f0f17e8" : "#faf9f6e8", backdropFilter: "blur(20px)", borderBottom: `1px solid ${dark ? "#1a1a28" : "#e5e7eb"}` }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "linear-gradient(135deg, #c2185b, #e91e63)", fontFamily: "'Noto Serif JP', serif", color: "#fff" }}>漢</div>
            <div>
              <h1 className="text-sm font-bold leading-tight">JLPT Kanji Study</h1>
              <div className="text-[10px] opacity-40">N5 & N4 — {totalKanji} kanji</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => setMode("flashcard")} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: dark ? "#1a1a28" : "#fff", border: `1px solid ${dark ? "#2a2a3a" : "#e5e7eb"}` }}>🃏 Flashcards</button>
            <button onClick={() => setMode("quiz")} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#8b5cf6" }}>📝 Quiz</button>
            <button onClick={() => setDark(d => !d)} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: dark ? "#1a1a28" : "#fff", border: `1px solid ${dark ? "#2a2a3a" : "#e5e7eb"}` }}>{dark ? "☀" : "🌙"}</button>
          </div>
          <button className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center text-sm" onClick={() => setMobileMenu(m => !m)} style={{ background: dark ? "#1a1a28" : "#fff", border: `1px solid ${dark ? "#2a2a3a" : "#e5e7eb"}` }}>☰</button>
        </div>
        {mobileMenu && (
          <div className="sm:hidden px-4 pb-3 flex gap-2 animate-in">
            <button onClick={() => { setMode("flashcard"); setMobileMenu(false); }} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: dark ? "#1a1a28" : "#fff", border: `1px solid ${dark ? "#2a2a3a" : "#e5e7eb"}` }}>🃏 Flashcards</button>
            <button onClick={() => { setMode("quiz"); setMobileMenu(false); }} className="flex-1 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: "#8b5cf6" }}>📝 Quiz</button>
            <button onClick={() => setDark(d => !d)} className="w-10 rounded-lg flex items-center justify-center text-sm" style={{ background: dark ? "#1a1a28" : "#fff", border: `1px solid ${dark ? "#2a2a3a" : "#e5e7eb"}` }}>{dark ? "☀" : "🌙"}</button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-6 text-center">
        <h2 className="text-3xl sm:text-5xl font-bold mb-3" style={{ fontFamily: "'Noto Serif JP', serif" }}>
          <span style={{ background: "linear-gradient(135deg, #c2185b, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>漢字を学ぼう</span>
        </h2>
        <p className="text-sm max-w-lg mx-auto mb-6 opacity-50">Master {totalKanji} essential kanji and 120+ vocabulary words for JLPT N5 & N4.</p>

        {/* Progress */}
        <div className="max-w-sm mx-auto mb-6">
          <div className="flex justify-between text-xs mb-1.5 opacity-50"><span>{learnedCount} learned</span><span>{progress}%</span></div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: dark ? "#1a1a28" : "#e5e7eb" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #c2185b, #8b5cf6)" }} />
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex justify-center gap-1 mb-6">
          {[{ id: "kanji", label: "漢字 Kanji", count: totalKanji }, { id: "vocab", label: "語彙 Vocabulary", count: VOCAB_DATA.N5.length + VOCAB_DATA.N4.length }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: activeTab === t.id ? "#c2185b" : (dark ? "#1a1a28" : "#fff"),
                color: activeTab === t.id ? "#fff" : (dark ? "#888" : "#666"),
                border: `2px solid ${activeTab === t.id ? "#c2185b" : (dark ? "#2a2a3a" : "#e5e7eb")}`,
              }}>
              {t.label} <span className="ml-1 opacity-60 text-xs">({t.count})</span>
            </button>
          ))}
        </div>
      </section>

      {/* ─── KANJI TAB ────────────────────────────────────── */}
      {activeTab === "kanji" && (
        <>
          {/* Search */}
          <div className="max-w-md mx-auto px-4 mb-4 relative">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search kanji, meaning, or reading..."
              className="w-full px-4 py-2.5 pl-10 rounded-xl text-sm outline-none"
              style={{ background: dark ? "#1a1a28" : "#fff", color: dark ? "#e0e0e0" : "#1a1a2e", border: `1.5px solid ${dark ? "#2a2a3a" : "#e5e7eb"}` }} />
            <span className="absolute left-7 top-1/2 -translate-y-1/2 text-sm opacity-40">🔍</span>
            {search && <button onClick={() => setSearch("")} className="absolute right-7 top-1/2 -translate-y-1/2 text-sm opacity-40">✕</button>}
          </div>

          {/* Category Nav */}
          <div className="max-w-6xl mx-auto px-4 mb-6">
            <div className="flex gap-1.5 overflow-x-auto pb-1.5" style={{ scrollbarWidth: "none" }}>
              <button onClick={() => setActiveCategory(null)} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: !activeCategory ? "#c2185b" : (dark ? "#1a1a28" : "#fff"), color: !activeCategory ? "#fff" : (dark ? "#888" : "#666"), border: `1px solid ${!activeCategory ? "#c2185b" : (dark ? "#2a2a3a" : "#e5e7eb")}` }}>All</button>
              {Object.keys(KANJI_DATA).map(cat => (
                <button key={cat} onClick={() => { setActiveCategory(cat); catRefs.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
                  style={{ background: activeCategory === cat ? CATEGORY_COLORS[cat] : (dark ? "#1a1a28" : "#fff"), color: activeCategory === cat ? "#fff" : (dark ? "#888" : "#666"), border: `1px solid ${activeCategory === cat ? CATEGORY_COLORS[cat] : (dark ? "#2a2a3a" : "#e5e7eb")}` }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <main className="max-w-6xl mx-auto px-4 pb-20">
            {Object.entries(filteredData).map(([category, items]) => {
              const accent = CATEGORY_COLORS[category] || "#64748b";
              return (
                <section key={category} className="mb-10" ref={el => catRefs.current[category] = el} style={{ scrollMarginTop: "80px" }}>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: accent + "15", color: accent, fontFamily: "'Noto Serif JP', serif" }}>
                      {category.split(" ")[1]}
                    </div>
                    <div>
                      <h3 className="text-base font-bold">{category.split(" ")[0]}</h3>
                      <span className="text-[10px] opacity-40">{items.length} kanji</span>
                    </div>
                  </div>
                  <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
                    {items.map(item => (
                      <KanjiCard key={item.kanji} item={item} accent={accent} onClick={setModalItem} isLearned={learned.has(item.kanji)} dark={dark} />
                    ))}
                  </div>
                </section>
              );
            })}
            {Object.keys(filteredData).length === 0 && (
              <div className="text-center py-20 opacity-30">
                <div className="text-5xl mb-4">🔍</div>
                <div className="text-lg font-semibold">No kanji found for "{search}"</div>
              </div>
            )}
          </main>
        </>
      )}

      {/* ─── VOCAB TAB ────────────────────────────────────── */}
      {activeTab === "vocab" && (
        <VocabTab dark={dark} vocabLevel={vocabLevel} setVocabLevel={setVocabLevel} />
      )}

      {/* ─── MODAL ────────────────────────────────────────── */}
      {modalItem && (
        <KanjiModal item={modalItem} accent={modalAccent} dark={dark} onClose={() => setModalItem(null)}
          isLearned={learned.has(modalItem.kanji)}
          onToggleLearn={() => toggleLearn(modalItem.kanji)} />
      )}
    </div>
  );
}
