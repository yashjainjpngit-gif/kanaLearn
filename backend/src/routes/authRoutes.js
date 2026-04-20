import crypto from "crypto";
import { Router } from "express";
import { getDatabase } from "../db/mongo.js";
import { sendMagicLinkEmail } from "../utils/mailer.js";

const router = Router();
const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getAppUrl(req) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];
  const protocol = forwardedProto || req.protocol || "http";
  const host = forwardedHost || req.get("host");

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.APP_URL || "http://localhost:4000";
}

// POST /api/auth/send-link
router.post("/auth/send-link", async (req, res) => {
  const { email } = req.body;
  if (!email || !String(email).includes("@")) {
    return res.status(400).json({ message: "Valid email required" });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const db = await getDatabase();
  const token = crypto.randomBytes(32).toString("hex");

  await db.collection("magicTokens").insertOne({
    token,
    email: normalizedEmail,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
    used: false,
    createdAt: new Date(),
  });

  try {
    await sendMagicLinkEmail(normalizedEmail, token, getAppUrl(req));
  } catch (err) {
    console.error("Failed to send magic link email:", err.message);
    return res.status(500).json({ message: "Failed to send email. Check SMTP configuration." });
  }

  res.json({ message: "Magic link sent" });
});

// POST /api/auth/verify
router.post("/auth/verify", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "Token required" });

  const db = await getDatabase();
  const record = await db.collection("magicTokens").findOne({ token });

  if (!record || record.used || new Date() > record.expiresAt) {
    return res.status(401).json({ message: "This link is invalid or has expired." });
  }

  // Mark token as used
  await db.collection("magicTokens").updateOne({ token }, { $set: { used: true } });

  const email = record.email;

  // Find or create user — userId doubles as clientId for progress tracking
  let user = await db.collection("users").findOne({ email });

  if (!user) {
    const userId = `user-${crypto.randomUUID()}`;
    await db.collection("users").insertOne({
      userId,
      email,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    });
    user = await db.collection("users").findOne({ email });
  } else {
    await db.collection("users").updateOne({ email }, { $set: { lastLoginAt: new Date() } });
  }

  // Create session
  const sessionToken = crypto.randomBytes(32).toString("hex");
  await db.collection("sessions").insertOne({
    sessionToken,
    userId: user.userId,
    email,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
  });

  res.json({ sessionToken, userId: user.userId, email });
});

// GET /api/auth/me — validate current session
router.get("/auth/me", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token" });

  const db = await getDatabase();
  const session = await db.collection("sessions").findOne({
    sessionToken: token,
    expiresAt: { $gt: new Date() },
  });

  if (!session) return res.status(401).json({ message: "Invalid or expired session" });

  res.json({ userId: session.userId, email: session.email });
});

// POST /api/auth/logout
router.post("/auth/logout", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    const db = await getDatabase();
    await db.collection("sessions").deleteOne({ sessionToken: token });
  }
  res.json({ message: "Logged out" });
});

export default router;
