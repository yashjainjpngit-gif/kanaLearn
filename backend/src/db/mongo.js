import { MongoClient } from "mongodb";
import { buildSeedData } from "./seedData.js";

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const databaseName = process.env.MONGODB_DB_NAME || "kanji_app";

let clientPromise;
let databasePromise;
let seeded = false;

function getClient() {
  if (!clientPromise) {
    const client = new MongoClient(mongoUri);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = getClient().then((client) => client.db(databaseName));
  }

  return databasePromise;
}

async function ensureIndexes(database) {
  await Promise.all([
    database.collection("categories").createIndex({ id: 1 }, { unique: true }),
    database.collection("kanjiItems").createIndex({ id: 1 }, { unique: true }),
    database.collection("kanjiItems").createIndex({ categoryId: 1, kanjiChar: 1 }, { unique: true }),
    database.collection("radicals").createIndex({ id: 1 }, { unique: true }),
    database.collection("kanaItems").createIndex({ id: 1 }, { unique: true }),
    database.collection("kanaItems").createIndex({ script: 1, characterSymbol: 1 }, { unique: true }),
    database.collection("vocabularyItems").createIndex({ id: 1 }, { unique: true, sparse: true }),
    database.collection("vocabularyItems").createIndex({ entSeq: 1 }, { unique: true, sparse: true }),
    database.collection("vocabularyItems").createIndex({ wordType: 1, level: 1, isCommon: -1, reading: 1 }),
    database.collection("vocabularyItems").createIndex({ reading: 1 }),
    database.collection("vocabularyItems").createIndex({ word: 1 }),
    database.collection("vocabularyItems").createIndex({ source: 1, sortOrder: 1 }),
    database.collection("grammarPatterns").createIndex({ id: 1 }, { unique: true }),
    database.collection("kanjiDictionary").createIndex({ literal: 1 }, { unique: true }),
    database.collection("studySessions").createIndex({ id: 1 }, { unique: true }),
    database.collection("studySessionAnswers").createIndex({ sessionId: 1, itemId: 1 }),
    database.collection("studyProgress").createIndex({ clientId: 1, studyType: 1, itemId: 1 }, { unique: true }),
    database.collection("readings").createIndex({ id: 1 }, { unique: true }),
    database.collection("readings").createIndex({ level: 1, sortOrder: 1 }),
    database.collection("userReadings").createIndex({ userReadingId: 1 }, { unique: true }),
    database.collection("userReadings").createIndex({ userId: 1, createdAt: -1 }),
    database.collection("userReadings").createIndex({ userId: 1, level: 1, createdAt: -1 }),
    database.collection("userReadingSentences").createIndex({ userSentenceId: 1 }, { unique: true }),
    database.collection("userReadingSentences").createIndex({ userId: 1, createdAt: -1 }),
    database.collection("userReadingSentences").createIndex({ userId: 1, readingId: 1, createdAt: -1 }),
    database.collection("userReadingSentences").createIndex({ userId: 1, linkedVocabWords: 1 }),
    database.collection("users").createIndex({ email: 1 }, { unique: true }),
    database.collection("users").createIndex({ userId: 1 }, { unique: true }),
    database.collection("magicTokens").createIndex({ token: 1 }, { unique: true }),
    database.collection("magicTokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    database.collection("sessions").createIndex({ sessionToken: 1 }, { unique: true }),
    database.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    database.collection("challenges").createIndex({ challengeId: 1 }, { unique: true }),
    database.collection("challenges").createIndex({ inviteCode: 1 }, { unique: true }),
    database.collection("challenges").createIndex({ ownerUserId: 1, createdAt: -1 }),
    database.collection("challengeParticipants").createIndex({ challengeId: 1, userId: 1 }, { unique: true }),
    database.collection("challengeParticipants").createIndex({ userId: 1, joinedAt: -1 }),
  ]);
}

async function ensureSeedData(database) {
  if (seeded) {
    return;
  }

  await ensureIndexes(database);

  const hasKanji = await database.collection("kanjiItems").countDocuments({}, { limit: 1 });

  if (hasKanji > 0) {
    // Check if grammar needs to be re-seeded:
    //   - missing chapter field (very old data)
    //   - fewer patterns than current seed (new entries added)
    //   - enriched notes missing (content upgrade on existing IDs)
    const grammarSample = await database.collection("grammarPatterns").findOne({});
    const grammarCount = await database.collection("grammarPatterns").countDocuments({});
    const expectedGrammar = buildSeedData().grammarPatterns;
    const enrichedSample = await database.collection("grammarPatterns").findOne({ id: 28 });
    const notesAreEnriched =
      enrichedSample && typeof enrichedSample.notes === "string" && enrichedSample.notes.includes("■ Group");
    const needsGrammarReseed =
      (grammarSample && grammarSample.chapter == null) ||
      grammarCount < expectedGrammar.length ||
      (enrichedSample && !notesAreEnriched);
    if (needsGrammarReseed) {
      await database.collection("grammarPatterns").drop().catch(() => {});
      if (expectedGrammar.length) {
        await database.collection("grammarPatterns").insertMany(expectedGrammar, { ordered: true });
      }
    }
    // Seed readings if the collection is empty (new feature on existing DB)
    const readingsCount = await database.collection("readings").countDocuments({}, { limit: 1 });
    if (readingsCount === 0) {
      const seedData = buildSeedData();
      if (seedData.readings.length) {
        await database.collection("readings").insertMany(seedData.readings, { ordered: true });
      }
    }
    // Re-seed kanaItems if they still use old Nihon-shiki romaji (di/du instead of ji/zu)
    const oldKanaSample = await database.collection("kanaItems").findOne({ romaji: "di" });
    if (oldKanaSample) {
      const seedData = buildSeedData();
      await database.collection("kanaItems").drop().catch(() => {});
      if (seedData.kanaItems.length) {
        await database.collection("kanaItems").insertMany(seedData.kanaItems, { ordered: true });
      }
    }
    // Re-seed vocabularyItems if romaji field is missing (old data) or vocab count is small (old seed)
    const vocabSample = await database.collection("vocabularyItems").findOne({});
    const vocabCount = await database.collection("vocabularyItems").countDocuments({});
    if (vocabSample && (vocabSample.romaji === undefined || vocabCount < 50)) {
      const seedData = buildSeedData();
      await database.collection("vocabularyItems").drop().catch(() => {});
      if (seedData.vocabularyItems.length) {
        await database.collection("vocabularyItems").insertMany(seedData.vocabularyItems, { ordered: true });
      }
    }
    seeded = true;
    return;
  }

  const seedData = buildSeedData();
  const collections = [
    ["categories", seedData.categories],
    ["kanjiItems", seedData.kanjiItems],
    ["radicals", seedData.radicals],
    ["kanaItems", seedData.kanaItems],
    ["vocabularyItems", seedData.vocabularyItems],
    ["grammarPatterns", seedData.grammarPatterns],
    ["readings", seedData.readings],
  ];

  for (const [collectionName, documents] of collections) {
    if (documents.length) {
      await database.collection(collectionName).insertMany(documents, { ordered: true });
    }
  }

  seeded = true;
}

export async function initializeDatabase() {
  const database = await getDatabase();
  await ensureSeedData(database);
  return database;
}

export async function pingDatabase() {
  const database = await getDatabase();
  await database.command({ ping: 1 });
  return database;
}
