import "dotenv/config";
import fs from "fs";
import zlib from "zlib";
import { XMLParser } from "fast-xml-parser";
import { MongoClient } from "mongodb";

const DEFAULT_SOURCE = "http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz";
const BATCH_SIZE = 500;

const POS_MAP = {
  "noun (common) (futsuumeishi)": "Noun",
  "Ichidan verb": "Verb",
  "Godan verb - Iku/Yuku special class": "Verb",
  "Godan verb with `bu' ending": "Verb",
  "Godan verb with `gu' ending": "Verb",
  "Godan verb with `ku' ending": "Verb",
  "Godan verb with `mu' ending": "Verb",
  "Godan verb with `nu' ending": "Verb",
  "Godan verb with `ru' ending": "Verb",
  "Godan verb with `su' ending": "Verb",
  "Godan verb with `tsu' ending": "Verb",
  "Godan verb with `u' ending": "Verb",
  "Godan verb with `u' ending (special class)": "Verb",
  "intransitive verb": "Verb",
  "transitive verb": "Verb",
  "adjective (keiyoushi)": "Adjective",
  "adjectival nouns or quasi-adjectives (keiyodoshi)": "Adjective",
  "adverb (fukushi)": "Adverb",
  "adverb taking the `to' particle": "Adverb",
  "expressions (phrases, clauses, etc.)": "Expression",
  pronoun: "Pronoun",
  counter: "Counter",
  numeric: "Number",
  "proper noun": "Proper Noun",
};

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

function normalizeText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function pickWordType(posValues) {
  for (const pos of posValues) {
    if (POS_MAP[pos]) {
      return POS_MAP[pos];
    }
  }

  return posValues[0] || "Other";
}

async function readSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to download JMdict: ${response.status} ${response.statusText}`);
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

function parseEntries(xmlText) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    trimValues: true,
    parseTagValue: false,
    parseAttributeValue: false,
    processEntities: false,
  });
  const document = parser.parse(xmlText);
  return arrayify(document?.JMdict?.entry);
}

function toDocument(entry, sortOrder) {
  const entSeq = Number(textOf(entry.ent_seq));
  const kElements = arrayify(entry.k_ele);
  const rElements = arrayify(entry.r_ele);
  const senseElements = arrayify(entry.sense);

  const kebValues = uniqueValues(kElements.map((item) => textOf(item.keb)));
  const rebValues = uniqueValues(rElements.map((item) => textOf(item.reb)));
  const priorities = uniqueValues(
    kElements.flatMap((item) => arrayify(item.ke_pri).map(textOf)).concat(rElements.flatMap((item) => arrayify(item.re_pri).map(textOf)))
  );

  const glosses = uniqueValues(
    senseElements.flatMap((sense) => arrayify(sense.gloss).map(textOf).map((value) => (value ? normalizeText(value) : null)))
  );
  const posValues = uniqueValues(senseElements.flatMap((sense) => arrayify(sense.pos).map(textOf)));

  const word = kebValues[0] || rebValues[0] || null;
  const reading = rebValues[0] || word;

  if (!entSeq || !word || !reading || !glosses.length) {
    return null;
  }

  return {
    entSeq,
    word,
    primarySpelling: kebValues[0] || null,
    reading,
    primaryReading: rebValues[0] || null,
    meaning: glosses.slice(0, 8).join("; "),
    wordType: pickWordType(posValues),
    level: null,
    tags: posValues,
    senseCount: senseElements.length,
    isCommon: priorities.some((priority) => priority && /^(news|ichi|spec|gai)/.test(priority)),
    isKanaOnly: kebValues.length === 0,
    source: "jmdict",
    importedAt: new Date(),
    sortOrder,
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
  const entries = parseEntries(xmlText);
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection("vocabularyItems");
    await collection.createIndex({ entSeq: 1 }, { unique: true, sparse: true });
    await collection.createIndex({ source: 1, sortOrder: 1 });

    if (replaceSource) {
      await collection.deleteMany({ source: "jmdict" });
    }

    let processed = 0;
    let batch = [];

    for (const entry of entries) {
      processed += 1;
      const document = toDocument(entry, processed);
      if (document) {
        batch.push({
          updateOne: {
            filter: { entSeq: document.entSeq },
            update: { $set: document },
            upsert: true,
          },
        });
      }

      if (batch.length >= BATCH_SIZE) {
        await collection.bulkWrite(batch, { ordered: false });
        batch = [];
      }

      if (limit && processed >= limit) {
        break;
      }
    }

    if (batch.length) {
      await collection.bulkWrite(batch, { ordered: false });
    }

    console.log(`Imported ${limit ? Math.min(limit, processed) : processed} JMdict entries into MongoDB.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(`JMdict import failed: ${error.message}`);
  process.exit(1);
});
