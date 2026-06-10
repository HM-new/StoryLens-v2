import type { ProgressEvent } from '../types.js';

type Listener = (event: ProgressEvent) => void;

const subscribers = new Map<string, Set<Listener>>();

export function subscribe(storyId: string, listener: Listener): () => void {
  let set = subscribers.get(storyId);
  if (!set) {
    set = new Set();
    subscribers.set(storyId, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) subscribers.delete(storyId);
  };
}

export function publish(storyId: string, event: ProgressEvent): void {
  const set = subscribers.get(storyId);
  if (!set) return;
  for (const listener of set) {
    try {
      listener(event);
    } catch {
      // never let one bad listener kill the bus
    }
  }
}
