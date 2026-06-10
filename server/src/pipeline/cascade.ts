import { readArtifact, readStory, writeArtifact, writeStory } from '../storage/fs.js';
import { publish } from '../events/bus.js';
import { refinePhase5a } from './phase5a_script.js';
import { runPhase5b } from './phase5b_playbook.js';
import { regenerateSinglePage } from './phase6_images.js';
import { parsePlaybook, type PagePrompt } from './playbookParser.js';
import type { PhaseKey } from '../types.js';

function filenameFor(p: PagePrompt): string {
  if (p.isCover || p.index === 0) return 'cover.png';
  return `page_${String(p.number).padStart(2, '0')}.png`;
}

// Normalize whitespace so trivial reformatting doesn't trigger regen.
function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

interface DiffResult {
  changed: PagePrompt[];
  unchanged: PagePrompt[];
  added: PagePrompt[]; // present in new, not in old
  removed: PagePrompt[]; // present in old, not in new
}

function diffPlaybooks(oldPrompts: PagePrompt[], newPrompts: PagePrompt[]): DiffResult {
  const result: DiffResult = { changed: [], unchanged: [], added: [], removed: [] };
  // Align by playbook index (preserves order). If the script restructured to a different page
  // count, the trailing pages will be flagged added/removed.
  const maxLen = Math.max(oldPrompts.length, newPrompts.length);
  for (let i = 0; i < maxLen; i++) {
    const o = oldPrompts[i];
    const n = newPrompts[i];
    if (!o && n) result.added.push(n);
    else if (o && !n) result.removed.push(o);
    else if (o && n) {
      if (normalize(o.text) === normalize(n.text)) result.unchanged.push(n);
      else result.changed.push(n);
    }
  }
  return result;
}

/**
 * Edit-script-and-selectively-regenerate cascade.
 *
 * - Refines Phase 5A with the user's message
 * - Auto-accepts the proposal (script.md updated)
 * - Re-runs Phase 5B (full playbook reconvert — fast text-only call)
 * - Auto-approves 5B
 * - **Diffs old vs new playbook page-by-page**
 * - Regenerates ONLY the pages whose prompt text changed (sequential, prev-page chain preserved)
 * - Untouched pages keep their existing images
 *
 * Net effect: minimal image regen for minimal-script-change refinements. If the user
 * said "fix page 4" and Gemini honored that, only page 4 is re-rendered.
 */
export async function runCascadeFromPhase5a(storyId: string, message: string): Promise<void> {
  console.log(`[cascade] ${storyId}: starting selective cascade from message: "${message.slice(0, 80)}"`);

  // 0. Snapshot the OLD playbook BEFORE anything changes
  const oldPlaybook = await readArtifact(storyId, 'playbook.md');
  const oldPrompts: PagePrompt[] = oldPlaybook ? parsePlaybook(oldPlaybook) : [];
  console.log(`[cascade] old playbook had ${oldPrompts.length} prompts`);

  // 1. Refine 5A — fire the LLM call, wait for the proposal
  await refinePhase5a(storyId, message);

  // 2. Auto-accept the 5A proposal
  const s1 = (await readStory(storyId))!;
  const p5a = s1.phases.phase5a;
  if (!p5a?.proposedArtifact) {
    throw new Error('cascade: Phase 5A refinement did not produce a proposed artifact');
  }
  p5a.artifact = p5a.proposedArtifact;
  p5a.proposedArtifact = undefined;
  p5a.proposalNote = undefined;
  await writeArtifact(storyId, 'script.md', p5a.artifact!);

  // 3. Reset 5B to pending so runPhase5b will produce a fresh playbook
  s1.phases.phase5b = { status: 'pending', chat: [] };
  await writeStory(s1);
  publish(storyId, { type: 'phase', phase: 'phase5b' as PhaseKey, status: 'pending' });

  // 4. Run 5B
  await runPhase5b(storyId);

  // 5. Auto-approve 5B
  const s2 = (await readStory(storyId))!;
  if (s2.phases.phase5b?.status !== 'awaiting-review') {
    throw new Error(`cascade: Phase 5B finished with unexpected status ${s2.phases.phase5b?.status}`);
  }
  s2.phases.phase5b.status = 'approved';
  await writeStory(s2);
  publish(storyId, { type: 'phase', phase: 'phase5b' as PhaseKey, status: 'approved' });

  // 6. Read new playbook and diff against old
  const newPlaybook = await readArtifact(storyId, 'playbook.md');
  if (!newPlaybook) throw new Error('cascade: new playbook.md not found after 5B');
  const newPrompts = parsePlaybook(newPlaybook);
  const diff = diffPlaybooks(oldPrompts, newPrompts);

  console.log(
    `[cascade] playbook diff: ${diff.unchanged.length} unchanged, ${diff.changed.length} changed, ${diff.added.length} added, ${diff.removed.length} removed`
  );

  // Set Phase 6 status to running with diff metadata in the manifest
  const s3 = (await readStory(storyId))!;
  s3.status = 'generating-images';
  s3.phases.phase6 = {
    ...(s3.phases.phase6 || { chat: [] }),
    status: 'running',
    chat: [],
    startedAt: new Date().toISOString(),
    inputTokens: s3.phases.phase6?.inputTokens || 0,
    outputTokens: s3.phases.phase6?.outputTokens || 0,
    artifact: JSON.stringify(
      {
        cascadeDiff: {
          unchanged: diff.unchanged.map((p) => filenameFor(p)),
          regenerating: [...diff.changed, ...diff.added].map((p) => filenameFor(p)),
          removed: diff.removed.map((p) => filenameFor(p)),
        },
      },
      null,
      2
    ),
  };
  await writeStory(s3);
  publish(storyId, { type: 'phase', phase: 'phase6' as PhaseKey, status: 'running' });

  // 7. Regenerate only changed + added pages, in playbook order (so prev-page chain is consistent)
  const toRegen = [...diff.changed, ...diff.added].sort((a, b) => a.index - b.index);
  const failures: string[] = [];
  for (const p of toRegen) {
    const filename = filenameFor(p);
    try {
      await regenerateSinglePage(storyId, filename);
      console.log(`[cascade] regenerated ${filename}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[cascade] regen failed for ${filename}: ${msg}`);
      failures.push(`${filename}: ${msg}`);
    }
  }

  // 8. Mark Phase 6 done. Keep manifest updated with diff results.
  const final = (await readStory(storyId))!;
  final.status = failures.length ? 'error' : 'ready';
  final.phases.phase6 = {
    ...(final.phases.phase6 || { chat: [] }),
    status: failures.length ? 'error' : 'awaiting-review',
    chat: [],
    finishedAt: new Date().toISOString(),
    error: failures.length ? failures.join('; ') : undefined,
    artifact: JSON.stringify(
      {
        totalPrompts: newPrompts.length,
        regenerated: toRegen.length - failures.length,
        unchanged: diff.unchanged.length,
        failures: failures,
      },
      null,
      2
    ),
  };
  await writeStory(final);
  publish(storyId, { type: 'phase', phase: 'phase6' as PhaseKey, status: final.phases.phase6.status });

  console.log(
    `[cascade] complete: ${toRegen.length - failures.length} regenerated, ${diff.unchanged.length} preserved, ${failures.length} failed`
  );
}
