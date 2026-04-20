import "dotenv/config";
import fs from "fs";
import zlib from "zlib";
import { XMLParser } from "fast-xml-parser";
import { MongoClient } from "mongodb";

const DEFAULT_SOURCE = "http://ftp.edrdg.org/pub/Nihongo/kanjidic2.xml.gz";
const BATCH_SIZE = 500;

function getArg(name, fallback = undefined) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) {
    return fallback;
  }

  return process.argv[index + 1] ?? fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function arrayify(value) {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function textOf(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    if (typeof value["#text"] === "string") {
      return value["#text"].trim();
    }

    if (typeof value.text === "string") {
      return value.text.trim();
    }
  }

  return null;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

async function readSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to download KANJIDIC2: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  return fs.readFileSync(source);
}

function decodePayload(buffer) {
  const isGzip = buffer[0] === 0x1f && buffer[1] === 0x8b;
  const xmlBuffer = isGzip ? zlib.gunzipSync(buffer) : buffer;
  return xmlBuffer.toString("utf8");
}

function parseCharacters(xmlText) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    trimValues: true,
    parseTagValue: false,
    parseAttributeValue: false,
    processEntities: false,
  });
  const document = parser.parse(xmlText);
  return arrayify(document?.kanjidic2?.character);
}

function buildKanjiDocument(character) {
  const literal = textOf(character.literal);
  if (!literal) {
    return null;
  }

  const misc = character.misc ?? {};
  const rmgroup = arrayify(character.reading_meaning?.rmgroup)[0] ?? {};
  const readings = arrayify(rmgroup.reading);
  const meanings = arrayify(rmgroup.meaning);
  const nanori = uniqueValues(arrayify(character.reading_meaning?.nanori).map(textOf));
  const radicals = arrayify(character.radical?.rad_value)
    .map((item) => ({
      type: item?.rad_type ?? null,
      value: textOf(item),
    }))
    .filter((item) => item.value);

  const onyomi = uniqueValues(readings.filter((item) => item?.r_type === "ja_on").map(textOf));
  const kunyomi = uniqueValues(readings.filter((item) => item?.r_type === "ja_kun").map(textOf));
  const englishMeanings = uniqueValues(
    meanings
      .filter((item) => !item?.m_lang || item.m_lang === "en")
      .map(textOf)
  );

  return {
    literal,
    grade: Number(textOf(misc.grade)) || null,
    jlpt: Number(textOf(misc.jlpt)) || null,
    frequency: Number(textOf(misc.freq)) || null,
    strokeCount: Number(textOf(arrayify(misc.stroke_count)[0])) || null,
    radicals,
    onyomi,
    kunyomi,
    meanings: englishMeanings,
    nanori,
    source: "kanjidic2",
    importedAt: new Date(),
  };
}

async function main() {
  const source = getArg("source", DEFAULT_SOURCE);
  const limit = Number(getArg("limit", "0")) || null;
  const replaceSource = hasFlag("replace-source");
  const mongoUri = process.env.MONGODB_URI;
  const databaseName = process.env.MONGODB_DB_NAME || "kanji_app";

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required");
  }

  const payload = await readSource(source);
  const xmlText = decodePayload(payload);
  const characters = parseCharacters(xmlText);
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const database = client.db(databaseName);
    const dictionaryCollection = database.collection("kanjiDictionary");
    const studyCollection = database.collection("kanjiItems");
    await dictionaryCollection.createIndex({ literal: 1 }, { unique: true });

    if (replaceSource) {
      await dictionaryCollection.deleteMany({ source: "kanjidic2" });
    }

    let processed = 0;
    let dictionaryBatch = [];
    let studyBatch = [];

    for (const character of characters) {
      const document = buildKanjiDocument(character);
      if (!document) {
        continue;
      }

      processed += 1;

      dictionaryBatch.push({
        updateOne: {
          filter: { literal: document.literal },
          update: { $set: document },
          upsert: true,
        },
      });

      studyBatch.push({
        updateOne: {
          filter: { kanjiChar: document.literal },
          update: {
            $set: {
              dictionary: {
                grade: document.grade,
                jlpt: document.jlpt,
                frequency: document.frequency,
                strokeCount: document.strokeCount,
                radicals: document.radicals,
                onyomi: document.onyomi,
                kunyomi: document.kunyomi,
                meanings: document.meanings,
                nanori: document.nanori,
              },
            },
          },
        },
      });

      if (dictionaryBatch.length >= BATCH_SIZE) {
        await dictionaryCollection.bulkWrite(dictionaryBatch, { ordered: false });
        await studyCollection.bulkWrite(studyBatch, { ordered: false });
        dictionaryBatch = [];
        studyBatch = [];
      }

      if (limit && processed >= limit) {
        break;
      }
    }

    if (dictionaryBatch.length) {
      await dictionaryCollection.bulkWrite(dictionaryBatch, { ordered: false });
      await studyCollection.bulkWrite(studyBatch, { ordered: false });
    }

    console.log(`Imported ${processed} KANJIDIC2 characters into MongoDB.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(`KANJIDIC2 import failed: ${error.message}`);
  process.exit(1);
});
