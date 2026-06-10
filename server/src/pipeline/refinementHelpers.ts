// Shared logic for refinement turns. Wraps the user's correction with an
// instruction asking the LLM to: (1) write a brief plan, (2) output a
// separator, (3) emit the COMPLETE revised artifact. We then split the
// response into plan + artifact and store the artifact as a *proposal*
// (PhaseState.proposedArtifact) — Studio shows the plan + diff and the
// user accepts/rejects to apply.

const SEPARATOR = '---ARTIFACT---';

export function wrapForCanvasRefinement(userMessage: string, artifactName: string): string {
  return (
    `${userMessage}\n\n` +
    `IMPORTANT — output format for this turn:\n\n` +
    `1. First write a short header "## Plan" followed by 1-3 sentences describing what you will change and why. ` +
    `Do not write a chat reply or summary — just the plan.\n\n` +
    `2. Then output this exact separator on its own line:\n\n` +
    `${SEPARATOR}\n\n` +
    `3. Then output the COMPLETE updated ${artifactName} (every section, no summarization, no abbreviation). ` +
    `This is what will be saved if I approve the change.\n\n` +
    `Output only those three things in that order.`
  );
}

export interface ParsedRefinement {
  /** The plan/explanation the LLM wrote (without the "## Plan" header). */
  plan: string;
  /** The full revised artifact. */
  artifact: string;
  /** True if we found the separator. False = LLM didn't follow the format; we treat the whole response as artifact. */
  parsed: boolean;
}

export function parseRefinement(text: string): ParsedRefinement {
  const idx = text.indexOf(SEPARATOR);
  if (idx === -1) {
    // Fallback: LLM didn't follow the format. Treat whole response as the artifact.
    return { plan: '', artifact: text.trim(), parsed: false };
  }
  let plan = text.slice(0, idx).trim();
  const artifact = text.slice(idx + SEPARATOR.length).trim();

  // Strip the "## Plan" / "**Plan**" header if present, so the plan reads cleanly.
  plan = plan.replace(/^#+\s*Plan\s*\n+/i, '').replace(/^\*\*Plan\*\*\s*\n+/i, '').trim();

  return { plan, artifact, parsed: true };
}
