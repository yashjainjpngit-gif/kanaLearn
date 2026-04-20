import { Router } from "express";
import { clearResponseCache, createResponseCache } from "../cache/responseCache.js";
import { getDatabase } from "../db/mongo.js";

const router = Router();

router.get("/practice/dashboard", createResponseCache(30 * 1000), async (req, res, next) => {
  try {
    const database = await getDatabase();
    const { clientId = "" } = req.query;

    if (!clientId.trim()) {
      return res.status(400).json({ message: "clientId is required" });
    }

    const normalizedClientId = clientId.trim();
    const progressCollection = database.collection("studyProgress");
    const sessionsCollection = database.collection("studySessions");

    const [progressByType, weakItems, sessions] = await Promise.all([
      progressCollection
        .aggregate([
          { $match: { clientId: normalizedClientId } },
          {
            $group: {
              _id: "$studyType",
              attempts: { $sum: "$attempts" },
              correctAttempts: { $sum: "$correctAttempts" },
              incorrectAttempts: { $sum: "$incorrectAttempts" },
              itemsStudied: { $sum: 1 },
              bestStreak: { $max: "$bestStreak" },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
      progressCollection
        .aggregate([
          { $match: { clientId: normalizedClientId, attempts: { $gt: 0 } } },
          {
            $project: {
              studyType: 1,
              itemId: 1,
              itemLabel: 1,
              attempts: 1,
              correctAttempts: 1,
              incorrectAttempts: 1,
              accuracyPercent: {
                $cond: [
                  { $gt: ["$attempts", 0] },
                  { $multiply: [{ $divide: ["$correctAttempts", "$attempts"] }, 100] },
                  0,
                ],
              },
            },
          },
          { $sort: { accuracyPercent: 1, incorrectAttempts: -1, attempts: -1, itemLabel: 1 } },
          { $limit: 8 },
        ])
        .toArray(),
      sessionsCollection
        .find({ clientId: normalizedClientId })
        .project({
          studyType: 1,
          itemCount: 1,
          correctCount: 1,
          incorrectCount: 1,
          completedAt: 1,
        })
        .sort({ completedAt: -1 })
        .toArray(),
    ]);

    const uniqueDays = new Set(
      sessions
        .map((session) => new Date(session.completedAt).toISOString().slice(0, 10))
        .filter(Boolean)
    );

    const totals = sessions.reduce(
      (summary, session) => ({
        rounds: summary.rounds + 1,
        answers: summary.answers + Number(session.itemCount ?? 0),
        correct: summary.correct + Number(session.correctCount ?? 0),
        incorrect: summary.incorrect + Number(session.incorrectCount ?? 0),
      }),
      { rounds: 0, answers: 0, correct: 0, incorrect: 0 }
    );

    res.json({
      totals: {
        ...totals,
        accuracyPercent: totals.answers ? (totals.correct / totals.answers) * 100 : 0,
        studyDays: uniqueDays.size,
      },
      progressByType: progressByType.map((row) => ({
        studyType: row._id,
        attempts: row.attempts,
        correctAttempts: row.correctAttempts,
        incorrectAttempts: row.incorrectAttempts,
        itemsStudied: row.itemsStudied,
        bestStreak: row.bestStreak,
      })),
      weakItems,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/practice/progress", createResponseCache(30 * 1000), async (req, res, next) => {
  try {
    const database = await getDatabase();
    const { clientId = "", studyType = "" } = req.query;

    if (!clientId.trim()) {
      return res.status(400).json({ message: "clientId is required" });
    }

    const match = { clientId: clientId.trim() };
    if (studyType.trim()) {
      match.studyType = studyType.trim();
    }

    const summaryRows = await database
      .collection("studyProgress")
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: "$studyType",
            attempts: { $sum: "$attempts" },
            correctAttempts: { $sum: "$correctAttempts" },
            incorrectAttempts: { $sum: "$incorrectAttempts" },
            lastPracticedAt: { $max: "$lastPracticedAt" },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    res.json(
      summaryRows.map((row) => ({
        studyType: row._id,
        attempts: row.attempts,
        correctAttempts: row.correctAttempts,
        incorrectAttempts: row.incorrectAttempts,
        lastPracticedAt: row.lastPracticedAt,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.get("/practice/items", createResponseCache(30 * 1000), async (req, res, next) => {
  try {
    const database = await getDatabase();
    const { clientId = "", studyType = "", limit = 50 } = req.query;

    if (!clientId.trim() || !studyType.trim()) {
      return res.status(400).json({ message: "clientId and studyType are required" });
    }

    const rows = await database
      .collection("studyProgress")
      .aggregate([
        {
          $match: {
            clientId: clientId.trim(),
            studyType: studyType.trim(),
            attempts: { $gt: 0 },
          },
        },
        {
          $project: {
            studyType: 1,
            itemId: 1,
            itemLabel: 1,
            attempts: 1,
            correctAttempts: 1,
            incorrectAttempts: 1,
            bestStreak: 1,
            currentStreak: 1,
            lastPracticedAt: 1,
            accuracyPercent: {
              $cond: [
                { $gt: ["$attempts", 0] },
                { $multiply: [{ $divide: ["$correctAttempts", "$attempts"] }, 100] },
                0,
              ],
            },
          },
        },
        { $sort: { accuracyPercent: 1, incorrectAttempts: -1, attempts: -1, itemLabel: 1 } },
        { $limit: Number(limit) || 50 },
      ])
      .toArray();

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/practice/sessions", async (req, res, next) => {
  try {
    const database = await getDatabase();
    const sessions = database.collection("studySessions");
    const answersCollection = database.collection("studySessionAnswers");
    const progressCollection = database.collection("studyProgress");
    const {
      clientId,
      studyType,
      practiceMode,
      promptMode = null,
      answerMode = null,
      itemCount = 0,
      correctCount = 0,
      incorrectCount = 0,
      accuracyPercent = 0,
      selection = null,
      answers = [],
    } = req.body ?? {};

    if (!clientId || !studyType || !practiceMode) {
      return res.status(400).json({ message: "clientId, studyType, and practiceMode are required" });
    }

    const lastSession = await sessions.find({}).sort({ id: -1 }).limit(1).toArray();
    const sessionId = (lastSession[0]?.id ?? 0) + 1;

    await sessions.insertOne({
      id: sessionId,
      clientId,
      studyType,
      practiceMode,
      promptMode,
      answerMode,
      itemCount,
      correctCount,
      incorrectCount,
      accuracyPercent: Number(accuracyPercent || 0),
      selection,
      completedAt: new Date(),
    });

    if (answers.length) {
      await answersCollection.insertMany(
        answers.map((answer, index) => ({
          sessionId,
          answerId: index + 1,
          itemId: answer.itemId,
          itemLabel: answer.itemLabel,
          promptValue: answer.promptValue ?? null,
          expectedValue: answer.expectedValue ?? null,
          selectedValue: answer.selectedValue ?? null,
          isCorrect: answer.isCorrect ?? null,
          answeredAt: new Date(),
        }))
      );

      for (const answer of answers) {
        const existingProgress = await progressCollection.findOne({
          clientId,
          studyType,
          itemId: answer.itemId,
        });
        const isCorrect = answer.isCorrect === null || answer.isCorrect === undefined ? null : Boolean(answer.isCorrect);
        const currentStreak =
          isCorrect === true
            ? (existingProgress?.currentStreak ?? 0) + 1
            : isCorrect === false
              ? 0
              : (existingProgress?.currentStreak ?? 0);
        const bestStreak = Math.max(existingProgress?.bestStreak ?? 0, currentStreak);

        await progressCollection.updateOne(
          { clientId, studyType, itemId: answer.itemId },
          {
            $set: {
              clientId,
              studyType,
              itemId: answer.itemId,
              itemLabel: answer.itemLabel,
              currentStreak,
              bestStreak,
              lastResult: isCorrect,
              lastPracticedAt: new Date(),
            },
            $inc: {
              attempts: 1,
              correctAttempts: isCorrect === true ? 1 : 0,
              incorrectAttempts: isCorrect === false ? 1 : 0,
            },
          },
          { upsert: true }
        );
      }
    }

    clearResponseCache();
    res.status(201).json({ id: sessionId });
  } catch (error) {
    next(error);
  }
});

export default router;
