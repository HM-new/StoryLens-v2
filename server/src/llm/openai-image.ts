import fs from 'node:fs';
import path from 'node:path';
import type { ImageGenInput, ImageGenResult } from './gemini-image.js';

const RESPONSES_MODEL = process.env.OPENAI_IMAGE_RESPONSES_MODEL || 'gpt-5.5';
const TIMEOUT_MS = Number(process.env.OPENAI_IMAGE_TIMEOUT_MS || 180_000);

function getApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY missing. Set it in StoryLens-v2/.env to run Phase 6 with OpenAI images.');
  }
  return apiKey;
}

function mimeTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/png';
}

function imageContentPart(filePath: string) {
  const data = fs.readFileSync(filePath).toString('base64');
  return {
    type: 'input_image',
    image_url: `data:${mimeTypeFor(filePath)};base64,${data}`,
  };
}

function extractImageBase64(response: unknown): string | null {
  const output = (response as { output?: unknown[] }).output || [];
  for (const item of output) {
    const maybeImage = item as { type?: string; result?: unknown };
    if (maybeImage.type === 'image_generation_call' && typeof maybeImage.result === 'string') {
      return maybeImage.result;
    }
  }
  return null;
}

function extractOutputText(response: unknown): string {
  const direct = (response as { output_text?: unknown }).output_text;
  if (typeof direct === 'string') return direct;
  return JSON.stringify(response).slice(0, 400);
}

/**
 * Generate a comic page with OpenAI's Responses API image_generation tool.
 * This path can include style and previous-page image references as data URLs,
 * which helps preserve visual continuity across pages.
 */
export async function generateOpenAIImage(input: ImageGenInput): Promise<ImageGenResult> {
  const apiKey = getApiKey();
  const startTs = Date.now();

  console.log(
    `[openai-img] starting: model=${RESPONSES_MODEL}, refs=${input.referenceImagePaths.length}, prompt=${input.prompt.length} chars`
  );

  const content: unknown[] = [{ type: 'input_text', text: input.prompt }];
  for (const p of input.referenceImagePaths) {
    if (!fs.existsSync(p)) {
      console.warn(`[openai-img] reference image not found, skipping: ${p}`);
      continue;
    }
    content.push(imageContentPart(p));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: RESPONSES_MODEL,
        input: [{ role: 'user', content }],
        tools: [{ type: 'image_generation' }],
      }),
      signal: controller.signal,
    });

    const json = (await response.json()) as unknown;
    if (!response.ok) {
      const message = JSON.stringify(json);
      throw new Error(`OpenAI image request failed (${response.status}): ${message}`);
    }

    const imageBase64 = extractImageBase64(json);
    if (!imageBase64) {
      throw new Error(`OpenAI returned no image. Response: ${extractOutputText(json)}`);
    }

    const usage = (json as {
      usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
    }).usage;
    const bytes = Buffer.from(imageBase64, 'base64');
    console.log(
      `[openai-img] complete in ${((Date.now() - startTs) / 1000).toFixed(1)}s · ${bytes.length} bytes · ${usage?.input_tokens || 0} in / ${usage?.output_tokens || 0} out`
    );

    return {
      bytes,
      mimeType: 'image/png',
      inputTokens: usage?.input_tokens || 0,
      outputTokens: usage?.output_tokens || 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}
