import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { Story } from '../types.js';
import { listStories, readStory, writeStory } from '../storage/fs.js';
import { storyDir } from '../storage/paths.js';
import { kickoffPhase1, tryStartNextPhase } from '../pipeline/orchestrator.js';
import { generatePersonas } from '../pipeline/personas.js';
import { subscribe } from '../events/bus.js';

export const storiesRouter = Router();

// POST /api/stories — create + kick off Phase 1
storiesRouter.post('/', async (req, res) => {
  const { topic, sources } = (req.body ?? {}) as { topic?: string; sources?: string[] };
  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'topic is required' });
  }
  const story: Story = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'draft',
    mode: 'manual',
    selections: { topic: topic.trim(), sources: sources?.filter(Boolean) ?? [] },
    phases: {},
  };
  await writeStory(story);

  if (!process.env.GEMINI_API_KEY) {
    // Don't kick off; admin will show the error and the user can set the key.
    return res.status(201).json({
      storyId: story.id,
      warning: 'GEMINI_API_KEY missing — Phase 1 will not run until you set it in .env',
    });
  }

  // Fire-and-forget; the kid Generating screen polls for status
  void kickoffPhase1(story.id);
  res.status(201).json({ storyId: story.id });
});

// PATCH /api/stories/:id — update selections (age, length, narrative, persona, visual)
storiesRouter.patch('/:id', async (req, res) => {
  const story = await readStory(req.params.id);
  if (!story) return res.status(404).json({ error: 'not found' });
  const patch = req.body as Partial<Story['selections']>;
  story.selections = { ...story.selections, ...patch };
  await writeStory(story);
  // Try to advance the pipeline — e.g. setting age+length after Phase 1
  // approval should kick off Phase 2.
  await tryStartNextPhase(story.id);
  res.json({ ok: true });
});

// GET /api/stories/:id — full state (used by kid Generating screen poll)
storiesRouter.get('/:id', async (req, res) => {
  const story = await readStory(req.params.id);
  if (!story) return res.status(404).json({ error: 'not found' });
  res.json(story);
});

// SSE: GET /api/stories/:id/events
storiesRouter.get('/:id/events', async (req, res) => {
  const story = await readStory(req.params.id);
  if (!story) return res.status(404).end();

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  const send = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Replay current status once on connect
  send({ type: 'status', status: story.status });
  const phase1 = story.phases.phase1;
  if (phase1) send({ type: 'phase', phase: 'phase1', status: phase1.status });

  const unsubscribe = subscribe(req.params.id, (ev) => send(ev));

  req.on('close', () => {
    unsubscribe();
    res.end();
  });
});

// GET /api/stories/:id/images/:filename — serve a generated image from disk
// Filename is validated to prevent path traversal.
const SAFE_IMAGE_NAME = /^[a-zA-Z0-9._-]+\.(png|jpe?g|webp)$/;
storiesRouter.get('/:id/images/:filename', async (req, res) => {
  const { id, filename } = req.params;
  if (!SAFE_IMAGE_NAME.test(filename)) return res.status(400).end();
  const fp = path.join(storyDir(id), 'images', filename);
  if (!existsSync(fp)) return res.status(404).end();
  res.set('Cache-Control', 'public, max-age=86400');
  res.sendFile(fp);
});

// POST /api/stories/:id/personas — generate persona options for Walk-in-Shoes
storiesRouter.post('/:id/personas', async (req, res) => {
  try {
    const personas = await generatePersonas(req.params.id);
    res.json({ personas });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// (Optional listing for debug — not used by kid UI)
storiesRouter.get('/', async (_req, res) => {
  const all = await listStories();
  res.json(all.map((s) => ({ id: s.id, topic: s.selections.topic, status: s.status, createdAt: s.createdAt })));
});
