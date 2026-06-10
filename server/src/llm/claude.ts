import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage } from '../types.js';

// Model: latest Sonnet available. Update this as Anthropic releases new ones.
// Sonnet 4.5 is a strong default for prompt-following + research synthesis.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';
const MAX_TOKENS = 16000;
const MAX_ITERATIONS = 12;

export interface ToolUseEvent {
  tool: 'web_search' | 'web_fetch' | string;
  detail: string;
}

export interface CallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  toolCalls: ToolUseEvent[];
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY missing. Set it in StoryLens-v2/.env to run Phase 1.');
  }
  return new Anthropic({ apiKey });
}

// Convert our stored chat history to the SDK shape. We only persist user/assistant
// text turns; tool-use blocks from prior turns are not replayed because they
// carry server-fetched data that's stale anyway. On refinement, Claude can
// re-run searches if it needs fresh sources.
function toApiMessages(chat: ChatMessage[]): Anthropic.MessageParam[] {
  return chat.map((m) => ({ role: m.role, content: m.content }));
}

/**
 * Run a Claude call that may use web_search / web_fetch tools, looping on
 * tool_use stop reasons until end_turn or maxIterations.
 *
 * `chat` is the full conversation history including the initial user message
 * (which is the substituted prompt). The final assistant text from this call
 * should be appended to the chat by the caller.
 *
 * `onTool` fires for each tool block in each response — used to stream
 * "Searching X" / "Reading Y" progress events.
 */
export async function callClaudeWithWebTools(
  chat: ChatMessage[],
  onTool?: (e: ToolUseEvent) => void
): Promise<CallResult> {
  const client = getClient();
  const messages: Anthropic.MessageParam[] = toApiMessages(chat);

  let inputTokens = 0;
  let outputTokens = 0;
  const toolCalls: ToolUseEvent[] = [];

  console.log(`[claude] starting call: model=${MODEL}, messages=${messages.length}, with web_search`);
  const startTs = Date.now();

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const iterStart = Date.now();
    console.log(`[claude] iter ${iter}: sending request...`);
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // Anthropic-hosted server tool. max_uses=4 caps research time to ~90s.
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }],
      messages,
    });
    console.log(
      `[claude] iter ${iter} returned in ${((Date.now() - iterStart) / 1000).toFixed(1)}s, stop_reason=${response.stop_reason}`
    );

    inputTokens += response.usage.input_tokens;
    outputTokens += response.usage.output_tokens;

    // Inspect each content block for tool calls so we can stream progress.
    for (const block of response.content) {
      if (block.type === 'server_tool_use' || block.type === 'tool_use') {
        const tool = (block as { name: string }).name;
        // Best-effort detail extraction
        let detail = '';
        const input = (block as { input?: Record<string, unknown> }).input;
        if (input) {
          if (typeof input.query === 'string') detail = input.query;
          else if (typeof input.url === 'string') detail = input.url;
          else detail = JSON.stringify(input).slice(0, 200);
        }
        const ev: ToolUseEvent = { tool, detail };
        toolCalls.push(ev);
        onTool?.(ev);
        console.log(`[claude]   tool ${tool}: ${detail}`);
      }
    }

    // Append assistant turn to history for the next loop iteration.
    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'tool_use') {
      // Server-side tools execute automatically; loop and let Claude continue.
      continue;
    }
    // end_turn, max_tokens, stop_sequence, etc. → we're done
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    console.log(
      `[claude] total ${((Date.now() - startTs) / 1000).toFixed(1)}s, ` +
      `${inputTokens} in / ${outputTokens} out, ${toolCalls.length} tool calls, ${text.length} chars`
    );
    return { text, inputTokens, outputTokens, toolCalls };
  }

  throw new Error(`Claude tool-use loop hit MAX_ITERATIONS (${MAX_ITERATIONS}) without ending.`);
}

/**
 * Same as callClaudeWithWebTools but without tools — for refinement turns
 * where we don't expect Claude to search. Currently unused; kept for symmetry.
 */
export async function callClaude(chat: ChatMessage[]): Promise<CallResult> {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: toApiMessages(chat),
  });
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    toolCalls: [],
  };
}
