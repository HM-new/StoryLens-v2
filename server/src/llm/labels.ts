// Type → human-readable label mappings.
// The prompts (.md files at project root) use specific labels like "A (Ages 8–10)"
// and "Deep Dive". Our types use kebab-case identifiers. Mappings live here.

import type { AgeBand, Length, NarrativeStyle, VisualStyleId } from '../types.js';

export const AGE_LABEL: Record<AgeBand, string> = {
  '8-10': 'A (Ages 8–10)',
  '11-13': 'B (Ages 11–13)',
  '14-16': 'C (Ages 14–16)',
  '17-18': 'D (Ages 17–18)',
};

// Kid UI uses Quick Read / Full Story / Deep Dive.
// length_setting.md prompt uses Brief / Standard / Deep Dive.
// Map accordingly.
export const LENGTH_LABEL: Record<Length, string> = {
  quick: 'Brief',
  full: 'Standard',
  deep: 'Deep Dive',
};

export const NARRATIVE_LABEL: Record<NarrativeStyle, string> = {
  investigation: 'The Investigation',
  'time-traveler': 'Time Traveler',
  debate: 'The Debate',
  'walk-in-shoes': "Walk in Someone's Shoes",
};

export const VISUAL_LABEL: Record<VisualStyleId, string> = {
  'storybook-hero': 'Storybook Hero',
  'painted-world': 'Painted World',
  'pop-editorial': 'Pop Editorial',
  'manga-action-report': 'Manga Action Report',
  'surprise-me': 'Surprise Me',
};
