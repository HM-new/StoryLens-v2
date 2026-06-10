# Comprehensive News Story Document — Prompt v2

You are creating a comprehensive, neutral **News Story Document** about a topic.
This document is the source material for downstream story generation across
multiple narrative styles and age bands. It must carry not only facts but
conceptual scaffolding, causal reasoning, human texture, and clearly labeled
uncertainty.

**Topic:** [INSERT TOPIC OR URL]

**Source material:** [PASTE LINKS / EXCERPTS — OR INSTRUCT THE MODEL TO RESEARCH]

---

## Core Rules

- Accuracy first. Do not invent facts.
- Separate clearly:
  - **A)** Verified facts (see Verification Protocol)
  - **B)** Attributed claims or viewpoints (who says what)
  - **C)** Unclear, disputed, or developing points
- If you use loaded labels ("aggression," "terrorist," "regime," "liberation,"
  "massacre," "genocide," "fraud," "breakthrough"), attribute them to a specific
  source or speaker. Never use them in the document's own voice.
- If facts are time-sensitive, include dates and state "as of [date]."
- This document must serve downstream narrative generation. That means it must
  contain not only what happened but **why it matters, how it works, who is
  affected, and what is genuinely uncertain.**

---

## Verification Protocol (mandatory)

Every numerical claim, casualty figure, attributed event, and contested
characterization must be tagged inline as one of:

- **[verified]** — The claim appears in **two or more sources that do not share
  the same alignment**, AND the figures or descriptions are broadly consistent
  (within ~10–20% for numbers, or substantively aligned for qualitative claims).

- **[disputed]** — Sources from different alignments give meaningfully different
  figures or framings. **Record all versions with attribution.** Do not pick a side.

- **[single-source]** — Only one source, or only sources sharing the same
  alignment, report the claim. Treat as provisional.

**What "different alignment" means.** Sources count as differently aligned if
they differ along at least one of these axes:

- **Country or region** (e.g., an Iranian outlet and an American outlet; an
  Indian outlet and a Pakistani outlet)
- **Political leaning** (e.g., a left-leaning and a right-leaning outlet within
  the same country)
- **Side of the dispute** (e.g., a source aligned with one party and a source
  aligned with the opposing party)
- **Institutional position** (e.g., a government source and an independent
  monitor, NGO, or academic source)

A claim repeated by five outlets that all share the same alignment along every
axis is **not** verified — it is one perspective amplified. The model must
actively seek out cross-aligned sources, not accept whatever appears first.

---

## Output Sections

Output a single document with these sections in order:

### 1) Title
- One-line subtitle: what this story is about
- Date range covered (or "ongoing")

### 2) What You Need to Know (6–10 bullets)
- The most important [verified] facts and stakes
- Tag each bullet inline as needed

### 3) Background for First-Time Readers
- The minimum context needed to understand the story
- Definitions of essential terms, roles, organizations
- The larger ongoing conflict, dispute, or relationship state this event sits
  inside — even if the current event doesn't directly resolve or address it. A
  reader should know what dispute Round 4 fits into, not just Round 4. If the
  story is a single event, name the multi-year arc it's part of.

### 4) How It Works
- Mandatory for any topic with technical, scientific, legal, or institutional
  complexity
- Plain-language explanation of the mechanisms, structures, or systems at the
  heart of the story
- For political/conflict stories: government structures, chains of command,
  decision-making bodies
- For science/health/tech stories: how the technology or phenomenon works,
  constraints, failure modes
- For legal stories: how the relevant legal process works
- Goal: a reader who understands this section can reason about new developments,
  not just memorize them

### 5) The Story (chronological)
- Key events in order, with dates, actors, locations
- Tag contested events inline

### 6) Causes and Chains
- 4–6 short paragraphs explaining cause → effect for the most important
  developments
- Not just *what* happened but *why* one thing led to the next
- This section is the conceptual glue that supports historical or explanatory
  narrative styles

