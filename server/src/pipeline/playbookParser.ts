/**
 * Parse a playbook markdown into ordered per-page prompt blocks.
 * Recognizes `# PROMPT #N — <title>` or `# PROMPT N: <title>` style headers
 * (matches both the OpenAI_Playbook example format and the converter prompt's
 * spec).
 */
export interface PagePrompt {
  /** 0-based index in playbook order. Cover is typically index 0. */
  index: number;
  /** The number from the header (e.g. PROMPT #1 → 1). May start at 0 (legacy "Setup") or 1 (cover). */
  number: number;
  title: string;
  /** Full prompt text (everything after the header line, before the next prompt). Code fences stripped. */
  text: string;
  /** True for the cover-only first prompt. */
  isCover: boolean;
}

const PROMPT_HEADER = /^#+\s+PROMPT\s+#?(\d+)\s*[:\-–—]?\s*(.*?)$/gim;

export function parsePlaybook(playbook: string): PagePrompt[] {
  const matches: { startIdx: number; number: number; title: string }[] = [];
  let m: RegExpExecArray | null;
  PROMPT_HEADER.lastIndex = 0;
  while ((m = PROMPT_HEADER.exec(playbook)) !== null) {
    matches.push({
      startIdx: m.index,
      number: parseInt(m[1], 10),
      title: (m[2] || '').trim(),
    });
  }

  const prompts: PagePrompt[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].startIdx;
    const end = i + 1 < matches.length ? matches[i + 1].startIdx : playbook.length;
    const section = playbook.slice(start, end);

    // Strip the header line
    const lines = section.split('\n');
    const body = lines.slice(1).join('\n').trim();

    // If wrapped in a fenced code block, extract its contents
    const fenced = body.match(/^```[\w-]*\n([\s\S]*?)\n?```\s*$/);
    const text = fenced ? fenced[1].trim() : body;

    // Skip the "Setup Block" / "Prompt #0" — it's a reference, not a generation prompt
    const titleLc = matches[i].title.toLowerCase();
    if (matches[i].number === 0 || titleLc.includes('setup')) continue;

    const isCover = titleLc.includes('cover') || prompts.length === 0;
    prompts.push({
      index: prompts.length,
      number: matches[i].number,
      title: matches[i].title,
      text,
      isCover: isCover && prompts.length === 0,
    });
  }
  return prompts;
}
