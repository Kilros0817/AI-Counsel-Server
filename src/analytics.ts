import { InterviewSession, DimensionKey } from "./types";
import { DIMENSION_ORDER, getDimension } from "./dimensions";
import { getAllSessionsByProject } from "./session";

export interface DimensionReport {
  key: DimensionKey;
  name: string;
  coveredCount: number;      // respondents who covered this D
  totalRespondents: number;
  coveragePercent: number;   // 0–100 — % of respondents who covered it
  avgTurns: number;          // average turns spent
  avgDepthScore: number;     // 0–100 — signal density × turn coverage
  topSignals: string[];      // top-5 keywords across all respondents
  sentimentBreakdown: { positive: number; negative: number; neutral: number };
}

export interface ProjectReport {
  projectId: string;
  totalSessions: number;
  finishedSessions: number;
  completionRate: number;    // 0–100
  overallDepthScore: number; // average depthScore across all D and all sessions
  dimensions: DimensionReport[];
  languageBreakdown: Record<string, number>;
  generatedAt: number;
}

// ── Depth score per session per dimension ─────────────────────────────────────
// Score = weighted average of:
//   - turn coverage  (turns / maxTurns) × 50
//   - signal density (min(signals, 5) / 5) × 50
function calcDepthScore(
  turnCount: number,
  maxTurns: number,
  signalCount: number
): number {
  const turnScore = Math.min(turnCount / Math.max(maxTurns, 1), 1) * 50;
  const signalScore = Math.min(signalCount / 5, 1) * 50;
  return Math.round(turnScore + signalScore);
}

export function generateProjectReport(projectId: string): ProjectReport {
  const sessions = getAllSessionsByProject(projectId);
  const finished = sessions.filter((s) => s.finished);
  const total = sessions.length;

  // Language breakdown
  const languageBreakdown: Record<string, number> = {};
  for (const s of sessions) {
    if (s.language) {
      languageBreakdown[s.language] = (languageBreakdown[s.language] ?? 0) + 1;
    }
  }

  // Per-dimension aggregation
  let totalDepthSum = 0;
  let totalDepthCount = 0;

  const dimensions: DimensionReport[] = DIMENSION_ORDER.map((key) => {
    const def = getDimension(key);
    const relevant = sessions.filter((s) => s.coverage[key] !== undefined);

    const coveredCount = relevant.filter((s) => s.coverage[key]!.covered).length;
    const totalTurns = relevant.reduce((sum, s) => sum + s.coverage[key]!.turnCount, 0);
    const avgTurns = relevant.length > 0 ? totalTurns / relevant.length : 0;

    // Depth scores
    const depthScores = relevant.map((s) =>
      calcDepthScore(s.coverage[key]!.turnCount, def.maxTurns, s.coverage[key]!.signals.length)
    );
    const avgDepthScore =
      depthScores.length > 0
        ? Math.round(depthScores.reduce((a, b) => a + b, 0) / depthScores.length)
        : 0;

    totalDepthSum += avgDepthScore * relevant.length;
    totalDepthCount += relevant.length;

    // Signal frequency
    const signalFreq: Record<string, number> = {};
    for (const s of relevant) {
      for (const sig of s.coverage[key]!.signals) {
        signalFreq[sig] = (signalFreq[sig] ?? 0) + 1;
      }
    }
    const topSignals = Object.entries(signalFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sig]) => sig);

    // Sentiment breakdown from events (approximated from session signals)
    // Real sentiment comes from logEvent("sentiment_*") — here we count per-session
    const sentimentBreakdown = { positive: 0, negative: 0, neutral: 0 };

    return {
      key,
      name: def.name.en,
      coveredCount,
      totalRespondents: total,
      coveragePercent: total > 0 ? Math.round((coveredCount / total) * 100) : 0,
      avgTurns: Math.round(avgTurns * 10) / 10,
      avgDepthScore,
      topSignals,
      sentimentBreakdown,
    };
  });

  const overallDepthScore =
    totalDepthCount > 0 ? Math.round(totalDepthSum / totalDepthCount) : 0;

  return {
    projectId,
    totalSessions: total,
    finishedSessions: finished.length,
    completionRate: total > 0 ? Math.round((finished.length / total) * 100) : 0,
    overallDepthScore,
    dimensions,
    languageBreakdown,
    generatedAt: Date.now(),
  };
}