### 7) Where Things Stand Now
- Current status as of [date]
- What decisions or actions are happening now

### 8) What Happens Next (conditional)
- Plausible scenarios, clearly labeled as conditional
- Distinguish "likely," "possible," and "speculative"
- Attribute predictions to sources where possible

### 9) Stakes and Why It Matters
- For each major stakeholder (4–8): one short paragraph on what they stand to
  gain, what they stand to lose, and what they fear
- This section feeds debate-style and perspective-driven narratives

### 10) Viewpoints and Narratives
- Mandatory for any story with meaningful disagreement
- Provide 3–6 perspectives. For each:
  - Who holds it
  - What they claim
  - What evidence they cite
  - What critics or other sources argue (attributed)
- **Required:** at least one perspective from inside any directly affected
  civilian population, distinct from that population's government
- Label fringe claims as fringe

### 11) Tensions and Dilemmas
- 3–6 of the genuine hard questions the story raises, framed as questions, not
  answers
- Reasonable people should disagree about them
- Example: "Is preemptive military action ever justified to stop a weapons
  program?" not "Was this attack justified?"
- Feeds debate-style narratives and forces moral complexity to surface

### 12) Human Texture
- 6–12 specific, concrete details: places, scenes, named or anonymized
  individuals with one-sentence portraits
- Not analysis — raw material for storytelling
- Each item tagged for verification status
- Feeds empathy- and character-driven narrative styles directly

### 13) Allegations vs. Verified Facts
- Mandatory for legal, investigative, conflict, or sensitive stories
- Three subsections:
  - **Verified:** what is firmly established under the verification protocol
  - **Disputed:** what different sources contest, each version attributed
  - **Legal / formal status:** what has been officially established, charged,
    ruled, or recognized

### 14) Key Details (choose what fits)
- Key figures: 5–12 — for each, one sentence on their role in THIS story
  (decision-maker, opponent, attendee whose presence signals X, affected party,
  witness, beneficiary, dissenter, etc.). Names without story-roles do not
  appear here.
- Key terms: 8–15 (skip if covered in Background)
- Key numbers/data points: bullet list, each tagged

### 15) Timeline
- Dated bullets of major events, with verification tags on contested ones

### 16) What This Document Cannot Tell You
- Explicit list of:
  - Unknown or unverifiable things
  - Things changing rapidly that may already be out of date
  - Where evidence is genuinely thin
  - Perspectives or sources the model could not access
- Protects downstream story generation from confident assertions the source
  does not actually establish

### 17) Sources Used
- Outlet/institution, title, date, type
- **Group sources by alignment** so cross-perspective coverage is visible at a
  glance
- Aim for 8–15 sources for complex topics

---

## Style

- Neutral voice, no persuasion
- Clear headings, short paragraphs
- Comprehensive but focused
- Inline tags ([verified], [disputed], [single-source]) are part of the document,
  not metadata to strip
- Return only the document followed by the parameter assessment

---

## Parameter Assessment

After the document, provide a short note on each:

### Conceptual Complexity
- **What it is:** Number of ideas, relationships, and logical steps required
- **What it affects:** Sequencing and chunking downstream

### Vocabulary Complexity
- **What it is:** Difficulty and familiarity of words and sentence structures
- **What it affects:** Word choice, syntax, term introduction

### Emotional Weight
- **What it is:** Emotional intensity carried by facts, language, and examples
- **What it affects:** Level of detail, tone, need for grounding

### Moral and Value Ambiguity
- **What it is:** Degree of ethics, judgments, or competing values
- **What it affects:** Framing of disagreement, neutrality vs directive tone

### Prior Knowledge Assumptions
- **What it is:** Background the content assumes
- **What it affects:** Definitions, context injection, accessibility

### Agency and Relevance
- **What it is:** How clearly the content connects to the reader's life
- **What it affects:** Impact framing, examples, perceived importance
