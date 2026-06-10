export type AgeBand = '8-10' | '11-13' | '14-16' | '17-18';
export type Length = 'quick' | 'full' | 'deep';
export type NarrativeStyle = 'investigation' | 'time-traveler' | 'debate' | 'walk-in-shoes';
export type VisualStyleId =
  | 'storybook-hero'
  | 'painted-world'
  | 'pop-editorial'
  | 'manga-action-report'
  | 'surprise-me';

export type PhaseKey = 'phase1' | 'phase2' | 'phase3' | 'phase5a' | 'phase5b' | 'phase6';
export type PhaseStatus = 'pending' | 'running' | 'awaiting-review' | 'approved' | 'error';

export type StoryStatus =
  | 'draft'
  | 'researching'
  | 'calibrating'
  | 'styling-narrative'
  | 'scripting'
  | 'building-playbook'
  | 'generating-images'
  | 'ready'
  | 'error';

export interface Persona {
  name: string;
  role: string;
  desc: string;
  initials: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: string;
}

export interface PhaseState {
  status: PhaseStatus;
  artifact?: string;
  proposedArtifact?: string;
  proposalNote?: string;
  chat: ChatMessage[];
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  toolCalls?: { tool: string; detail: string; ts: string }[];
  error?: string;
}

export interface Story {
  id: string;
  createdAt: string;
  status: StoryStatus;
  mode: 'manual' | 'auto';
  selections: {
    topic?: string;
    sources?: string[];
    ageBand?: AgeBand;
    length?: Length;
    narrativeStyle?: NarrativeStyle;
    persona?: Persona;
    visualStyleId?: VisualStyleId;
  };
  phases: Partial<Record<PhaseKey, PhaseState>>;
  artifacts?: {
    cover?: string;
    pages?: { num: number; url: string }[];
  };
  error?: string;
}
