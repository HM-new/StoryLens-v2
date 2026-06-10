import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';

// Default image model. Gemini's preview model supports text+image input AND
// image output. Override via env if the model name changes.
// `gemini-2.5-flash-image` (stable) is the default. Other options:
//   - `gemini-3.1-flash-image-preview` — better in-image text rendering
//   - `gemini-3-pro-image-preview` — premium quality
const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const TIMEOUT_MS = Number(process.env.GEMINI_IMAGE_TIMEOUT_MS || 180_000);

export interface ImageGenInput {
  prompt: string;
  /** Absolute paths to images to attach. Style ref + previous page (if any). */
  referenceImagePaths: string[];
}

export interface ImageGenResult {
  bytes: Buffer;
  mimeType: string;
  inputTokens: number;
  outputTokens: number;
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY missing. Set it in StoryLens-v2/.env to run Phase 6.');
  }
  return new GoogleGenAI({ apiKey });
}

function inlineImagePart(filePath: string) {
  const data = fs.readFileSync(filePath).toString('base64');
  const ext = filePath.split('.').pop()?.toLowerCase() || 'png';
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
  return { inlineData: { mimeType, data } };
}

/**
 * Generate one comic page image with Gemini. Stateless — every call ships the
 * full set of reference images (style ref + previous page) plus the prompt.
 * Hard timeout to prevent the API hangs we hit with Anthropic earlier.
 */
export async function generateImage(input: ImageGenInput): Promise<ImageGenResult> {
  const client = getClient();
  const startTs = Date.now();

  console.log(
    `[gemini-img] starting: model=${MODEL}, refs=${input.referenceImagePaths.length}, prompt=${input.prompt.length} chars`
  );

  const parts: unknown[] = [];
  for (const p of input.referenceImagePaths) {
    if (!fs.existsSync(p)) {
      console.warn(`[gemini-img] reference image not found, skipping: ${p}`);
      continue;
    }
    parts.push(inlineImagePart(p));
  }
  parts.push({ text: input.prompt });

  const call = client.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: parts as never }],
    config: {
      responseModalities: ['TEXT', 'IMAGE'] as never,
    },
  });

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Gemini image call timed out after ${TIMEOUT_MS / 1000}s`)),
      TIMEOUT_MS
    )
  );

  const response = await Promise.race([call, timeout]);

  const usage = response.usageMetadata;
  const inputTokens = usage?.promptTokenCount || 0;
  const outputTokens = usage?.candidatesTokenCount || 0;

  // Find the inline image data in the response
  const candParts = response.candidates?.[0]?.content?.parts || [];
  for (const part of candParts) {
    const inline = (part as { inlineData?: { data?: string; mimeType?: string } }).inlineData;
    if (inline?.data) {
      const bytes = Buffer.from(inline.data, 'base64');
      console.log(
        `[gemini-img] complete in ${((Date.now() - startTs) / 1000).toFixed(1)}s · ${bytes.length} bytes · ${inputTokens} in / ${outputTokens} out`
      );
      return {
        bytes,
        mimeType: inline.mimeType || 'image/png',
        inputTokens,
        outputTokens,
      };
    }
  }

  // No image — collect any text the model returned as the error message
  const textParts = candParts
    .map((p) => (p as { text?: string }).text)
    .filter(Boolean)
    .join(' ')
    .slice(0, 400);
  throw new Error(`Gemini returned no image. Text response: ${textParts || '(empty)'}`);
}
