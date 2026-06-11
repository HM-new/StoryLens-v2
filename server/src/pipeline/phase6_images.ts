import fs from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { readArtifact, readStory, writeStory } from '../storage/fs.js';
import { PROJECT_ROOT, storyDir } from '../storage/paths.js';
import { generateImage } from '../llm/image.js';
import { publish } from '../events/bus.js';
import { parsePlaybook, type PagePrompt } from './playbookParser.js';
import type { Story } from '../types.js';

/**
 * Phase 6 — Image Generation.
 * - Parses playbook.md into per-page prompts
 * - For each, calls Gemini with [styleRef, prevPage, promptText] in parallel-safe sequence
 * - Saves images to data/stories/<id>/images/<name>.png
 * - Updates Story.artifacts.cover and Story.artifacts.pages
 *
 * No Canvas-like proposal review — images aren't text-diffable. Studio shows
 * the running gallery and the user can re-run the whole phase if quality is off.
 */

function resolveStyleReference(styleId: string): string | null {
  const dir = path.join(PROJECT_ROOT, 'styles', styleId);
  if (!existsSync(dir)) return null;
  const explicit = path.join(dir, 'reference.png');
  if (existsSync(explicit)) return explicit;
  try {
    const files = readdirSync(dir);
    const candidates = files.filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
    return candidates.length ? path.join(dir, candidates[0]) : null;
  } catch {
    return null;
  }
}

function filenameFor(p: PagePrompt): string {
  if (p.isCover || p.index === 0) return 'cover.png';
  return `page_${String(p.number).padStart(2, '0')}.png`;
}

const MAX_RETRIES = 3;
const QA_MAX_RETRIES = Number(process.env.IMAGE_QA_MAX_RETRIES || 2);
const QA_MODEL = process.env.OPENAI_IMAGE_QA_MODEL || 'gpt-5.5';
const EXPECTED_ASPECT = 2 / 3;

interface ImageQaResult {
  pass: boolean;
  reason: string;
}

interface Phase6Failure {
  promptNumber: number;
  title: string;
  filename: string;
  error: string;
}

interface Phase6Manifest {
  totalPrompts: number;
  generated: number;
  failures: Phase6Failure[];
}

function imageUrl(storyId: string, filename: string): string {
  return `/api/stories/${storyId}/images/${filename}`;
}

function upsertImageArtifact(story: Story, prompt: PagePrompt, filename: string): string {
  const url = imageUrl(story.id, filename);
  if (prompt.isCover || prompt.index === 0) {
    story.artifacts = { ...(story.artifacts || {}), cover: url };
    return url;
  }

  const pages = (story.artifacts?.pages || []).filter((p) => p.num !== prompt.number);
  pages.push({ num: prompt.number, url });
  pages.sort((a, b) => a.num - b.num);
  story.artifacts = { ...(story.artifacts || {}), pages };
  return url;
}

function hasAllGeneratedArtifacts(story: Story, prompts: PagePrompt[]): boolean {
  return prompts.every((prompt) => {
    if (prompt.isCover || prompt.index === 0) return Boolean(story.artifacts?.cover);
    return Boolean((story.artifacts?.pages || []).some((p) => p.num === prompt.number));
  });
}

function buildPhase6Manifest(prompts: PagePrompt[], failures: Phase6Failure[]): Phase6Manifest {
  return {
    totalPrompts: prompts.length,
    generated: prompts.length - failures.length,
    failures,
  };
}

function parsePhase6Manifest(artifact?: string): Phase6Manifest | null {
  if (!artifact) return null;
  try {
    const parsed = JSON.parse(artifact) as Partial<Phase6Manifest>;
    return {
      totalPrompts: typeof parsed.totalPrompts === 'number' ? parsed.totalPrompts : 0,
      generated: typeof parsed.generated === 'number' ? parsed.generated : 0,
      failures: Array.isArray(parsed.failures) ? parsed.failures : [],
    };
  } catch {
    return null;
  }
}

