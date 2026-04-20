import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initializeDatabase } from "./db/mongo.js";
import authRoutes from "./routes/authRoutes.js";
import challengeRoutes from "./routes/challengeRoutes.js";
import kanjiRoutes from "./routes/kanjiRoutes.js";
import practiceRoutes from "./routes/practiceRoutes.js";
import studyRoutes from "./routes/studyRoutes.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", challengeRoutes);
app.use("/api", kanjiRoutes);
app.use("/api", studyRoutes);
app.use("/api", practiceRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(express.static(frontendDistPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    next();
    return;
  }

  res.sendFile(path.join(frontendDistPath, "index.html"));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
