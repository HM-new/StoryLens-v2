import { readStory, writeStory } from '../storage/fs.js';
import { publish } from '../events/bus.js';
import { runPhase1 } from './phase1_research.js';
import { runPhase2 } from './phase2_calibrate.js';
import { runPhase3 } from './phase3_narrative.js';
import { runPhase5a } from './phase5a_script.js';
import { runPhase5b } from './phase5b_playbook.js';
import { runPhase6 } from './phase6_images.js';

/**
 * Checks the story state and starts the next phase that's now runnable.
 * Idempotent — safe to call multiple times. Called from approvePhase and
 * from PATCH /api/stories/:id so phases auto-start in either order
 * (approval-first or selection-first).
 */
export async function tryStartNextPhase(storyId: string): Promise<void> {
  const s = await readStory(storyId);
  if (!s) return;
  const { phase1, phase2, phase3, phase5a, phase5b, phase6 } = s.phases;
  const { ageBand, length, narrativeStyle, persona, visualStyleId } = s.selections;

  // Phase 2 starts when Phase 1 is approved + ageBand + length are set
  if (
    phase1?.status === 'approved' &&
    (!phase2 || phase2.status === 'pending') &&
    ageBand &&
    length
  ) {
    console.log(`[orch] ${storyId}: starting Phase 2 (phase1 approved, age=${ageBand}, length=${length})`);
    void runPhase2(storyId).catch((err) => console.error('Phase 2 failed:', err));
    return;
  }

  // Phase 3 starts when Phase 2 is approved + narrativeStyle set
  // (+ persona if walk-in-shoes — required, otherwise the prompt asks for it)
  if (
    phase2?.status === 'approved' &&
    (!phase3 || phase3.status === 'pending') &&
    narrativeStyle &&
    (narrativeStyle !== 'walk-in-shoes' || persona)
  ) {
    console.log(`[orch] ${storyId}: starting Phase 3 (phase2 approved, narrative=${narrativeStyle})`);
    void runPhase3(storyId).catch((err) => console.error('Phase 3 failed:', err));
    return;
  }

  // Phase 5A starts when Phase 3 is approved + visualStyleId set
  if (
    phase3?.status === 'approved' &&
    (!phase5a || phase5a.status === 'pending') &&
    visualStyleId
  ) {
    console.log(`[orch] ${storyId}: starting Phase 5A (phase3 approved, visual=${visualStyleId})`);
    void runPhase5a(storyId).catch((err) => console.error('Phase 5A failed:', err));
    return;
  }

  // Phase 5B starts when Phase 5A is approved
  if (phase5a?.status === 'approved' && (!phase5b || phase5b.status === 'pending')) {
    console.log(`[orch] ${storyId}: starting Phase 5B (phase5a approved)`);
    void runPhase5b(storyId).catch((err) => console.error('Phase 5B failed:', err));
    return;
  }

  // Phase 6 starts when Phase 5B is approved
  if (phase5b?.status === 'approved' && (!phase6 || phase6.status === 'pending')) {
    console.log(`[orch] ${storyId}: starting Phase 6 (phase5b approved)`);
    void runPhase6(storyId).catch((err) => console.error('Phase 6 failed:', err));
    return;
  }
}

/**
 * Approve a phase → mark approved → try to start next phase.
 */
export async function approvePhase(storyId: string, phase: string): Promise<void> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);
  const p = story.phases[phase as keyof typeof story.phases];
  if (!p || p.status !== 'awaiting-review') {
    throw new Error(`Phase ${phase} is not awaiting review (status: ${p?.status ?? 'pending'})`);
  }
  story.phases[phase as keyof typeof story.phases] = { ...p, status: 'approved' };
  await writeStory(story);
  publish(storyId, { type: 'phase', phase: phase as never, status: 'approved' });
  await tryStartNextPhase(storyId);
}

/**
 * Restart a phase from scratch — wipes chat history and artifact, re-runs the phase.
 */
export async function restartPhase(storyId: string, phase: string): Promise<void> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);
  story.phases[phase as keyof typeof story.phases] = {
    status: 'pending',
    chat: [],
  };
  await writeStory(story);

  if (phase === 'phase1') {
    void runPhase1(storyId).catch((err) => console.error('Phase 1 restart failed:', err));
    return;
  }
  if (phase === 'phase2') {
    void runPhase2(storyId).catch((err) => console.error('Phase 2 restart failed:', err));
    return;
  }
  if (phase === 'phase3') {
    void runPhase3(storyId).catch((err) => console.error('Phase 3 restart failed:', err));
    return;
  }
  if (phase === 'phase5a') {
    void runPhase5a(storyId).catch((err) => console.error('Phase 5A restart failed:', err));
    return;
  }
  if (phase === 'phase5b') {
    void runPhase5b(storyId).catch((err) => console.error('Phase 5B restart failed:', err));
    return;
  }
  if (phase === 'phase6') {
    void runPhase6(storyId).catch((err) => console.error('Phase 6 restart failed:', err));
    return;
  }
  throw new Error(`Restarting ${phase} not yet supported`);
}

export async function kickoffPhase1(storyId: string): Promise<void> {
  void runPhase1(storyId).catch((err) => console.error('Phase 1 failed:', err));
}