function pngDimensions(bytes: Buffer): { width: number; height: number } | null {
  if (
    bytes.length < 24 ||
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47
  ) {
    return null;
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function extractOutputText(response: unknown): string {
  const direct = (response as { output_text?: unknown }).output_text;
  if (typeof direct === 'string') return direct;

  const output = (response as { output?: unknown[] }).output || [];
  const chunks: string[] = [];
  for (const item of output) {
    const content = (item as { content?: unknown[] }).content || [];
    for (const part of content) {
      const text = (part as { text?: unknown }).text;
      if (typeof text === 'string') chunks.push(text);
    }
  }
  return chunks.join('\n') || JSON.stringify(response).slice(0, 800);
}

function parseQaJson(text: string): ImageQaResult {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { pass: true, reason: 'QA returned non-JSON; allowing page.' };
  try {
    const parsed = JSON.parse(match[0]) as { pass?: unknown; reason?: unknown };
    return {
      pass: parsed.pass !== false,
      reason: typeof parsed.reason === 'string' ? parsed.reason : 'No QA reason supplied.',
    };
  } catch {
    return { pass: true, reason: 'QA JSON parse failed; allowing page.' };
  }
}

async function runVisionQa(imageBytes: Buffer, prompt: PagePrompt): Promise<ImageQaResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { pass: true, reason: 'OPENAI_API_KEY missing; skipped vision QA.' };
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: QA_MODEL,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                `Review this generated StoryLens comic page before it is shown to kids.\n` +
                `Page title: ${prompt.title}\n\n` +
                `Return only JSON like {"pass":true,"reason":"..."}.\n\n` +
                `Fail only for obvious product-quality problems:\n` +
                `- the comic page does not fill the full 2:3 portrait canvas\n` +
                `- the page appears as a small/short/floating page inside another image\n` +
                `- severe overcrowding or dense tiny text\n` +
                `- obvious misspellings, gibberish words, pseudo-text, or unreadable main captions/dialogue\n` +
                `- major cropping that cuts off important panels or text\n\n` +
                `Pass if the page is readable and only has minor cosmetic imperfections.`,
            },
            {
              type: 'input_image',
              image_url: `data:image/png;base64,${imageBytes.toString('base64')}`,
            },
          ],
        },
      ],
    }),
  });

  const json = (await response.json()) as unknown;
  if (!response.ok) {
    return {
      pass: true,
      reason: `Vision QA skipped after API error ${response.status}: ${extractOutputText(json)}`,
    };
  }

  return parseQaJson(extractOutputText(json));
}

async function assessGeneratedPage(imageBytes: Buffer, prompt: PagePrompt): Promise<ImageQaResult> {
  const dims = pngDimensions(imageBytes);
  if (dims) {
    const aspect = dims.width / dims.height;
    const aspectDiff = Math.abs(aspect - EXPECTED_ASPECT);
    if (aspectDiff > 0.04) {
      return {
        pass: false,
        reason: `Image aspect ratio ${dims.width}x${dims.height} is not close to 2:3 portrait.`,
      };
    }
  }

  return runVisionQa(imageBytes, prompt);
}

function repairPrompt(original: string, reason: string): string {
  return (
    `${original}\n\n` +
    `QUALITY REPAIR INSTRUCTIONS:\n` +
    `The previous generation failed QA because: ${reason}\n` +
    `Regenerate the same story beat as a complete full-canvas 2:3 portrait comic page.\n` +
    `Use fewer, larger panels if needed. Make all captions and speech bubbles large, clean, and readable on a phone.\n` +
    `Remove tiny background text, fake app names, dense document text, unreadable screens, and micro-labels.\n` +
    `Do not create a short page, partial page, floating page, page-within-page mockup, or phone-screen preview.`
  );
}

