import { randomUUID } from "crypto";
import { Router } from "express";
import { clearResponseCache, createResponseCache } from "../cache/responseCache.js";
import { getDatabase } from "../db/mongo.js";

const router = Router();

function buildInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function normalizeMetric(metric) {
  return ["correct_answers", "rounds_completed", "accuracy"].includes(metric)
    ? metric
    : "correct_answers";
}

function computeScore(metric, totals) {
  if (metric === "rounds_completed") {
    return totals.roundsCompleted;
  }

  if (metric === "accuracy") {
    return totals.answerCount > 0 ? Number(((totals.correctAnswers / totals.answerCount) * 100).toFixed(2)) : 0;
  }

  return totals.correctAnswers;
}

router.get("/challenges", createResponseCache(30 * 1000), async (req, res, next) => {
  try {
    const database = await getDatabase();
    const { userId = "" } = req.query;

    if (!userId.trim()) {
      return res.status(400).json({ message: "userId is required" });
    }

    const participants = await database
      .collection("challengeParticipants")
      .find({ userId: userId.trim() })
      .project({ challengeId: 1, joinedAt: 1 })
      .sort({ joinedAt: -1 })
      .toArray();

    const challengeIds = participants.map((row) => row.challengeId);
    if (!challengeIds.length) {
      return res.json([]);
    }

    const challenges = await database
      .collection("challenges")
      .find({ challengeId: { $in: challengeIds } })
      .sort({ createdAt: -1 })
      .toArray();

    const participantCounts = await database
      .collection("challengeParticipants")
      .aggregate([
        { $match: { challengeId: { $in: challengeIds } } },
        { $group: { _id: "$challengeId", participantCount: { $sum: 1 } } },
      ])
      .toArray();

    const participantCountMap = new Map(participantCounts.map((row) => [row._id, row.participantCount]));

    res.json(
      challenges.map((challenge) => ({
        challengeId: challenge.challengeId,
        title: challenge.title,
        studyType: challenge.studyType,
        metric: challenge.metric,
        targetValue: challenge.targetValue,
        startsAt: challenge.startsAt,
        endsAt: challenge.endsAt,
        inviteCode: challenge.inviteCode,
        ownerUserId: challenge.ownerUserId,
        participantCount: participantCountMap.get(challenge.challengeId) ?? 0,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.post("/challenges", async (req, res, next) => {
  try {
    const database = await getDatabase();
    const {
      ownerUserId,
      ownerEmail = "",
      title = "",
      studyType = "kanji",
      metric = "correct_answers",
      targetValue = 50,
      startsAt,
      endsAt,
    } = req.body ?? {};

    if (!ownerUserId?.trim() || !title.trim() || !startsAt || !endsAt) {
      return res.status(400).json({ message: "ownerUserId, title, startsAt, and endsAt are required" });
    }

    const challengeId = randomUUID();
    const inviteCode = buildInviteCode();
    const challengeDocument = {
      challengeId,
      ownerUserId: ownerUserId.trim(),
      ownerEmail: ownerEmail.trim(),
      title: title.trim(),
      studyType,
      metric: normalizeMetric(metric),
      targetValue: Number(targetValue) || 0,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      inviteCode,
      createdAt: new Date(),
    };

    await database.collection("challenges").insertOne(challengeDocument);
    await database.collection("challengeParticipants").insertOne({
      challengeId,
      userId: ownerUserId.trim(),
      email: ownerEmail.trim(),
      joinedAt: new Date(),
    });

    clearResponseCache();
    res.status(201).json({
      challengeId,
      inviteCode,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/challenges/join", async (req, res, next) => {
  try {
    const database = await getDatabase();
    const { userId = "", email = "", inviteCode = "" } = req.body ?? {};

    if (!userId.trim() || !inviteCode.trim()) {
      return res.status(400).json({ message: "userId and inviteCode are required" });
    }

    const challenge = await database.collection("challenges").findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    await database.collection("challengeParticipants").updateOne(
      { challengeId: challenge.challengeId, userId: userId.trim() },
      {
        $setOnInsert: {
          challengeId: challenge.challengeId,
          userId: userId.trim(),
          email: email.trim(),
          joinedAt: new Date(),
        },
      },
      { upsert: true }
    );

    clearResponseCache();
    res.json({ challengeId: challenge.challengeId });
  } catch (error) {
    next(error);
  }
});

router.get("/challenges/:challengeId", createResponseCache(30 * 1000), async (req, res, next) => {
  try {
    const database = await getDatabase();
    const { challengeId } = req.params;

    const challenge = await database.collection("challenges").findOne({ challengeId });
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    const participants = await database
      .collection("challengeParticipants")
      .find({ challengeId })
      .project({ _id: 0, userId: 1, email: 1, joinedAt: 1 })
      .sort({ joinedAt: 1 })
      .toArray();

    res.json({
      challengeId: challenge.challengeId,
      title: challenge.title,
      studyType: challenge.studyType,
      metric: challenge.metric,
      targetValue: challenge.targetValue,
      startsAt: challenge.startsAt,
      endsAt: challenge.endsAt,
      inviteCode: challenge.inviteCode,
      ownerUserId: challenge.ownerUserId,
      participants,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/challenges/:challengeId/leaderboard", createResponseCache(30 * 1000), async (req, res, next) => {
  try {
    const database = await getDatabase();
    const { challengeId } = req.params;

    const challenge = await database.collection("challenges").findOne({ challengeId });
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    const participants = await database
      .collection("challengeParticipants")
      .find({ challengeId })
      .project({ _id: 0, userId: 1, email: 1, joinedAt: 1 })
      .toArray();

    const participantIds = participants.map((entry) => entry.userId);
    if (!participantIds.length) {
      return res.json([]);
    }

    const sessions = await database
      .collection("studySessions")
      .find({
        clientId: { $in: participantIds },
        studyType: challenge.studyType,
        completedAt: {
          $gte: new Date(challenge.startsAt),
          $lte: new Date(challenge.endsAt),
        },
      })
      .project({
        clientId: 1,
        itemCount: 1,
        correctCount: 1,
        incorrectCount: 1,
      })
      .toArray();

    const participantMap = new Map(
      participants.map((participant) => [
        participant.userId,
        {
          userId: participant.userId,
          email: participant.email,
          roundsCompleted: 0,
          answerCount: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
        },
      ])
    );

    sessions.forEach((session) => {
      const entry = participantMap.get(session.clientId);
      if (!entry) return;

      entry.roundsCompleted += 1;
      entry.answerCount += Number(session.itemCount ?? 0);
      entry.correctAnswers += Number(session.correctCount ?? 0);
      entry.incorrectAnswers += Number(session.incorrectCount ?? 0);
    });

    const leaderboard = Array.from(participantMap.values())
      .map((entry) => ({
        ...entry,
        score: computeScore(challenge.metric, entry),
      }))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        if (right.correctAnswers !== left.correctAnswers) {
          return right.correctAnswers - left.correctAnswers;
        }
        return left.email.localeCompare(right.email);
      })
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
});

export default router;
