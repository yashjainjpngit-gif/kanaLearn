import { Router } from "express";
import { createResponseCache } from "../cache/responseCache.js";
import { getDatabase, pingDatabase } from "../db/mongo.js";

const router = Router();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getCategoryMap(database) {
  const categories = await database.collection("categories").find({}).toArray();
  return new Map(categories.map((category) => [category.id, category]));
}

router.get("/health", async (_req, res, next) => {
  try {
    await pingDatabase();
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});

router.get("/categories", createResponseCache(10 * 60 * 1000), async (_req, res, next) => {
  try {
    const database = await getDatabase();
    const rows = await database
      .collection("categories")
      .find({})
      .sort({ sortOrder: 1, name: 1 })
      .toArray();

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/kanji", createResponseCache(5 * 60 * 1000), async (req, res, next) => {
  try {
    const database = await getDatabase();
    const { search = "", categoryId = "" } = req.query;
    const query = {};

    if (search.trim()) {
      const term = new RegExp(escapeRegex(search.trim()), "i");
      query.$or = [
        { kanjiChar: term },
        { meaning: term },
        { onyomi: term },
        { kunyomi: term },
        { exampleWord: term },
      ];
    }

    if (categoryId) {
      query.categoryId = Number(categoryId);
    }

    const [rows, categoryMap] = await Promise.all([
      database.collection("kanjiItems").find(query).sort({ categoryId: 1, id: 1 }).toArray(),
      getCategoryMap(database),
    ]);

    res.json(
      rows.map((row) => {
        const category = categoryMap.get(row.categoryId);

        return {
          id: row.id,
          kanjiCharacter: row.kanjiChar,
          character: row.kanjiChar,
          meaning: row.meaning,
          onyomi: row.onyomi,
          kunyomi: row.kunyomi,
          level: row.level,
          stroke_count: row.strokeCount,
          example_word: row.exampleWord,
          example_reading: row.exampleReading,
          example_meaning: row.exampleMeaning,
          categoryId: row.categoryId,
          categoryName: category?.name ?? "",
          categoryColor: category?.color ?? "",
        };
      })
    );
  } catch (error) {
    next(error);
  }
});

router.get("/kanji/:id", createResponseCache(10 * 60 * 1000), async (req, res, next) => {
  try {
    const database = await getDatabase();
    const id = Number(req.params.id);
    const [row, categoryMap] = await Promise.all([
      database.collection("kanjiItems").findOne({ id }),
      getCategoryMap(database),
    ]);

    if (!row) {
      return res.status(404).json({ message: "Kanji not found" });
    }

    const category = categoryMap.get(row.categoryId);

    return res.json({
      id: row.id,
      kanjiCharacter: row.kanjiChar,
      character: row.kanjiChar,
      meaning: row.meaning,
      onyomi: row.onyomi,
      kunyomi: row.kunyomi,
      level: row.level,
      stroke_count: row.strokeCount,
      example_word: row.exampleWord,
      example_reading: row.exampleReading,
      example_meaning: row.exampleMeaning,
      categoryId: row.categoryId,
      categoryName: category?.name ?? "",
      categoryDescription: category?.description ?? "",
      categoryColor: category?.color ?? "",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
