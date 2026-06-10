import { Router } from 'express';
import { listStories, readStory, writeArtifact, writeStory } from '../storage/fs.js';
import { approvePhase, restartPhase } from '../pipeline/orchestrator.js';
import { refinePhase1 } from '../pipeline/phase1_research.js';
import { refinePhase2 } from '../pipeline/phase2_calibrate.js';
import { refinePhase3 } from '../pipeline/phase3_narrative.js';
import { refinePhase5a } from '../pipeline/phase5a_script.js';
import { refinePhase5b } from '../pipeline/phase5b_playbook.js';
import { regenerateSinglePage } from '../pipeline/phase6_images.js';
import { runCascadeFromPhase5a } from '../pipeline/cascade.js';
import type { PhaseKey } from '../types.js';

// Artifact filename per phase — the canonical .md file on disk
const ARTIFACT_FILE: Record<PhaseKey, string | null> = {
  phase1: 'news_doc.md',
  phase2: 'calibrated.md',
  phase3: 'narrative.md',
  phase5a: 'script.md',
  phase5b: 'playbook.md',
  phase6: null,
};

export const adminRouter = Router();

// GET /api/admin/stories — full list, full state
adminRouter.get('/stories', async (_req, res) => {
  const all = await listStories();
  res.json(all);
});

// GET /api/admin/stories/:id
adminRouter.get('/stories/:id', async (req, res) => {
  const s = await readStory(req.params.id);
  if (!s) return res.status(404).json({ error: 'not found' });
  res.json(s);
});

// POST /api/admin/stories/:id/phases/:phase/approve
adminRouter.post('/stories/:id/phases/:phase/approve', async (req, res) => {
  try {
    await approvePhase(req.params.id, req.params.phase);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/admin/stories/:id/phases/:phase/restart
adminRouter.post('/stories/:id/phases/:phase/restart', async (req, res) => {
  try {
    await restartPhase(req.params.id, req.params.phase);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/admin/stories/:id/phases/:phase/accept-proposal
// Promote proposedArtifact → canonical artifact + write to disk
adminRouter.post('/stories/:id/phases/:phase/accept-proposal', async (req, res) => {
  try {
    const story = await readStory(req.params.id);
    if (!story) return res.status(404).json({ error: 'not found' });
    const phaseKey = req.params.phase as PhaseKey;
    const p = story.phases[phaseKey];
    if (!p) return res.status(400).json({ error: `Phase ${phaseKey} has no state yet` });
    if (!p.proposedArtifact)
      return res.status(400).json({ error: `Phase ${phaseKey} has no pending proposal` });

    p.artifact = p.proposedArtifact;
    p.proposedArtifact = undefined;
    p.proposalNote = undefined;
    await writeStory(story);

    const filename = ARTIFACT_FILE[phaseKey];
    if (filename) await writeArtifact(story.id, filename, p.artifact);

    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/admin/stories/:id/phases/:phase/reject-proposal
// Discard proposedArtifact, keep canonical
adminRouter.post('/stories/:id/phases/:phase/reject-proposal', async (req, res) => {
  try {
    const story = await readStory(req.params.id);
    if (!story) return res.status(404).json({ error: 'not found' });
    const phaseKey = req.params.phase as PhaseKey;
    const p = story.phases[phaseKey];
    if (!p) return res.status(400).json({ error: `Phase ${phaseKey} has no state yet` });
    if (!p.proposedArtifact)
      return res.status(400).json({ error: `Phase ${phaseKey} has no pending proposal` });

    p.proposedArtifact = undefined;
    p.proposalNote = undefined;
    await writeStory(story);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/admin/stories/:id/cascade-refine
// "Refine the script and regenerate everything" — runs 5A refine + 5B + 6 in sequence,
// auto-accepting intermediate phases. Used from the Phase 6 gallery.
// Body: { fromPhase: 'phase5a', message: string }
adminRouter.post('/stories/:id/cascade-refine', async (req, res) => {
  const { fromPhase, message } = (req.body ?? {}) as { fromPhase?: string; message?: string };
  if (!message || !message.trim()) return res.status(400).json({ error: 'message is required' });
  if (fromPhase !== 'phase5a')
    return res.status(400).json({ error: 'only fromPhase=phase5a is supported in v1' });
  // Fire-and-forget — frontend polls
  void runCascadeFromPhase5a(req.params.id, message.trim()).catch((err) => {
    console.error('cascade failed:', err);
  });
  res.json({ ok: true, message: 'cascade started — poll for progress' });
});

// POST /api/admin/stories/:id/phases/phase6/regenerate-page
// Body: { filename: string }
adminRouter.post('/stories/:id/phases/phase6/regenerate-page', async (req, res) => {
  const { filename } = (req.body ?? {}) as { filename?: string };
  if (!filename || !/^[a-zA-Z0-9._-]+\.(png|jpe?g|webp)$/.test(filename)) {
    return res.status(400).json({ error: 'valid filename is required' });
  }
  try {
    const result = await regenerateSinglePage(req.params.id, filename);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/admin/stories/:id/phases/:phase/refine
// Body: { message: string }
adminRouter.post('/stories/:id/phases/:phase/refine', async (req, res) => {
  const { message } = (req.body ?? {}) as { message?: string };
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }
  try {
    if (req.params.phase === 'phase1') {
      void refinePhase1(req.params.id, message.trim()).catch((err) =>
        console.error('Phase 1 refine failed:', err)
      );
      return res.json({ ok: true });
    }
    if (req.params.phase === 'phase2') {
      void refinePhase2(req.params.id, message.trim()).catch((err) =>
        console.error('Phase 2 refine failed:', err)
      );
      return res.json({ ok: true });
    }
    if (req.params.phase === 'phase3') {
      void refinePhase3(req.params.id, message.trim()).catch((err) =>
        console.error('Phase 3 refine failed:', err)
      );
      return res.json({ ok: true });
    }
    if (req.params.phase === 'phase5a') {
      void refinePhase5a(req.params.id, message.trim()).catch((err) =>
        console.error('Phase 5A refine failed:', err)
      );
      return res.json({ ok: true });
    }
    if (req.params.phase === 'phase5b') {
      void refinePhase5b(req.params.id, message.trim()).catch((err) =>
        console.error('Phase 5B refine failed:', err)
      );
      return res.json({ ok: true });
    }
    res.status(400).json({ error: `Refining ${req.params.phase} not yet supported` });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
