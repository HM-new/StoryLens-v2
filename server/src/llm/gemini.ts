import { GoogleGenAI } from '@google/genai';
import type { ChatMessage } from '../types.js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 120_000);

export interface ToolUseEvent {
  tool: string;
  detail: string;
}

export interface CallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  toolCalls: ToolUseEvent[];
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY missing. Set it in StoryLens-v2/.env to run Phase 1.');
  }
  return new GoogleGenAI({ apiKey });
}

// Convert our chat history shape to Gemini's contents format.
// Gemini uses 'user' and 'model' role names.
function chatToContents(chat: ChatMessage[]) {
  return chat.map((m) => ({
    role: m.role === 'user' ? ('user' as const) : ('model' as const),
    parts: [{ text: m.content }],
  }));
}

/**
 * Run a Gemini call with Google Search grounding, bounded by a hard timeout.
 * Same shape as the Anthropic wrapper so phase1_research.ts can swap imports.
 */
export async function callGeminiWithSearch(
  chat: ChatMessage[],
  onTool?: (e: ToolUseEvent) => void
): Promise<CallResult> {
  const client = getClient();
  console.log(
    `[gemini] starting call: model=${MODEL}, messages=${chat.length}, google_search ON, timeout=${TIMEOUT_MS / 1000}s`
  );
  const startTs = Date.now();

  const call = client.models.generateContent({
    model: MODEL,
    contents: chatToContents(chat),
    config: {
      tools: [{ googleSearch: {} }],
      maxOutputTokens: 16384,
    },
  });

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Gemini call timed out after ${TIMEOUT_MS / 1000}s`)),
      TIMEOUT_MS
    )
  );

  const response = await Promise.race([call, timeout]);

  const text = response.text || '';
  const usage = response.usageMetadata;
  const inputTokens = usage?.promptTokenCount || 0;
  const outputTokens = usage?.candidatesTokenCount || 0;

  // Extract search queries from grounding metadata so the admin's tool log
  // shows what Gemini actually searched for.
  const toolCalls: ToolUseEvent[] = [];
  const meta = response.candidates?.[0]?.groundingMetadata;
  if (meta?.webSearchQueries) {
    for (const q of meta.webSearchQueries) {
      const ev = { tool: 'google_search', detail: q };
      toolCalls.push(ev);
      onTool?.(ev);
    }
  }

  console.log(
    `[gemini] complete in ${((Date.now() - startTs) / 1000).toFixed(1)}s · ` +
      `${inputTokens} in / ${outputTokens} out · ${toolCalls.length} searches · ${text.length} chars`
  );

  if (text.length < 200) {
    throw new Error(`Gemini returned insufficient content (${text.length} chars)`);
  }

  return { text, inputTokens, outputTokens, toolCalls };
}

/**
 * Plain text-in/text-out — for later phases that don't need search.
 */
export async function callGemini(chat: ChatMessage[]): Promise<CallResult> {
  const client = getClient();
  const startTs = Date.now();

  const call = client.models.generateContent({
    model: MODEL,
    contents: chatToContents(chat),
    config: { maxOutputTokens: 16384 },
  });

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Gemini call timed out after ${TIMEOUT_MS / 1000}s`)),
      TIMEOUT_MS
    )
  );

  const response = await Promise.race([call, timeout]);

  const text = response.text || '';
  const usage = response.usageMetadata;
  console.log(
    `[gemini] plain call ${((Date.now() - startTs) / 1000).toFixed(1)}s · ` +
      `${usage?.promptTokenCount || 0} in / ${usage?.candidatesTokenCount || 0} out`
  );

  return {
    text,
    inputTokens: usage?.promptTokenCount || 0,
    outputTokens: usage?.candidatesTokenCount || 0,
    toolCalls: [],
  };
}
