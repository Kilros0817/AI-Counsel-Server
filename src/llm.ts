import OpenAI from "openai";
import { ProxyAgent } from "undici";
import { InterviewSession } from "./types";
import { buildSystemPrompt, trimHistory, MAX_REPLY_TOKENS } from "./prompt";
import { logEvent } from "./session";

let client: OpenAI | null = null;

// ── Usage tracking (in-memory, replace with DB in production) ─────────────────
interface UsageRecord {
  token: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: number;
}
const usageLog: UsageRecord[] = [];

export function getUsageLog(): UsageRecord[] { return usageLog; }

export function getUsageSummary() {
  const total = usageLog.reduce(
    (acc, r) => ({
      promptTokens: acc.promptTokens + r.promptTokens,
      completionTokens: acc.completionTokens + r.completionTokens,
      totalTokens: acc.totalTokens + r.totalTokens,
      calls: acc.calls + 1,
    }),
    { promptTokens: 0, completionTokens: 0, totalTokens: 0, calls: 0 }
  );
  return total;
}

function getClient(): OpenAI {
  if (client) return client;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const proxyUrl = process.env.PROXY_URL;
  const proxyAgent = proxyUrl ? new ProxyAgent(proxyUrl) : null;

  client = new OpenAI({
    apiKey,
    baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
    fetch: proxyAgent
      ? (url: string, options?: RequestInit) =>
          fetch(url, { ...(options as any), dispatcher: proxyAgent } as any)
      : undefined,
  });

  return client;
}

export async function getLLMReply(session: InterviewSession): Promise<string> {
  const ai = getClient();
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const systemPrompt = buildSystemPrompt(session);
  const history = trimHistory(
    session.history.map((m) => ({ role: m.role, content: m.content }))
  );

  const response = await ai.chat.completions.create({
    model,
    max_tokens: MAX_REPLY_TOKENS,
    temperature: 0.85,        // slightly higher = more natural variation
    frequency_penalty: 0.8,   // strongly discourages repeating same words/phrases
    presence_penalty: 0.5,    // encourages introducing new angles
    messages: [{ role: "system", content: systemPrompt }, ...history],
  }).catch((err: any) => {
    console.error("[OpenAI REQUEST FAILED]", {
      status: err?.status,
      message: err?.message,
      code: err?.code,
      type: err?.type,
      headers: err?.headers,
      cause: err?.cause?.message ?? err?.cause,
    });
    throw err;
  });

  // Log token usage
  if (response.usage) {
    const rec: UsageRecord = {
      token: session.token,
      model,
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
      timestamp: Date.now(),
    };
    usageLog.push(rec);
    logEvent(
      session.token,
      "llm_usage",
      `prompt=${rec.promptTokens} completion=${rec.completionTokens} total=${rec.totalTokens}`
    );
  }

  return response.choices[0]?.message?.content?.trim() ?? "";
}

export async function streamLLMReply(
  session: InterviewSession,
  onChunk: (chunk: string) => void
): Promise<string> {
  const ai = getClient();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const systemPrompt = buildSystemPrompt(session);
  const history = trimHistory(
    session.history.map((m) => ({ role: m.role, content: m.content }))
  );

  const stream = await ai.chat.completions.create({
    model,
    max_tokens: MAX_REPLY_TOKENS,
    temperature: 0.85,
    frequency_penalty: 0.8,
    presence_penalty: 0.5,
    stream: true,
    stream_options: { include_usage: true },
    messages: [{ role: "system", content: systemPrompt }, ...history],
  });

  let full = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) { full += delta; onChunk(delta); }

    // usage comes in the last chunk when stream_options.include_usage is set
    if (chunk.usage) {
      usageLog.push({
        token: session.token,
        model,
        promptTokens: chunk.usage.prompt_tokens,
        completionTokens: chunk.usage.completion_tokens,
        totalTokens: chunk.usage.total_tokens,
        timestamp: Date.now(),
      });
    }
  }
  return full;
}
