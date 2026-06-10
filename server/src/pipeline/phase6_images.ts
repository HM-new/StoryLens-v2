import fs from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { readArtifact, readStory, writeStory } from '../storage/fs.js';
import { PROJECT_ROOT, storyDir } from '../storage/paths.js';
import { generateImage } from '../llm/gemini-image.js';
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
      const result = await generateImage({ prompt: prompt.text, referenceImagePaths: refs });
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

  // Bump phase6 token counters so the admin sees regen cost
  const refreshed = (await readStory(storyId))!;
  const p6 = refreshed.phases.phase6;
  if (p6) {
    p6.inputTokens = (p6.inputTokens || 0) + inputTokens;
    p6.outputTokens = (p6.outputTokens || 0) + outputTokens;
    await writeStory(refreshed);
  }

  publish(storyId, {
    type: 'page',
    pageNum: target.index + 1,
    totalPages: prompts.length,
    url: `/api/stories/${storyId}/images/${filename}`,
  });

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

  story.status = 'generating-images';
  story.phases.phase6 = {
    status: 'running',
    chat: [],
    startedAt: new Date().toISOString(),
    inputTokens: 0,
    outputTokens: 0,
  };
  story.artifacts = { ...(story.artifacts || {}), pages: [] };
  await writeStory(story);
  publish(storyId, { type: 'status', status: 'generating-images' });
  publish(storyId, { type: 'phase', phase: 'phase6', status: 'running' });

  let prevPagePath: string | null = null;
  let totalIn = 0;
  let totalOut = 0;
  const failures: { prompt: PagePrompt; error: string }[] = [];

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

      // Update Story.artifacts as each image lands so polling can show progress
      const filename = path.basename(outPath);
      const url = `/api/stories/${storyId}/images/${filename}`;
      const refreshed = (await readStory(storyId)) as Story;
      if (p.isCover || p.index === 0) {
        refreshed.artifacts = { ...(refreshed.artifacts || {}), cover: url };
      } else {
        const pages = refreshed.artifacts?.pages || [];
        pages.push({ num: p.number, url });
        refreshed.artifacts = { ...(refreshed.artifacts || {}), pages };
      }
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
      failures.push({ prompt: p, error: msg });
      // Continue to next page rather than aborting the whole comic
    }
  }

  const finishedAt = new Date().toISOString();
  const final = (await readStory(storyId)) as Story;
  final.phases.phase6 = {
    ...(final.phases.phase6 || { status: 'pending', chat: [] }),
    status: failures.length === prompts.length ? 'error' : 'awaiting-review',
    artifact: JSON.stringify(
      {
        totalPrompts: prompts.length,
        generated: prompts.length - failures.length,
        failures: failures.map((f) => ({ title: f.prompt.title, error: f.error })),
      },
      null,
      2
    ),
    chat: [],
    startedAt: final.phases.phase6?.startedAt,
    finishedAt,
    durationMs: final.phases.phase6?.startedAt
      ? new Date(finishedAt).getTime() - new Date(final.phases.phase6.startedAt).getTime()
      : 0,
    inputTokens: totalIn,
    outputTokens: totalOut,
    error: failures.length === prompts.length ? 'all pages failed' : undefined,
  };
  if (failures.length === 0) {
    final.status = 'ready';
  }
  await writeStory(final);
  publish(storyId, { type: 'phase', phase: 'phase6', status: final.phases.phase6.status });
  if (failures.length === 0) publish(storyId, { type: 'done' });
}
