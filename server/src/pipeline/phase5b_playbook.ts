import { loadPrompt } from '../prompts/loader.js';
import { readArtifact, readStory, writeArtifact, writeStory } from '../storage/fs.js';
import { callGemini } from '../llm/gemini.js';
import { VISUAL_LABEL } from '../llm/labels.js';
import { publish } from '../events/bus.js';
import { parseRefinement, wrapForCanvasRefinement } from './refinementHelpers.js';
import type { ChatMessage } from '../types.js';

/**
 * Phase 5B — Playbook Converter.
 * Pattern A: substitute the one placeholder in playbook_converter_prompt.md,
 * then append style_guide.md and the OpenAI playbook example as references
 * (per the prompt's "## Inputs" section that says "You also have access to" both).
 */
async function buildInitialMessage(storyId: string): Promise<string> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);

  const script = await readArtifact(storyId, 'script.md');
  if (!script) throw new Error('script.md missing — Phase 5A must complete first');

  const { visualStyleId } = story.selections;
  if (!visualStyleId) throw new Error('Visual style not selected');

  const promptBody = await loadPrompt('playbook-converter');
  const styleGuide = await loadPrompt('style-guide');
  const playbookExample = await loadPrompt('openai-playbook-example');

  // The one placeholder from playbook_converter_prompt.md line 12
  let substituted = promptBody.replace(
    '[Paste the full output from the Comic Script Generator]',
    script
  );

  // The prompt explicitly says Claude "has access to" style_guide.md and
  // the OpenAI playbook example — append both as labeled reference sections.
  substituted +=
    `\n\n---\n\n## Reference: style_guide.md (full)\n\n${styleGuide}\n\n` +
    `---\n\n## Reference: OpenAI_Playbook_StorybookCrayon_v2.md (format example to match)\n\n${playbookExample}\n\n` +
    `---\n\n` +
    `**Selected visual style for this comic:** ${VISUAL_LABEL[visualStyleId]}\n\n` +
    `IMPORTANT: Return the COMPLETE playbook as your entire response — Header, How This Works, Setup Block, ` +
    `every page prompt (Cover + Page 1 through Page N), Troubleshooting/Style-Drift Reminder, Quick Checklist, Character Reference. ` +
    `Each page prompt must be a fully self-contained markdown section starting with "# PROMPT #N — <title>" so the executor can parse it.`;

  return substituted;
}

export async function runPhase5b(storyId: string): Promise<void> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);

  story.status = 'building-playbook';
  story.phases.phase5b = {
    status: 'running',
    chat: [],
    startedAt: new Date().toISOString(),
  };
  await writeStory(story);
  publish(storyId, { type: 'status', status: 'building-playbook' });
  publish(storyId, { type: 'phase', phase: 'phase5b', status: 'running' });

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

    story.phases.phase5b = {
      status: 'awaiting-review',
      artifact: result.text,
      chat: finalChat,
      startedAt: story.phases.phase5b!.startedAt,
      finishedAt,
      durationMs:
        new Date(finishedAt).getTime() - new Date(story.phases.phase5b!.startedAt!).getTime(),
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    };
    await writeArtifact(storyId, 'playbook.md', result.text);
    await writeStory(story);
    publish(storyId, { type: 'phase', phase: 'phase5b', status: 'awaiting-review' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    story.status = 'error';
    story.error = message;
    story.phases.phase5b = {
      ...story.phases.phase5b!,
      status: 'error',
      error: message,
      finishedAt: new Date().toISOString(),
    };
    await writeStory(story);
    publish(storyId, { type: 'error', message });
    throw err;
  }
}

export async function refinePhase5b(storyId: string, userMessage: string): Promise<void> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);
  const phase = story.phases.phase5b;
  if (!phase || phase.status === 'pending')
    throw new Error('Phase 5B has not run yet for this story.');

  const wrappedUserMessage = wrapForCanvasRefinement(
    userMessage,
    'OpenAI Image Playbook (Header through Character Reference)'
  );
  const chatWithUserTurn: ChatMessage[] = [
    ...phase.chat,
    { role: 'user', content: wrappedUserMessage, ts: new Date().toISOString() },
  ];

  story.phases.phase5b = { ...phase, status: 'running', chat: chatWithUserTurn };
  await writeStory(story);
  publish(storyId, { type: 'phase', phase: 'phase5b', status: 'running' });

  try {
    const result = await callGemini(chatWithUserTurn);
    const parsed = parseRefinement(result.text);
    const updatedChat: ChatMessage[] = [
      ...chatWithUserTurn,
      { role: 'assistant', content: result.text, ts: new Date().toISOString() },
    ];

    story.phases.phase5b = {
      ...phase,
      status: 'awaiting-review',
      proposedArtifact: parsed.artifact,
      proposalNote: parsed.plan || (parsed.parsed ? '' : '(LLM did not output a plan; treating full response as the proposed artifact.)'),
      chat: updatedChat,
      inputTokens: (phase.inputTokens || 0) + result.inputTokens,
      outputTokens: (phase.outputTokens || 0) + result.outputTokens,
    };
    await writeStory(story);
    publish(storyId, { type: 'phase', phase: 'phase5b', status: 'awaiting-review' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    story.phases.phase5b = { ...phase, status: 'error', error: message, chat: chatWithUserTurn };
    await writeStory(story);
    publish(storyId, { type: 'error', message });
    throw err;
  }
}
