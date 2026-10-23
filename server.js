import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || "gpt-5.5";

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: null
    }
  }
}));
app.use(express.json({ limit: "12kb" }));

const askLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.ASK_RATE_LIMIT || 20),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many questions in a short time. Please wait a little and try again." }
});

app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
});

app.post("/api/ask", askLimiter, async (req, res) => {
  const subject = typeof req.body?.subject === "string" ? req.body.subject.trim() : "";
  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  const allowedSubjects = new Set([
    "Law of Torts", "English Jurisprudence", "Fehm-e-Quran 2",
    "The Pakistan Environmental Act", "AI with Law", "English"
  ]);

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "AI service is not configured yet. The website owner must add OPENAI_API_KEY to the server environment." });
  }
  if (!allowedSubjects.has(subject)) {
    return res.status(400).json({ error: "Please choose a valid subject." });
  }
  if (!question || question.length > 4000) {
    return res.status(400).json({ error: "Enter a question of 1 to 4,000 characters." });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30000, maxRetries: 1 });
    const response = await client.responses.create({
      model,
      instructions: [
        "You are the study assistant for Royal Law College Notes, helping an LLB student.",
        "Answer in clear, structured, student-friendly language. Use headings, definitions, examples and a short conclusion when suitable.",
        "If the user asks in Urdu or Roman Urdu, answer in the same language unless they request otherwise.",
        "Do not claim you have read course PDFs or college notes unless their content was explicitly provided in this request.",
        "For legal questions, distinguish educational explanation from legal advice. Do not invent statutory section numbers, cases, quotations, or citations.",
        "For Pakistani law, explain uncertainty and tell the student to verify current legislation and assigned course materials.",
        "If the question is outside the selected subject, briefly mention that and still help when appropriate."
      ].join(" "),
      input: `Selected subject: ${subject}\nStudent question: ${question}`
    });
    const answer = response.output_text?.trim();
    if (!answer) return res.status(502).json({ error: "The AI returned an empty answer. Please try again." });
    return res.json({ answer });
  } catch (err) {
    console.error("AI request failed:", err?.status || "", err?.message || "Unknown error");
    if (err?.status === 401 || err?.status === 403) {
      return res.status(502).json({ error: "The AI API key was rejected. The website owner should check the key in server settings." });
    }
    if (err?.status === 429) {
      return res.status(429).json({ error: "The AI service is busy or its usage limit has been reached. Please try later." });
    }
    return res.status(502).json({ error: "The AI service could not answer right now. Please try again shortly." });
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API route not found." });
  res.sendFile(path.join(__dirname, "public", "index.html"), err => { if (err) next(err); });
});

app.listen(port, () => {
  console.log(`Royal Law College AI server listening on port ${port}`);
  console.log(`Model: ${model}`);
});