async function generateOne(
  storyId: string,
  imagesDir: string,
  prompt: PagePrompt,
  styleRefPath: string | null,
  prevPagePath: string | null
): Promise<{ outPath: string; inputTokens: number; outputTokens: number }> {
  const refs: string[] = [];
  if (styleRefPath) refs.push(styleRefPath);
  if (prevPagePath) refs.push(prevPagePath);

  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      let currentPrompt = prompt.text;
      let result = await generateImage({ prompt: currentPrompt, referenceImagePaths: refs });
      let qa = await assessGeneratedPage(result.bytes, prompt);

      for (let qaAttempt = 0; !qa.pass && qaAttempt < QA_MAX_RETRIES; qaAttempt++) {
        console.warn(
          `[phase6] QA retry ${qaAttempt + 1}/${QA_MAX_RETRIES} for ${prompt.title}: ${qa.reason}`
        );
        currentPrompt = repairPrompt(prompt.text, qa.reason);
        result = await generateImage({ prompt: currentPrompt, referenceImagePaths: refs });
        qa = await assessGeneratedPage(result.bytes, prompt);
      }

      if (!qa.pass) {
        throw new Error(`Image QA failed: ${qa.reason}`);
      }

      console.log(`[phase6] QA passed for ${prompt.title}: ${qa.reason}`);
      const outPath = path.join(imagesDir, filenameFor(prompt));
      await fs.writeFile(outPath, result.bytes);
      return {
        outPath,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      };
    } catch (err) {
      lastErr = err;
      console.warn(
        `[phase6] retry ${attempt + 1}/${MAX_RETRIES} for ${prompt.title}: ${err instanceof Error ? err.message : String(err)}`
      );
      await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
    }
  }
  throw lastErr;
}

/**
 * Regenerate one specific page by its filename. Used by Studio when a user
 * doesn't like a particular image. Looks up the matching prompt in playbook.md,
 * uses the page-before as the prev-page reference, overwrites the file on disk.
 */
export async function regenerateSinglePage(
  storyId: string,
  filename: string
): Promise<{ filename: string; bytes: number }> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);
  const playbook = await readArtifact(storyId, 'playbook.md');
  if (!playbook) throw new Error('playbook.md missing');
  const { visualStyleId } = story.selections;
  if (!visualStyleId) throw new Error('Visual style not selected');

  const prompts = parsePlaybook(playbook);
  const target = prompts.find((p) => filenameFor(p) === filename);
  if (!target) throw new Error(`No prompt found matching ${filename}`);

  const imagesDir = path.join(storyDir(storyId), 'images');
  const styleRefPath =
    visualStyleId === 'surprise-me' ? null : resolveStyleReference(visualStyleId);

  // Previous page = the prompt right before `target` in playbook order
  let prevPagePath: string | null = null;
  if (target.index > 0) {
    const prev = prompts[target.index - 1];
    const prevFile = path.join(imagesDir, filenameFor(prev));
    if (existsSync(prevFile)) prevPagePath = prevFile;
  }

  const { outPath, inputTokens, outputTokens } = await generateOne(
    storyId,
    imagesDir,
    target,
    styleRefPath,
    prevPagePath
  );

  // Bump phase6 token counters, publish the page, and clear any failed-QA record.
  const refreshed = (await readStory(storyId))!;
  const p6 = refreshed.phases.phase6;
  if (p6) {
    const savedFilename = path.basename(outPath);
    const existingManifest = parsePhase6Manifest(p6.artifact);
    const remainingFailures =
      existingManifest?.failures.filter(
        (failure) => failure.filename !== savedFilename && failure.promptNumber !== target.number
      ) || [];

    upsertImageArtifact(refreshed, target, savedFilename);
    p6.inputTokens = (p6.inputTokens || 0) + inputTokens;
    p6.outputTokens = (p6.outputTokens || 0) + outputTokens;
    p6.artifact = JSON.stringify(
      buildPhase6Manifest(prompts, remainingFailures),
      null,
      2
    );

    const allGenerated = hasAllGeneratedArtifacts(refreshed, prompts);
    if (remainingFailures.length === 0 && allGenerated) {
      refreshed.status = 'ready';
      refreshed.error = undefined;
      p6.status = 'approved';
      p6.error = undefined;
      p6.finishedAt = new Date().toISOString();
    } else {
      refreshed.status = 'error';
      p6.status = 'error';
      p6.error = `${remainingFailures.length} page(s) failed QA`;
    }
    await writeStory(refreshed);
  }

  publish(storyId, {
    type: 'page',
    pageNum: target.index + 1,
    totalPages: prompts.length,
    url: imageUrl(storyId, filename),
  });
  if (p6?.status) publish(storyId, { type: 'phase', phase: 'phase6', status: p6.status });
  if (p6?.status === 'approved') publish(storyId, { type: 'done' });

  return { filename: path.basename(outPath), bytes: (await fs.stat(outPath)).size };
}

