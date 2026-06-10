import fs from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import type { Story } from '../types.js';
import { STORIES_DIR, artifactPath, stateFile, storyDir } from './paths.js';

if (!existsSync(STORIES_DIR)) mkdirSync(STORIES_DIR, { recursive: true });

export async function listStories(): Promise<Story[]> {
  if (!existsSync(STORIES_DIR)) return [];
  const ids = await fs.readdir(STORIES_DIR);
  const stories: Story[] = [];
  for (const id of ids) {
    const f = stateFile(id);
    if (!existsSync(f)) continue;
    try {
      const raw = await fs.readFile(f, 'utf8');
      stories.push(JSON.parse(raw) as Story);
    } catch {
      // skip malformed
    }
  }
  stories.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return stories;
}

export async function readStory(id: string): Promise<Story | null> {
  const f = stateFile(id);
  if (!existsSync(f)) return null;
  const raw = await fs.readFile(f, 'utf8');
  return JSON.parse(raw) as Story;
}

export async function writeStory(story: Story): Promise<void> {
  const dir = storyDir(story.id);
  if (!existsSync(dir)) await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(stateFile(story.id), JSON.stringify(story, null, 2), 'utf8');
}

export async function writeArtifact(id: string, name: string, content: string): Promise<void> {
  const dir = storyDir(id);
  if (!existsSync(dir)) await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(artifactPath(id, name), content, 'utf8');
}

export async function readArtifact(id: string, name: string): Promise<string | null> {
  const p = artifactPath(id, name);
  if (!existsSync(p)) return null;
  return fs.readFile(p, 'utf8');
}
