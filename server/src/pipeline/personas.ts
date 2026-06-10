import { loadPrompt } from '../prompts/loader.js';
import { readArtifact, readStory } from '../storage/fs.js';
import { callGemini } from '../llm/gemini.js';
import { AGE_LABEL } from '../llm/labels.js';
import type { Persona } from '../types.js';

/**
 * Generate 3-5 persona options for the Walk-in-Shoes narrative style.
 * Calls Gemini with the narrative_style_prompt body + an appended task asking
 * for Step 2 (Persona selection) output in JSON.
 *
 * Reads calibrated.md (Phase 2 output). Phase 2 must be approved before
 * the kid reaches the Narrative screen, so this artifact will exist.
 */
export async function generatePersonas(storyId: string): Promise<Persona[]> {
  const story = await readStory(storyId);
  if (!story) throw new Error(`Story ${storyId} not found`);

  const calibrated = await readArtifact(storyId, 'calibrated.md');
  if (!calibrated) {
    throw new Error(
      'calibrated.md missing — Phase 2 must complete before personas can be generated'
    );
  }

  const { ageBand } = story.selections;
  if (!ageBand) throw new Error('Age band not selected');

  const promptBody = await loadPrompt('narrative-style');

  const userMessage =
    `${promptBody}\n\n---\n\n` +
    `## Your Task\n\n` +
    `The user has selected **Walk in Someone's Shoes** as their narrative style. ` +
    `Run ONLY Step 2 (Persona Selection) from the prompt above. Do not generate ` +
    `Learning Angles, the narrative-styled story, or flagged terms.\n\n` +
    `**Source document (age-calibrated story):**\n\n${calibrated}\n\n` +
    `**Age band:** ${AGE_LABEL[ageBand]}\n\n` +
    `Generate 3-5 persona options drawn from the roles and people actually present in the source document. ` +
    `Each option should offer a meaningfully different entry point into the story. ` +
    `Follow the prompt's "Adapts across age bands" guidance for who is appropriate at this age.\n\n` +
    `Return ONLY a JSON object in EXACTLY this format (no other text, no markdown wrapping):\n\n` +
    `{\n` +
    `  "personas": [\n` +
    `    { "name": "Full name or role", "role": "One short phrase placing them (nationality, profession, age)", "desc": "One sentence on who they are and what angle their perspective opens up", "initials": "Up to 2 chars" }\n` +
    `  ]\n` +
    `}`;

  const result = await callGemini([
    { role: 'user', content: userMessage, ts: new Date().toISOString() },
  ]);

  // Extract the first JSON object from the response text
  const match = result.text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('No JSON object found in persona response');
  }

  let parsed: { personas?: unknown };
  try {
    parsed = JSON.parse(match[0]);
  } catch (err) {
    throw new Error(
      `Failed to parse persona JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!Array.isArray(parsed.personas)) {
    throw new Error('persona JSON missing "personas" array');
  }

  const personas: Persona[] = parsed.personas
    .filter((p): p is Record<string, unknown> => p != null && typeof p === 'object')
    .map((p) => {
      const name = typeof p.name === 'string' ? p.name : 'Unnamed';
      const role = typeof p.role === 'string' ? p.role : '';
      const desc = typeof p.desc === 'string' ? p.desc : '';
      const initialsCandidate = typeof p.initials === 'string' ? p.initials : '';
      const initials = initialsCandidate
        ? initialsCandidate.slice(0, 2).toUpperCase()
        : name
            .split(/\s+/)
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
      return { name, role, desc, initials };
    });

  if (personas.length === 0) {
    throw new Error('Gemini returned zero personas');
  }
  return personas;
}
