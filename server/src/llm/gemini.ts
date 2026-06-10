import { GoogleGenAI } from '@google/genai';
import type { ChatMessage } from '../types.js';

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const DEFAULT_BACKUP_MODELS = 'gemini-2.5-flash-lite,gemini-2.0-flash';
const BACKUP_MODELS = (process.env.GEMINI_BACKUP_MODELS || DEFAULT_BACKUP_MODELS)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);
const RETRIES_PER_MODEL = Number(process.env.GEMINI_RETRIES_PER_MODEL || 3);
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientGeminiError(err: unknown): boolean {
  const message =
    err instanceof Error ? `${err.name}: ${err.message}` : typeof err === 'string' ? err : '';
  return /503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|timed out|timeout|ETIMEDOUT|ECONNRESET|EAI_AGAIN|overload|high demand|Internal Server Error/i.test(
    message
  ) || /fetch failed/i.test(message);
}

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function generateWithModel(
  client: GoogleGenAI,
  model: string,
  chat: ChatMessage[],
  config: Record<string, unknown>
): Promise<CallResult> {
  const startTs = Date.now();
  const call = client.models.generateContent({
    model,
    contents: chatToContents(chat),
    config,
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

  const toolCalls: ToolUseEvent[] = [];
  const meta = response.candidates?.[0]?.groundingMetadata;
  if (meta?.webSearchQueries) {
    for (const q of meta.webSearchQueries) {
      const ev = { tool: 'google_search', detail: q };
      toolCalls.push(ev);
    }
  }

  console.log(
    `[gemini] complete model=${model} in ${((Date.now() - startTs) / 1000).toFixed(1)}s · ` +
      `${inputTokens} in / ${outputTokens} out · ${toolCalls.length} searches · ${text.length} chars`
  );

  if (text.length < 200) {
    throw new Error(`Gemini returned insufficient content (${text.length} chars)`);
  }

  return { text, inputTokens, outputTokens, toolCalls };
}

async function callGeminiWithFallbacks(
  chat: ChatMessage[],
  config: Record<string, unknown>,
  onTool?: (e: ToolUseEvent) => void
): Promise<CallResult> {
  const client = getClient();
  const models = [PRIMARY_MODEL, ...BACKUP_MODELS];
  let lastErr: unknown;

  modelLoop: for (const model of models) {
    for (let attempt = 1; attempt <= RETRIES_PER_MODEL; attempt++) {
      try {
        console.log(
          `[gemini] starting call: model=${model}, messages=${chat.length}, attempt=${attempt}/${RETRIES_PER_MODEL}`
        );
        const result = await generateWithModel(client, model, chat, config);
        for (const tool of result.toolCalls) onTool?.(tool);
        return result;
      } catch (err) {
        lastErr = err;
        const transient = isTransientGeminiError(err);
        console.warn(
          `[gemini] ${transient ? 'retryable' : 'fatal'} error on model=${model} attempt=${attempt}/${RETRIES_PER_MODEL}: ${describeError(err)}`
        );
        if (!transient) break;
        if (attempt < RETRIES_PER_MODEL) {
          await sleep(750 * Math.pow(2, attempt - 1));
        }
      }
    }

    if (lastErr && isTransientGeminiError(lastErr)) {
      console.warn(
        `[gemini] moving to next model after retries: ${model} -> ${models[models.indexOf(model) + 1] ?? '(none)'}`
      );
      continue modelLoop;
    }
    break;
  }

  if (lastErr && isTransientGeminiError(lastErr)) {
    throw new Error(
      `Gemini is temporarily overloaded after trying ${models.join(', ')}. Please retry in a minute.`
    );
  }

  throw lastErr instanceof Error ? lastErr : new Error(describeError(lastErr));
}

/**
 * Run a Gemini call with Google Search grounding, bounded by a hard timeout.
 * Same shape as the Anthropic wrapper so phase1_research.ts can swap imports.
 */
export async function callGeminiWithSearch(
  chat: ChatMessage[],
  onTool?: (e: ToolUseEvent) => void
): Promise<CallResult> {
  return callGeminiWithFallbacks(
    chat,
    {
      tools: [{ googleSearch: {} }],
      maxOutputTokens: 16384,
    },
    onTool
  );
}

/**
 * Plain text-in/text-out — for later phases that don't need search.
 */
export async function callGemini(chat: ChatMessage[]): Promise<CallResult> {
  return callGeminiWithFallbacks(chat, { maxOutputTokens: 16384 });
}
