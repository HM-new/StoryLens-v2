import { loadPrompt } from '../prompts/loader.js';
import { readArtifact, readStory, writeArtifact, writeStory } from '../storage/fs.js';
import { callGemini } from '../llm/gemini.js';
import { AGE_LABEL, NARRATIVE_LABEL } from '../llm/labels.js';
import { publish } from '../events/bus.js';
import { parseRefinement, wrapForCanvasRefinement } from './refinementHelpers.js';
import type { ChatMessage } from '../types.js';

/**
 * Phase 3 — Narrative Styling.
 * Pattern A: substitute placeholders in `narrative_style_prompt.md` then append
 * the persona line if Walk in Someone's Shoes was selected.
 */
async function buildInitialMessage(storyId: string): Promise<string> {
  const calibrated = await readArtifact(storyId, 'calibrated.md');
  if (!calibrated) throw new Error('calibrated.md missing — Phase 2 must complete first');

  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);
  const { ageBand, narrativeStyle, persona } = story.selections;
  if (!ageBand) throw new Error('Age band not selected');
  if (!narrativeStyle) throw new Error('Narrative style not selected');

  const promptBody = await loadPrompt('narrative-style');

  // Slot substitution per iron rule — exact bracketed text from the prompt's
  // ## Usage section (lines 257-262).
  let substituted = promptBody
    .replace('[Paste the age-transformed story]', calibrated)
    .replace('[A / B / C / D]', AGE_LABEL[ageBand])
    .replace(
      "[Investigation / Time Traveler / Debate / Walk in Someone's Shoes / Recommend]",
      NARRATIVE_LABEL[narrativeStyle]
    )
    .replace(
      '[Paste the list from the previous phase, if any]',
      '(None produced by Phase 2 in v1.)'
    );

  // Persona append — only for Walk in Shoes. Wraps the user's selection as an
  // appended line. Doesn't modify the prompt body. Falls under "input scaffolding"
  // not "prompt editing".
  if (narrativeStyle === 'walk-in-shoes' && persona) {
    substituted +=
      `\n\n---\n\n## Selected Persona\n\n` +
      `**Name:** ${persona.name}\n` +
      `**Description:** ${persona.desc}\n\n` +
      `Write the transformation through this persona's lens. ` +
      `Skip Step 2 (persona option generation) since the persona is already chosen.`;
  }

  substituted +=
    `\n\nIMPORTANT: Return ALL four required output sections (Learning Angles, the narrative-styled story, flagged technical terms, and the narrative choices note) as your entire response.`;

  return substituted;
}

export async function runPhase3(storyId: string): Promise<void> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);

  story.error = undefined;
  story.status = 'styling-narrative';
  story.phases.phase3 = {
    status: 'running',
    chat: [],
    startedAt: new Date().toISOString(),
  };
  await writeStory(story);
  publish(storyId, { type: 'status', status: 'styling-narrative' });
  publish(storyId, { type: 'phase', phase: 'phase3', status: 'running' });

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

    story.phases.phase3 = {
      status: 'awaiting-review',
      artifact: result.text,
      chat: finalChat,
      startedAt: story.phases.phase3!.startedAt,
      finishedAt,
      durationMs:
        new Date(finishedAt).getTime() - new Date(story.phases.phase3!.startedAt!).getTime(),
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    };
    await writeArtifact(storyId, 'narrative.md', result.text);
    await writeStory(story);
    publish(storyId, { type: 'phase', phase: 'phase3', status: 'awaiting-review' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    story.status = 'error';
    story.error = message;
    story.phases.phase3 = {
      ...story.phases.phase3!,
      status: 'error',
      error: message,
      finishedAt: new Date().toISOString(),
    };
    await writeStory(story);
    publish(storyId, { type: 'error', message });
    throw err;
  }
}

export async function refinePhase3(storyId: string, userMessage: string): Promise<void> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);
  const phase = story.phases.phase3;
  if (!phase || phase.status === 'pending')
    throw new Error('Phase 3 has not run yet for this story.');

  const wrappedUserMessage = wrapForCanvasRefinement(
    userMessage,
    'narrative-styled output (all four sections: Learning Angles, narrative-styled story, flagged technical terms, narrative choices note)'
  );
  const chatWithUserTurn: ChatMessage[] = [
    ...phase.chat,
    { role: 'user', content: wrappedUserMessage, ts: new Date().toISOString() },
  ];

  story.phases.phase3 = { ...phase, status: 'running', chat: chatWithUserTurn };
  await writeStory(story);
  publish(storyId, { type: 'phase', phase: 'phase3', status: 'running' });

  try {
    const result = await callGemini(chatWithUserTurn);
    const parsed = parseRefinement(result.text);
    const updatedChat: ChatMessage[] = [
      ...chatWithUserTurn,
      { role: 'assistant', content: result.text, ts: new Date().toISOString() },
    ];

    story.phases.phase3 = {
      ...phase,
      status: 'awaiting-review',
      proposedArtifact: parsed.artifact,
      proposalNote: parsed.plan || (parsed.parsed ? '' : '(LLM did not output a plan; treating full response as the proposed artifact.)'),
      chat: updatedChat,
      inputTokens: (phase.inputTokens || 0) + result.inputTokens,
      outputTokens: (phase.outputTokens || 0) + result.outputTokens,
    };
    await writeStory(story);
    publish(storyId, { type: 'phase', phase: 'phase3', status: 'awaiting-review' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    story.phases.phase3 = { ...phase, status: 'error', error: message, chat: chatWithUserTurn };
    await writeStory(story);
    publish(storyId, { type: 'error', message });
    throw err;
  }
}
