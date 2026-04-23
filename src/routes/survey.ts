import { Router, Request, Response } from "express";
import {
  createSession,
  getSession,
  saveSession,
  logEvent,
  advanceDimension,
  shouldAdvance,
  getSessionSummary,
} from "../session";
import { classifyInput, getGuardReply, isDuplicateQuestion, stripEmoji } from "../guards";
import { getLLMReply, streamLLMReply } from "../llm";
import { extractSignals, detectSentiment } from "../prompt";
import { Language, InterviewSession } from "../types";
import { getDimension } from "../dimensions";
import { getProject } from "../store";

const router = Router();

// ── POST /survey/public-session ───────────────────────────────────────────────
router.post("/public-session", (req: Request, res: Response) => {
  const { projectId, demographicsEnabled } = req.body as {
    projectId?: string;
    demographicsEnabled?: boolean;
  };

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  const project = getProject(projectId);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const session = createSession(projectId, project.demographicsEnabled);
  logEvent(session.token, "session_created", projectId);

  return res.status(201).json({ token: session.token });
});

// ── GET /survey/:token ────────────────────────────────────────────────────────
router.get("/:token", (req: Request, res: Response) => {
  const session = getSession(String(req.params["token"]));
  if (!session) return res.status(404).json({ error: "Session not found" });

  return res.json(getSessionSummary(session));
});

// ── POST /survey/:token/language ──────────────────────────────────────────────
router.post("/:token/language", async (req: Request, res: Response) => {
  const session = getSession(String(req.params["token"]));
  if (!session) return res.status(404).json({ error: "Session not found" });

  if (session.started) {
    return res.status(409).json({ error: "Language already locked — interview has started." });
  }

  const { language } = req.body as { language?: string };
  if (!language || !["ru", "en", "tr"].includes(language)) {
    return res.status(400).json({ error: "language must be one of: ru, en, tr" });
  }

  const project = getProject(session.projectId);
  if (project && !project.allowedLanguages.includes(language as Language)) {
    return res.status(400).json({ error: `Language '${language}' is not allowed for this project.` });
  }

  session.language = language as Language;
  logEvent(session.token, "language_set", language);

  // If no demographics required, start the interview immediately
  if (!session.demographicsEnabled) {
    session.started = true;
    const intro = await getIntroMessage(session);
    session.history.push({ role: "assistant", content: intro, timestamp: Date.now() });
    saveSession(session);
    return res.json({ message: "Language set. Interview started.", intro });
  }

  saveSession(session);
  return res.json({ message: "Language set. Please submit demographics." });
});

// ── POST /survey/:token/demographics ─────────────────────────────────────────
router.post("/:token/demographics", async (req: Request, res: Response) => {
  const session = getSession(String(req.params["token"]));
  if (!session) return res.status(404).json({ error: "Session not found" });

  if (!session.demographicsEnabled) {
    return res.status(400).json({ error: "Demographics not enabled for this project." });
  }
  if (session.demographicsSubmitted) {
    return res.status(409).json({ error: "Demographics already submitted." });
  }
  if (!session.language) {
    return res.status(400).json({ error: "Set language before submitting demographics." });
  }

  const body = req.body as Record<string, string | undefined>;
  const { fullName, department, position, ...rest } = body;
  session.demographics = {
    ...(fullName !== undefined && { fullName }),
    ...(department !== undefined && { department }),
    ...(position !== undefined && { position }),
    ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)),
  };
  session.demographicsSubmitted = true;
  session.started = true;

  logEvent(session.token, "demographics_submitted");

  const intro = await getIntroMessage(session);
  session.history.push({ role: "assistant", content: intro, timestamp: Date.now() });
  saveSession(session);

  return res.json({ message: "Demographics saved. Interview started.", intro });
});