export async function runPhase6(storyId: string): Promise<void> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);

  const playbook = await readArtifact(storyId, 'playbook.md');
  if (!playbook) throw new Error('playbook.md missing — Phase 5B must complete first');

  const { visualStyleId } = story.selections;
  if (!visualStyleId) throw new Error('Visual style not selected');

  const prompts = parsePlaybook(playbook);
  if (prompts.length === 0) {
    throw new Error('Playbook parser found 0 generation prompts. Check playbook.md format.');
  }

  const imagesDir = path.join(storyDir(storyId), 'images');
  await fs.mkdir(imagesDir, { recursive: true });

  const styleRefPath =
    visualStyleId === 'surprise-me' ? null : resolveStyleReference(visualStyleId);
  if (!styleRefPath && visualStyleId !== 'surprise-me') {
    console.warn(`[phase6] no style reference found for ${visualStyleId}`);
  }

  story.error = undefined;
  story.status = 'generating-images';
  story.phases.phase6 = {
    status: 'running',
    chat: [],
    startedAt: new Date().toISOString(),
    inputTokens: 0,
    outputTokens: 0,
  };
  story.artifacts = { pages: [] };
  await writeStory(story);
  publish(storyId, { type: 'status', status: 'generating-images' });
  publish(storyId, { type: 'phase', phase: 'phase6', status: 'running' });

  let prevPagePath: string | null = null;
  let totalIn = 0;
  let totalOut = 0;
  const failures: Phase6Failure[] = [];

  for (let i = 0; i < prompts.length; i++) {
    const p = prompts[i];
    try {
      const { outPath, inputTokens, outputTokens } = await generateOne(
        storyId,
        imagesDir,
        p,
        styleRefPath,
        prevPagePath
      );
      totalIn += inputTokens;
      totalOut += outputTokens;
      prevPagePath = outPath;

      // Update Story.artifacts as each QA-passed image lands so polling and Reader can show progress.
      const filename = path.basename(outPath);
      const refreshed = (await readStory(storyId)) as Story;
      const url = upsertImageArtifact(refreshed, p, filename);
      await writeStory(refreshed);
      publish(storyId, {
        type: 'page',
        pageNum: p.index + 1,
        totalPages: prompts.length,
        url,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[phase6] page ${p.title} FAILED: ${msg}`);
      failures.push({
        promptNumber: p.number,
        title: p.title,
        filename: filenameFor(p),
        error: msg,
      });
      // Continue to next page rather than aborting the whole comic
    }
  }

  const finishedAt = new Date().toISOString();
  const final = (await readStory(storyId)) as Story;
  final.phases.phase6 = {
    ...(final.phases.phase6 || { status: 'pending', chat: [] }),
    status: failures.length ? 'error' : 'approved',
    artifact: JSON.stringify(buildPhase6Manifest(prompts, failures), null, 2),
    chat: [],
    startedAt: final.phases.phase6?.startedAt,
    finishedAt,
    durationMs: final.phases.phase6?.startedAt
      ? new Date(finishedAt).getTime() - new Date(final.phases.phase6.startedAt).getTime()
      : 0,
    inputTokens: totalIn,
    outputTokens: totalOut,
    error: failures.length ? `${failures.length} page(s) failed QA` : undefined,
  };
  if (failures.length === 0) {
    final.status = 'ready';
    final.error = undefined;
  } else {
    final.status = 'error';
    final.error = `${failures.length} page(s) failed QA. Retry failed pages in Studio.`;
  }
  await writeStory(final);
  publish(storyId, { type: 'phase', phase: 'phase6', status: final.phases.phase6.status });
  if (failures.length === 0) publish(storyId, { type: 'done' });
}
