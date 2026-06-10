import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server/src/storage/paths.ts → up to StoryLens-v2/
const APP_ROOT = path.resolve(__dirname, '../../..');

// Prompt .md files and style reference images live inside StoryLens-v2/.
export const PROJECT_ROOT = APP_ROOT;

export const DATA_DIR = path.join(APP_ROOT, 'data');
export const STORIES_DIR = path.join(DATA_DIR, 'stories');

export function storyDir(id: string): string {
  return path.join(STORIES_DIR, id);
}

export function stateFile(id: string): string {
  return path.join(storyDir(id), 'state.json');
}

export function artifactPath(id: string, name: string): string {
  // name is like 'news_doc.md', 'calibrated.md', etc.
  return path.join(storyDir(id), name);
}
