import { loadPrompt } from '../prompts/loader.js';
import { readArtifact, readStory, writeArtifact, writeStory } from '../storage/fs.js';
import { callGemini } from '../llm/gemini.js';
import { AGE_LABEL, LENGTH_LABEL, NARRATIVE_LABEL, VISUAL_LABEL } from '../llm/labels.js';
import { publish } from '../events/bus.js';
import { parseRefinement, wrapForCanvasRefinement } from './refinementHelpers.js';
import type { ChatMessage } from '../types.js';

/**
 * Phase 5A — Comic Script Generator.
 *
 * Slot-substitution per iron rule on `comic_script_prompt_v2.md`. Style guide
 * is appended in the "Visual style" placeholder so Mira's per-style rendering
 * (Section 3) is available — Mira gets incorporated automatically because the
 * prompt body already plans her appearances (Part B.5) based on flagged terms
 * from Phase 3.
 *
 * Learning Angles + Flagged Terms live inside narrative.md (Phase 3's full
 * output has all 4 sections). Rather than fragile section parsing, we point
 * Phase 5A at the same narrative.md and tell it where to find each section.
 */
async function buildInitialMessage(storyId: string): Promise<string> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);

  const narrative = await readArtifact(storyId, 'narrative.md');
  if (!narrative) throw new Error('narrative.md missing — Phase 3 must complete first');

  const { ageBand, length, narrativeStyle, visualStyleId } = story.selections;
  if (!ageBand || !length || !narrativeStyle || !visualStyleId) {
    throw new Error(
      `Phase 5A inputs missing: ageBand=${ageBand} length=${length} narrative=${narrativeStyle} visual=${visualStyleId}`
    );
  }

  const promptBody = await loadPrompt('comic-script');
  const styleGuide = await loadPrompt('style-guide');

  const seeStoryDocHint =
    '(Included in the Story document above — find the matching section from Phase 3 output.)';

  // Substitute exact placeholders from lines 12-18 of comic_script_prompt_v2.md
  let substituted = promptBody
    .replace('[Paste the narrative-styled story]', narrative)
    .replace('[A / B / C / D]', AGE_LABEL[ageBand])
    .replace('[Brief / Standard / Deep Dive]', LENGTH_LABEL[length])
    .replace(
      "[Investigation / Time Traveler / Debate / Walk in Someone's Shoes]",
      NARRATIVE_LABEL[narrativeStyle]
    )
    .replace(
      "[Paste the selected style's full spec from style_guide.md]",
      `**Selected visual style:** ${VISUAL_LABEL[visualStyleId]}\n\n` +
        `(Full style_guide.md content appended below — find the section for ` +
        `"${VISUAL_LABEL[visualStyleId]}" and use its style lock + character rendering rules. ` +
        `Also read Section 3 for Mira Chen's spec and the per-style rendering paragraph for this style.)`
    )
    .replace(
      '[Paste the structured Learning Angles output from Phase 3 — primary, secondaries, and any per-side/per-era/per-clue/per-persona tags]',
      seeStoryDocHint
    )
    .replace(
      '[Paste the flagged terms list from Phase 3 — each term with its plain-language definition, the story beat where it first appears, and whether it was defined inline or tagged for the Explainer]',
      seeStoryDocHint
    );

  // Append the full style guide so the prompt body's references to it can resolve.
  substituted +=
    `\n\n---\n\n## Reference: style_guide.md (full)\n\n${styleGuide}\n\n---\n\n` +
    `IMPORTANT: Return the COMPLETE comic script as your entire response — ` +
    `Part A (Character & Setting Bible), Part B (Page-by-Page Panel Scripts), ` +
    `Part B.5 (Explainer Appearances with Mira Chen), and Part C (Cover Design). ` +
    `Do not summarize or abbreviate.`;

  return substituted;
}

export async function runPhase5a(storyId: string): Promise<void> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);

  story.status = 'scripting';
  story.phases.phase5a = {
    status: 'running',
    chat: [],
    startedAt: new Date().toISOString(),
  };
  await writeStory(story);
  publish(storyId, { type: 'status', status: 'scripting' });
  publish(storyId, { type: 'phase', phase: 'phase5a', status: 'running' });

  const initialUserText = await buildInitialMessage(storyId);
  const initialChat: ChatMessage[] = [
    { role: 'user', content: initialUserText, ts: new Date().toISOString() },
  ];

  try {
    const result = await callGemini(initialChat);
    const finishedAt = new Date().toISOString();

    const finalChat: ChatMessage[] = [
      ...initialChat,
      { role: 'assistant', content: result.text, ts: finishedAt },
    ];

    story.phases.phase5a = {
      status: 'awaiting-review',
      artifact: result.text,
      chat: finalChat,
      startedAt: story.phases.phase5a!.startedAt,
      finishedAt,
      durationMs:
        new Date(finishedAt).getTime() - new Date(story.phases.phase5a!.startedAt!).getTime(),
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    };
    await writeArtifact(storyId, 'script.md', result.text);
    await writeStory(story);
    publish(storyId, { type: 'phase', phase: 'phase5a', status: 'awaiting-review' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    story.status = 'error';
    story.error = message;
    story.phases.phase5a = {
      ...story.phases.phase5a!,
      status: 'error',
      error: message,
      finishedAt: new Date().toISOString(),
    };
    await writeStory(story);
    publish(storyId, { type: 'error', message });
    throw err;
  }
}

export async function refinePhase5a(storyId: string, userMessage: string): Promise<void> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);
  const phase = story.phases.phase5a;
  if (!phase || phase.status === 'pending')
    throw new Error('Phase 5A has not run yet for this story.');

  const wrappedUserMessage = wrapForCanvasRefinement(
    userMessage,
    'comic script (Parts A, B, B.5, and C)'
  );
  const chatWithUserTurn: ChatMessage[] = [
    ...phase.chat,
    { role: 'user', content: wrappedUserMessage, ts: new Date().toISOString() },
  ];

  story.phases.phase5a = { ...phase, status: 'running', chat: chatWithUserTurn };
  await writeStory(story);
  publish(storyId, { type: 'phase', phase: 'phase5a', status: 'running' });

  try {
    const result = await callGemini(chatWithUserTurn);
    const parsed = parseRefinement(result.text);
    const updatedChat: ChatMessage[] = [
      ...chatWithUserTurn,
      { role: 'assistant', content: result.text, ts: new Date().toISOString() },
    ];

    story.phases.phase5a = {
      ...phase,
      status: 'awaiting-review',
      proposedArtifact: parsed.artifact,
      proposalNote: parsed.plan || (parsed.parsed ? '' : '(LLM did not output a plan; treating full response as the proposed artifact.)'),
      chat: updatedChat,
      inputTokens: (phase.inputTokens || 0) + result.inputTokens,
      outputTokens: (phase.outputTokens || 0) + result.outputTokens,
    };
    await writeStory(story);
    publish(storyId, { type: 'phase', phase: 'phase5a', status: 'awaiting-review' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    story.phases.phase5a = { ...phase, status: 'error', error: message, chat: chatWithUserTurn };
    await writeStory(story);
    publish(storyId, { type: 'error', message });
    throw err;
  }
}