// ── POST /survey/:token/message ───────────────────────────────────────────────
router.post("/:token/message", async (req: Request, res: Response) => {
  const session = getSession(String(req.params["token"]));
  if (!session) return res.status(404).json({ error: "Session not found" });

  if (!session.started) {
    return res.status(400).json({ error: "Interview not started yet." });
  }
  if (session.finished) {
    return res.status(400).json({ error: "Interview already finished." });
  }

  const { message } = req.body as { message?: string };
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  const lang = session.language!;
  const inputClass = classifyInput(message, lang);

  logEvent(session.token, `input_${inputClass}`, message.slice(0, 80), session.currentDimension);

  // emoji_mixed — strip emoji, treat content as normal
  const cleanMessage = inputClass === "emoji_mixed" ? stripEmoji(message) : message;

  // Guard hit — return canned reply without calling LLM
  if (inputClass !== "normal" && inputClass !== "emoji_mixed") {
    const guardReply = getGuardReply(inputClass, lang);

    // For refusal, advance dimension
    if (inputClass === "refusal") {
      session.coverage[session.currentDimension].covered = true;
      advanceDimension(session);
    }

    // For confusion, re-ask with a probe question
    if (inputClass === "confusion") {
      const dim = getDimension(session.currentDimension);
      const probes = dim.probeQuestions[lang];
      const usedProbe = probes[session.coverage[session.currentDimension].turnCount % probes.length] ?? probes[0]!;
      const reply = `${guardReply} ${usedProbe}`;
      session.history.push({ role: "user", content: message, timestamp: Date.now() });
      session.history.push({ role: "assistant", content: reply, timestamp: Date.now() });
      saveSession(session);
      return res.json({ reply, dimension: session.currentDimension, finished: session.finished });
    }

    session.history.push({ role: "user", content: message, timestamp: Date.now() });
    session.history.push({ role: "assistant", content: guardReply, timestamp: Date.now() });
    saveSession(session);
    return res.json({ reply: guardReply, dimension: session.currentDimension, finished: session.finished });
  }

  // Normal flow — update coverage signals + sentiment
  const signals = extractSignals(cleanMessage, session.currentDimension);
  const sentiment = detectSentiment(cleanMessage);
  session.coverage[session.currentDimension].signals.push(...signals);
  session.coverage[session.currentDimension].turnCount++;
  session.turnCount++;

  logEvent(session.token, `sentiment_${sentiment}`, undefined, session.currentDimension);

  session.history.push({ role: "user", content: cleanMessage, timestamp: Date.now() });

  // Check if we should advance dimension before calling LLM
  if (shouldAdvance(session)) {
    const hasNext = advanceDimension(session);
    if (!hasNext) {
      // All done
      const closing = getClosingMessage(lang);
      session.history.push({ role: "assistant", content: closing, timestamp: Date.now() });
      saveSession(session);
      logEvent(session.token, "interview_finished");
      return res.json({ reply: closing, dimension: null, finished: true });
    }
    logEvent(session.token, "dimension_advanced", session.currentDimension);
  }

  try {
    let reply = await getLLMReply(session);

    // Duplicate question guard — if LLM repeated itself, use fallback
    if (!reply || isDuplicateQuestion(reply, session.history)) {
      logEvent(session.token, "duplicate_question_blocked", undefined, session.currentDimension);
      reply = getFallback(lang);
    }

    session.history.push({ role: "assistant", content: reply, timestamp: Date.now() });
    saveSession(session);
    logEvent(session.token, "llm_reply", undefined, session.currentDimension);

    return res.json({ reply, dimension: session.currentDimension, finished: session.finished });
  } catch (err: any) {
    console.error("[LLM ERROR]", {
      status: err?.status,
      message: err?.message,
      code: err?.code,
      type: err?.type,
      cause: err?.cause,
      stack: err?.stack,
    });
    logEvent(session.token, "llm_error", err?.message);
    const fallback = getFallback(lang);
    session.history.push({ role: "assistant", content: fallback, timestamp: Date.now() });
    saveSession(session);
    return res.status(500).json({ reply: fallback, error: "LLM unavailable", finished: false });
  }
});

// ── POST /survey/:token/message/stream ────────────────────────────────────────
router.post("/:token/message/stream", async (req: Request, res: Response) => {
  const session = getSession(String(req.params["token"]));
  if (!session) return res.status(404).json({ error: "Session not found" });

  if (!session.started || session.finished) {
    return res.status(400).json({ error: "Interview not active." });
  }

  const { message } = req.body as { message?: string };
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  const lang = session.language!;
  const inputClass = classifyInput(message, lang);

  if (inputClass !== "normal") {
    const guardReply = getGuardReply(inputClass, lang);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.write(`data: ${JSON.stringify({ chunk: guardReply, done: false })}\n\n`);
    res.write(`data: ${JSON.stringify({ chunk: "", done: true, dimension: session.currentDimension })}\n\n`);
    res.end();
    return;
  }

  const signals = extractSignals(message, session.currentDimension);
  session.coverage[session.currentDimension].signals.push(...signals);
  session.coverage[session.currentDimension].turnCount++;
  session.turnCount++;
  session.history.push({ role: "user", content: message, timestamp: Date.now() });

  if (shouldAdvance(session)) {
    advanceDimension(session);
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const full = await streamLLMReply(session, (chunk) => {
      res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
    });

    session.history.push({ role: "assistant", content: full, timestamp: Date.now() });
    saveSession(session);

    res.write(
      `data: ${JSON.stringify({ chunk: "", done: true, dimension: session.currentDimension, finished: session.finished })}\n\n`
    );
    res.end();
  } catch (err: any) {
    const fallback = getFallback(lang);
    res.write(`data: ${JSON.stringify({ chunk: fallback, done: true, error: true })}\n\n`);
    res.end();
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getIntroMessage(session: InterviewSession): Promise<string> {
  const lang = session!.language as Language;
  const intros: Record<Language, string> = {
    en: "Hey — thanks for taking the time. This is a short anonymous conversation about your work experience. There are no right or wrong answers, just your honest take. Ready to start?",
    ru: "Привет — спасибо, что нашёл время. Это короткий анонимный разговор о твоём рабочем опыте. Нет правильных или неправильных ответов — только твой честный взгляд. Готов начать?",
    tr: "Merhaba — zaman ayırdığın için teşekkürler. Bu, iş deneyimin hakkında kısa ve anonim bir konuşma. Doğru ya da yanlış cevap yok — sadece dürüst görüşün. Başlamaya hazır mısın?",
  };
  return intros[lang];
}

function getClosingMessage(lang: Language): string {
  const msgs: Record<Language, string> = {
    en: "That's everything — thanks for sharing. Your responses have been recorded.",
    ru: "Это всё — спасибо, что поделился. Твои ответы записаны.",
    tr: "Hepsi bu kadar — paylaştığın için teşekkürler. Yanıtların kaydedildi.",
  };
  return msgs[lang];
}

function getFallback(lang: Language): string {
  const msgs: Record<Language, string[]> = {
    en: [
      "Can you say a bit more about that?",
      "What else comes to mind on that?",
      "What would you add to that?",
      "How did that play out in practice?",
      "What was that like day to day?",
    ],
    ru: [
      "Можешь рассказать немного подробнее?",
      "Что ещё приходит на ум?",
      "Что бы ты добавил к этому?",
      "Как это выглядело на практике?",
      "Как это ощущалось в повседневной работе?",
    ],
    tr: [
      "Bunu biraz daha açar mısın?",
      "Aklına başka ne geliyor?",
      "Buna ne eklerdin?",
      "Bu pratikte nasıl işledi?",
      "Bu günlük işte nasıl hissettirdi?",
    ],
  };
  const arr = msgs[lang];
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export default router;
