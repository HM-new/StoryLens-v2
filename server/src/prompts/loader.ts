import fs from 'node:fs/promises';
import path from 'node:path';
import { PROJECT_ROOT } from '../storage/paths.js';

const PROMPT_FILES = {
  'news-story-doc': 'Comprehensive_News_Story_Doc_Prompt_v2.md',
  'age-transform': 'age_transformation_prompt_v2.md',
  length: 'length_setting.md',
  'narrative-style': 'narrative_style_prompt.md',
  'comic-script': 'comic_script_prompt_v2.md',
  'playbook-converter': 'playbook_converter_prompt.md',
  'style-guide': 'style_guide.md',
  'openai-playbook-example': 'OpenAI_Playbook_StorybookCrayon_v2.md',
} as const;

export type PromptName = keyof typeof PROMPT_FILES;

// No caching — fresh read each call so prompt edits don't need server restart.
export async function loadPrompt(name: PromptName): Promise<string> {
  const filename = PROMPT_FILES[name];
  const full = path.join(PROJECT_ROOT, 'prompts', filename);
  return fs.readFile(full, 'utf8');
}
