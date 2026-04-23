import { v4 as uuidv4 } from "uuid";
import {
  InterviewSession,
  Language,
  DimensionKey,
  Demographics,
  InterviewEvent,
} from "./types";
import { DIMENSION_ORDER, getDimension } from "./dimensions";

// ── In-memory store (replace with DB in production) ──────────────────────────
const sessions = new Map<string, InterviewSession>();
const events: InterviewEvent[] = [];

function initCoverage(): InterviewSession["coverage"] {
  const coverage = {} as InterviewSession["coverage"];
  for (const key of DIMENSION_ORDER) {
    coverage[key] = { key, covered: false, turnCount: 0, signals: [] };
  }
  return coverage;
}

export function createSession(
  projectId: string,
  demographicsEnabled: boolean
): InterviewSession {
  const token = uuidv4();
  const session: InterviewSession = {
    token,
    projectId,
    language: null,
    demographicsEnabled,
    demographics: null,
    demographicsSubmitted: false,
    started: false,
    finished: false,
    currentDimension: "D1",
    dimensionIndex: 0,
    coverage: initCoverage(),
    history: [],
    turnCount: 0,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };
  sessions.set(token, session);
  return session;
}

export function getSession(token: string): InterviewSession | undefined {
  return sessions.get(token);
}

export function saveSession(session: InterviewSession): void {
  session.lastActivityAt = Date.now();
  sessions.set(session.token, session);
}

export function logEvent(
  token: string,
  event: string,
  detail?: string,
  dimension?: DimensionKey
): void {
  const entry: InterviewEvent = { token, event, timestamp: Date.now() };
  if (dimension !== undefined) entry.dimension = dimension;
  if (detail !== undefined) entry.detail = detail;
  events.push(entry);
}

// ── Dimension progression ─────────────────────────────────────────────────────
export function advanceDimension(session: InterviewSession): boolean {
  const nextIndex = session.dimensionIndex + 1;
  if (nextIndex >= DIMENSION_ORDER.length) {
    session.finished = true;
    return false;
  }
  session.coverage[session.currentDimension].covered = true;
  session.dimensionIndex = nextIndex;
  session.currentDimension = DIMENSION_ORDER[nextIndex]!;
  return true;
}

export function shouldAdvance(session: InterviewSession): boolean {
  const dim = getDimension(session.currentDimension);
  const cov = session.coverage[session.currentDimension];
  return cov.turnCount >= dim.maxTurns;
}

// ── Session summary for report ────────────────────────────────────────────────
export function getSessionSummary(session: InterviewSession) {
  return {
    token: session.token,
    projectId: session.projectId,
    language: session.language,
    finished: session.finished,
    turnCount: session.turnCount,
    coverage: session.coverage,
    demographics: session.demographics,
    createdAt: session.createdAt,
    lastActivityAt: session.lastActivityAt,
  };
}

export function getAllSessionsByProject(projectId: string): InterviewSession[] {
  return Array.from(sessions.values()).filter((s) => s.projectId === projectId);
}

export function getEvents(): InterviewEvent[] {
  return events;
}
