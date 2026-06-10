import { loadPrompt } from '../prompts/loader.js';
import { readStory, writeArtifact, writeStory } from '../storage/fs.js';
import { callGeminiWithSearch } from '../llm/gemini.js';
import { publish } from '../events/bus.js';
import { parseRefinement, wrapForCanvasRefinement } from './refinementHelpers.js';
import type { ChatMessage, Story } from '../types.js';

// Slot substitution per the iron rule. Never paraphrase the prompt.
function buildInitialPromptText(promptBody: string, story: Story): string {
  const topic = story.selections.topic || '';
  const sources = story.selections.sources ?? [];
  const sourceBlock = sources.length
    ? `(User-provided. Start with these, then find cross-aligned sources via web_search.)\n\n${sources.join('\n\n')}`
    : 'Research this topic from scratch using web_search. Find cross-aligned sources per the Verification Protocol.';

  return promptBody
    .replace('[INSERT TOPIC OR URL]', topic)
    .replace('[PASTE LINKS / EXCERPTS — OR INSTRUCT THE MODEL TO RESEARCH]', sourceBlock);
}

/**
 * Initial Phase 1 run. Substitutes the topic + sources into the news-story-doc
 * prompt, sends to Claude with web tools, writes news_doc.md, and parks the
 * phase in 'awaiting-review' so the admin can chat-refine before approving.
 */
export async function runPhase1(storyId: string): Promise<void> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);

  // Mark phase running
  story.status = 'researching';
  story.phases.phase1 = {
    status: 'running',
    chat: [],
    startedAt: new Date().toISOString(),
    toolCalls: [],
  };
  await writeStory(story);
  publish(storyId, { type: 'status', status: 'researching' });
  publish(storyId, { type: 'phase', phase: 'phase1', status: 'running' });

  const promptBody = await loadPrompt('news-story-doc');
  const initialUserText = buildInitialPromptText(promptBody, story);

  const initialChat: ChatMessage[] = [
    { role: 'user', content: initialUserText, ts: new Date().toISOString() },
  ];

  try {
    const result = await callGeminiWithSearch(initialChat, (e) => {
      const activity: 'search' | 'fetch' = 'search';
      publish(storyId, { type: 'research', activity, detail: e.detail });
      // Push to story's toolCalls log as we go
      const phase = story.phases.phase1!;
      phase.toolCalls = phase.toolCalls || [];
      phase.toolCalls.push({ tool: e.tool, detail: e.detail, ts: new Date().toISOString() });
    });

    const finalChat: ChatMessage[] = [
      ...initialChat,
      { role: 'assistant', content: result.text, ts: new Date().toISOString() },
    ];

    const finishedAt = new Date().toISOString();
    story.phases.phase1 = {
      status: 'awaiting-review',
      artifact: result.text,
      chat: finalChat,
      startedAt: story.phases.phase1!.startedAt,
      finishedAt,
      durationMs:
        new Date(finishedAt).getTime() - new Date(story.phases.phase1!.startedAt!).getTime(),
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      toolCalls: story.phases.phase1!.toolCalls,
    };
    await writeArtifact(storyId, 'news_doc.md', result.text);
    await writeStory(story);
    publish(storyId, { type: 'phase', phase: 'phase1', status: 'awaiting-review' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    story.status = 'error';
    story.error = message;
    story.phases.phase1 = {
      ...story.phases.phase1!,
      status: 'error',
      error: message,
      finishedAt: new Date().toISOString(),
    };
    await writeStory(story);
    publish(storyId, { type: 'error', message });
    throw err;
  }
}

/**
 * Refinement turn — user gives feedback on the current news doc, Claude
 * produces a new full version with their feedback applied. Web tools stay
 * available so Claude can fetch new sources if the user requests them.
 */
export async function refinePhase1(storyId: string, userMessage: string): Promise<void> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);
  const phase = story.phases.phase1;
  if (!phase || phase.status === 'pending')
    throw new Error('Phase 1 has not run yet for this story.');

  const wrappedUserMessage = wrapForCanvasRefinement(userMessage, 'News Story Document');
  const chatWithUserTurn: ChatMessage[] = [
    ...phase.chat,
    { role: 'user', content: wrappedUserMessage, ts: new Date().toISOString() },
  ];

  // Mark running while we wait. Canonical artifact preserved.
  story.phases.phase1 = { ...phase, status: 'running', chat: chatWithUserTurn };
  await writeStory(story);
  publish(storyId, { type: 'phase', phase: 'phase1', status: 'running' });

  try {
    const result = await callGeminiWithSearch(chatWithUserTurn, (e) => {
      publish(storyId, { type: 'research', activity: 'search', detail: e.detail });
    });

    const parsed = parseRefinement(result.text);
    const updatedChat: ChatMessage[] = [
      ...chatWithUserTurn,
      { role: 'assistant', content: result.text, ts: new Date().toISOString() },
    ];

    // Store as PROPOSAL — Studio shows the diff, user accepts to apply.
    story.phases.phase1 = {
      ...phase,
      status: 'awaiting-review',
      // artifact preserved as canonical until user accepts
      proposedArtifact: parsed.artifact,
      proposalNote: parsed.plan || (parsed.parsed ? '' : '(LLM did not output a plan; treating full response as the proposed artifact.)'),
      chat: updatedChat,
      inputTokens: (phase.inputTokens || 0) + result.inputTokens,
      outputTokens: (phase.outputTokens || 0) + result.outputTokens,
    };
    await writeStory(story);
    publish(storyId, { type: 'phase', phase: 'phase1', status: 'awaiting-review' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    story.phases.phase1 = { ...phase, status: 'error', error: message, chat: chatWithUserTurn };
    await writeStory(story);
    publish(storyId, { type: 'error', message });
    throw err;
  }
}
