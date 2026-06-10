import { loadPrompt } from '../prompts/loader.js';
import { readArtifact, readStory, writeArtifact, writeStory } from '../storage/fs.js';
import { callGemini } from '../llm/gemini.js';
import { AGE_LABEL, LENGTH_LABEL } from '../llm/labels.js';
import { publish } from '../events/bus.js';
import { parseRefinement, wrapForCanvasRefinement } from './refinementHelpers.js';
import type { ChatMessage } from '../types.js';

/**
 * Phase 2 — Content Calibration.
 * Takes the approved news doc + age band + length, produces a calibrated story.
 *
 * Construction: prompts (age + length) loaded verbatim, concatenated with a
 * `---` separator, runtime inputs appended as a single user message.
 * No web search — pure text transformation.
 */
async function buildInitialMessage(storyId: string): Promise<string> {
  const newsDoc = await readArtifact(storyId, 'news_doc.md');
  if (!newsDoc) throw new Error('news_doc.md missing — Phase 1 must complete first');

  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);
  const { ageBand, length } = story.selections;
  if (!ageBand) throw new Error('Age band not selected');
  if (!length) throw new Error('Length not selected');

  const agePrompt = await loadPrompt('age-transform');
  const lengthPrompt = await loadPrompt('length');

  return (
    `${agePrompt}\n\n---\n\n${lengthPrompt}\n\n---\n\n` +
    `## Your Task\n\n` +
    `**Source document (the verified News Story Document from Phase 1):**\n\n${newsDoc}\n\n` +
    `**Target age band:** ${AGE_LABEL[ageBand]}\n\n` +
    `**Length setting:** ${LENGTH_LABEL[length]}\n\n` +
    `Transform the source document according to the age band and length setting above. ` +
    `Follow the transformation process exactly as specified. ` +
    `Return ONLY the transformed story document as your entire response.`
  );
}

export async function runPhase2(storyId: string): Promise<void> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);

  story.status = 'calibrating';
  story.phases.phase2 = {
    status: 'running',
    chat: [],
    startedAt: new Date().toISOString(),
  };
  await writeStory(story);
  publish(storyId, { type: 'status', status: 'calibrating' });
  publish(storyId, { type: 'phase', phase: 'phase2', status: 'running' });

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

    story.phases.phase2 = {
      status: 'awaiting-review',
      artifact: result.text,
      chat: finalChat,
      startedAt: story.phases.phase2!.startedAt,
      finishedAt,
      durationMs:
        new Date(finishedAt).getTime() - new Date(story.phases.phase2!.startedAt!).getTime(),
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    };
    await writeArtifact(storyId, 'calibrated.md', result.text);
    await writeStory(story);
    publish(storyId, { type: 'phase', phase: 'phase2', status: 'awaiting-review' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    story.status = 'error';
    story.error = message;
    story.phases.phase2 = {
      ...story.phases.phase2!,
      status: 'error',
      error: message,
      finishedAt: new Date().toISOString(),
    };
    await writeStory(story);
    publish(storyId, { type: 'error', message });
    throw err;
  }
}

export async function refinePhase2(storyId: string, userMessage: string): Promise<void> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);
  const phase = story.phases.phase2;
  if (!phase || phase.status === 'pending')
    throw new Error('Phase 2 has not run yet for this story.');

  const wrappedUserMessage = wrapForCanvasRefinement(userMessage, 'calibrated story document');
  const chatWithUserTurn: ChatMessage[] = [
    ...phase.chat,
    { role: 'user', content: wrappedUserMessage, ts: new Date().toISOString() },
  ];

  story.phases.phase2 = { ...phase, status: 'running', chat: chatWithUserTurn };
  await writeStory(story);
  publish(storyId, { type: 'phase', phase: 'phase2', status: 'running' });

  try {
    const result = await callGemini(chatWithUserTurn);
    const parsed = parseRefinement(result.text);
    const updatedChat: ChatMessage[] = [
      ...chatWithUserTurn,
      { role: 'assistant', content: result.text, ts: new Date().toISOString() },
    ];

    story.phases.phase2 = {
      ...phase,
      status: 'awaiting-review',
      proposedArtifact: parsed.artifact,
      proposalNote: parsed.plan || (parsed.parsed ? '' : '(LLM did not output a plan; treating full response as the proposed artifact.)'),
      chat: updatedChat,
      inputTokens: (phase.inputTokens || 0) + result.inputTokens,
      outputTokens: (phase.outputTokens || 0) + result.outputTokens,
    };
    await writeStory(story);
    publish(storyId, { type: 'phase', phase: 'phase2', status: 'awaiting-review' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    story.phases.phase2 = { ...phase, status: 'error', error: message, chat: chatWithUserTurn };
    await writeStory(story);
    publish(storyId, { type: 'error', message });
    throw err;
  }
}
