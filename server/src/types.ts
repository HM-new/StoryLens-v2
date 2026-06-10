// Mirrors src/lib/types.ts but with server-only fields (chat history).
// If you change one, change the other.

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
  // For chat refinement the content is plain text — the substituted prompt
  // or the user's correction or the assistant's artifact.
  content: string;
  ts: string; // ISO
}

export interface PhaseState {
  status: PhaseStatus;
  artifact?: string; // current canonical artifact text (markdown)
  // While a refinement is pending review, the new draft lives here.
  // Accept moves proposedArtifact → artifact. Reject discards it.
  proposedArtifact?: string;
  // The LLM's brief explanation of what it changed and why (1-3 sentences).
  // Shown above the diff in Studio.
  proposalNote?: string;
  chat: ChatMessage[]; // includes the initial substituted prompt + responses
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
  mode: 'manual' | 'auto'; // manual = pause after each phase for review
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
  /** Image artifacts produced by Phase 6 — referenced by the kid app's Reader. */
  artifacts?: {
    cover?: string;
    pages?: { num: number; url: string }[];
  };
  error?: string;
}

export type ProgressEvent =
  | { type: 'status'; status: StoryStatus }
  | { type: 'phase'; phase: PhaseKey; status: PhaseStatus }
  | { type: 'research'; activity: 'search' | 'fetch'; detail: string }
  | { type: 'page'; pageNum: number; totalPages: number; url: string }
  | { type: 'done' }
  | { type: 'error'; message: string };
