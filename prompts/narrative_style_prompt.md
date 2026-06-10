# Narrative Style Transformation Prompt

## Purpose
Transform an age-appropriate story document into an engaging narrative using one of four storytelling styles. This is the final transformation step — the input should already be calibrated for length and age band.

---

## Instructions

You will receive:
1. An age-transformed story document
2. The age band it was written for (A, B, C, or D)
3. A narrative style selection (or a request for a recommendation)
4. Any technical terms flagged by the age transformation phase as requiring downstream Explainer treatment

Your job: rewrite the story in the selected narrative style while preserving all facts, perspectives, and the age-appropriate calibration already applied. You are changing *how the story is told*, not *what it contains*.

**Core rules:**
- Do not invent facts. You may create narrative framing, scene-setting, and transitions, but all factual claims must come from the source document.
- Do not drop facts to serve the narrative. If a fact was in the age-transformed document, it must appear in the styled version. The narrative style determines presentation order and voice, not content.
- Maintain the neutrality established in earlier steps. A narrative voice can have personality without having a political position.
- For Walk in Someone's Shoes: composite characters are allowed, but must be clearly labeled as composite. Real people referenced in the source document can be used by name.
- **Jargon and accessibility rule:** Any technical term, acronym, or domain-specific concept used in the styled version must remain accessible to the target age band. If the source document defined a term inline (e.g., "translunar injection (TLI), a maneuver that..."), that definition must survive into the styled version — either kept inline, or flagged in the output for the Explainer character (Mira Chen) to introduce in the comic phase. Compression cannot silently drop definitions while keeping the acronym. The downstream comic phase has a recurring journalist character who can step in to define terms; your job is to either preserve the inline definition or tag the term so she can pick it up.

---

## Step 0: Style Recommendation (optional)

If the user hasn't selected a style, or asks for a recommendation, assess the source document and suggest 2–3 styles that best fit this story. For each, give a one-sentence reason.

Base your recommendation on these fit criteria:

| Style | Best when the story has... |
|-------|---------------------------|
| Investigation | Hidden information, leaked documents, cover-ups, power imbalances, "who knew what and when" |
| Time Traveler | Historical roots, laws or decisions from the past shaping the present, long cause-and-effect chains |
| Debate | Genuine disagreement, competing values, policy trade-offs, multiple reasonable positions |
| Walk in Someone's Shoes | Strong human stories, personal stakes, emotional reality that statistics alone can't convey |

---

## The Four Styles

### 1. The Investigation (Detective/Mystery)

**Voice:** A narrator or character follows clues, uncovers hidden documents, interviews witnesses, and pieces together what happened. Investigative journalism meets detective fiction.

**Structure:**
- Open with a question or mystery: something doesn't add up
- Introduce clues one at a time — documents, testimony, data
- Build toward revelations: what was hidden, who knew, when did they know
- Let the reader experience the "aha" moments as discoveries, not just stated facts

**Teaches:** Critical thinking, evidence evaluation, skepticism of power

**Narrative guidelines:**
- The narrator can express curiosity and surprise but not political opinion
- Clues should be real facts from the source document, presented in discovery order rather than chronological order
- Withholding information for narrative effect is allowed, but don't mislead — every clue should pay off honestly
- Use phrases like "But here's what they didn't tell the public..." or "That's when someone on the inside decided to speak up..."
- **Explainer hook:** Mira Chen (the Explainer) can be referenced as an expert-witness figure the narrator turns to for technical clarification — she fits naturally as "the journalist on the beat who's been tracking this." When tagging terms for downstream Explainer treatment, you can note that Mira will appear in-narrative.

**Adapts across age bands:**
- Band A: The narrator is a curious guide. Simple clue-to-revelation structure. "Let's find out what really happened."
- Band B: The narrator can handle more complex evidence trails. Multiple clues building toward a bigger picture.
- Band C–D: Full investigative structure. The reader is treated as a fellow investigator evaluating evidence quality.

---

### 2. The Time Traveler (How Did We Get Here?)

**Voice:** The story starts at a dramatic present-day moment, then rewinds to show the chain of decisions, inventions, or events that led here. The narrator jumps between past and present, with each jump answering a question the present raises.

**Structure:**
- Open with a vivid present-day scene or fact
- The present raises a question: "But how did we get here?"
- Jump to the past — show the origin point
- Return to the present with new understanding
- Repeat: each era or decision adds a layer
- End in the present with the full picture assembled

**Teaches:** Systems thinking, cause and effect, how the past shapes the present

**Narrative guidelines:**
- Each time jump should be triggered by a specific question from the present: "Wait — why can't you sue these companies? To understand that, we need to go back to 1996..."
- Past sections should feel like their own mini-stories, not just background exposition
- Make the connections between eras explicit — don't assume the reader will connect the dots
- The narrator's voice stays consistent across time periods
- **Explainer hook:** Mira Chen can appear in the present-day frame as the contemporary guide on technical context — she's the journalist standing in today, helping the reader understand what they need to know before each jump.

**Adapts across age bands:**
- Band A: Two or three time jumps maximum. Clear "first this happened, then this happened" connectors. Past sections are short.
- Band B: Can handle four to five jumps. Past sections can be more developed. Connections between eras can be more nuanced.
- Band C–D: Full timeline flexibility. Can handle irony (a law meant to protect free speech now shields companies from accountability). Past sections can carry real narrative weight.

---

### 3. The Debate (Clash of Perspectives)

**Voice:** Two or more characters or positions argue their case. The reader is positioned as the judge or jury. No side is presented as automatically right — but each side's evidence is made visible so the reader can evaluate.

**Structure:**
- Open by framing the central question clearly
- Present each side's strongest argument in its own section
- For each side: what they claim, what evidence they point to, and what the other side says in response
- Close by returning the question to the reader: "Now you've heard both sides. What do you think?"

**Teaches:** Perspective-taking, argument evaluation, intellectual humility

**Narrative guidelines:**
- This is not false equivalence. If the source document shows one side has stronger evidence, the debate format should make that visible through the evidence presented — not by editorializing, but by letting the facts speak
- Each perspective should be presented in its strongest form before being challenged
- The reader should never feel lectured. The style respects their ability to weigh evidence
- Use framing like "Side A argues..." / "Side B responds..." / "But Side A points to this document..."
- The number of perspectives should match what the age-transformed document already established (Band A = 2 sides, Band B = 3–4, Band C–D = all perspectives)
- **Explainer hook:** Mira Chen can serve as a neutral fact-checker between the positions — when a technical term is used by one side, she can step in briefly to clarify what it actually means, then return the floor to the debate.

**Adapts across age bands:**
- Band A: Two clear sides. Simple "they say / but they say" structure. The question at the end is concrete: "Do you think that's fair?"
- Band B: Three to four positions. Can handle the idea that both sides make some good points. Reflection questions are more analytical.
- Band C–D: Full complexity. Internal tensions within positions. The closing questions should be genuinely difficult with no obvious right answer.

---

### 4. Walk in Someone's Shoes (First-Person/Empathetic)

**Voice:** The story is told through the experience of a specific person — real or composite. The reader sees the world through their eyes before the broader context is layered in.

**Structure:**
- Open inside the person's experience — what their day looks like, what they're feeling, what just happened to them
- Gradually widen the lens — from personal experience to the bigger picture
- Connect the individual story to the systemic facts from the source document
- Close by returning to the person — what's next for them, and what's unresolved

**Teaches:** Empathy, connecting abstract issues to human consequences

**Narrative guidelines:**
- If using a real person named in the source document, stick strictly to documented facts about their experience
- If creating a composite character, clearly label them: "Maya isn't a real person — she's based on the experiences of many kids described in this story"
- The personal perspective is the entry point, not the whole story. Systemic facts, other perspectives, and context must still appear — they're just introduced through the lens of this person's experience
- Emotional content should be honest but calibrated to the age band already applied
- The persona should not be a mouthpiece for one side of the debate. Their experience is their experience — the reader draws their own conclusions
- **Explainer hook:** Mira Chen does **not** appear inside the POV character's world for this style. The form is monocular and any character stepping into the POV space breaks it. Instead, in the comic phase, Mira will be referenced only via sidebar callouts that sit visually outside the panel grid. When tagging terms for downstream Explainer treatment in this style, your tag should specify that Mira is *adjacent* to the narrative, not in it — and that the narration itself should continue uninterrupted.

**Persona selection:**
When the user chooses this style, generate 3–5 persona options drawn from the roles and people actually present in the source document. Each option should offer a meaningfully different entry point into the story.

Format the options as:

> **Option 1: [Name or role]**
> [One sentence on who they are and what angle their perspective opens up]

The user selects one, and then you write the transformation through that lens.

**Adapts across age bands:**
- Band A: The persona should be close to the reader's age or experience. Keep the emotional register warm and safe. The wider lens is introduced gently.
- Band B: The persona can be slightly older or in a more complex position. Can handle tension between what the person feels and what the system does.
- Band C–D: Any persona works. Can handle moral complexity within the character's own experience. The wider lens can include uncomfortable truths.

---

## Step 1: Learning Angles

After the narrative style is selected (and, for Walk in Someone's Shoes, after the user has chosen a persona), identify the **Learning Angles** — thinking skills or conceptual lenses that this particular story, told in this particular style, can activate for readers at this age band.

Learning Angles are not content facts (those are already in the document). They are *ways of thinking* the story can highlight through its storyline.

**Examples of Learning Angles:**
- Evidence evaluation: When actions contradict words, how do you decide what to believe?
- Incentive reasoning: Why would someone keep doing something they know causes harm?
- Weighing competing rights: Can two important values both be valid and still conflict?
- Scale and proportion: How do you make sense of numbers in the millions?
- Correlation vs. causation: How do you tell if one thing actually causes another?
- Precedent thinking: How does one decision change the rules for everyone who comes after?
- Agency and systems: When something is designed to influence your behavior, how much control do you really have?
- Moral complexity: Can someone be well-intentioned and still cause harm?

**General principles:**
- Learning Angles should be highlighted *through the storyline itself* — through the structure, the juxtapositions, the questions raised, the way evidence is sequenced. The narrative should make these thinking dimensions visible and engaging without breaking into explicit instructional asides.
- Different styles naturally activate different angles. Lean into the style's strengths:
  - Investigation → evidence evaluation, skepticism of power, incentive reasoning
  - Time Traveler → cause and effect, unintended consequences, systems thinking
  - Debate → perspective-taking, argument analysis, weighing trade-offs
  - Walk in Someone's Shoes → empathy, agency, connecting abstract to personal
- Within those natural strengths, identify the *specific* angles this story activates. Not every story teaches the same things.
- Calibrate to age band: Band A angles should be concrete and observable. Band D angles can be structural and abstract.

### Angle structure by style

This determines how the angles are organized in the output, not just which ones you pick. The structure here is what Phase 5 (comic script generation) will use to anchor each angle visually — so the tagging matters.

**Walk in Someone's Shoes:** The persona selection has already implicitly chosen the primary angle. Identify **one primary angle** that the chosen persona most directly embodies (e.g., Hansen → institutional trust vs. individual judgment; Camarda → conscience vs. loyalty; Koch → representation under pressure). List up to 2 secondary angles that the persona's experience naturally touches but doesn't center. The form is monocular — do not promote secondaries to co-equal status. Note which trait of the persona the primary angle derives from.

**The Debate:** The form is structurally multi-angle. Identify **one primary angle per side of the debate** (minimum 2, one per distinct position). Each side embodies its angle through the values it argues from, not through narration. At Deep Dive length, you may add one synthesis angle that emerges from the unresolved middle. Tag each primary angle with the side it belongs to.

**The Investigation:** Identify **one primary angle as the spine of the mystery** — the question the reader is hunting alongside the narrator. List 1–3 secondary angles, each attached to a specific clue or revelation. Secondaries should not compete with the spine; they accumulate around it. Tag each secondary with the clue it attaches to.

**The Time Traveler:** This is the most multi-angle-friendly form. Identify **one primary angle per era visited** (typically 2–4), plus one **meta-angle** that emerges from the connection across eras. The meta-angle is the spine; the era-specific angles are the evidence for it. Tag each era-specific angle with its era.

---

## Step 2: Flagged Technical Terms

After writing the narrative-styled story, scan it for any technical terms, acronyms, or domain-specific concepts that a reader at the target age band would not immediately understand. Include:

- Any term flagged by the age transformation phase as a candidate for downstream explanation
- Any term you preserved with an inline definition (these are still candidates — the comic phase may decide Mira should pick them up instead)
- Any term you introduced in the narrative styling that wasn't in the source document but is necessary for the story to land

For each, output:
- **The term** (and its acronym, if any)
- **A plain-language definition** appropriate for the target age band (one sentence)
- **The story beat** where the term first appears
- **Whether you defined it inline** in the styled story or left it for the Explainer to handle

This list is consumed by the comic script generator, which decides whether each term gets an inline definition in a caption box or an Explainer (Mira Chen) appearance.

---

## Transformation Process

1. **If no style selected:** Run Step 0 and present 2–3 recommendations with reasons.
2. **If Walk in Someone's Shoes selected:** Generate 3–5 persona options. Wait for user selection before continuing.
3. **Identify Learning Angles** (Step 1). For Walk in Shoes, this step must happen *after* the user has selected a persona, since the persona determines the primary angle.
4. **Rewrite the full story** in the selected style, preserving all facts and age calibration. The output should be a complete, standalone narrative — not a summary or outline. Learning Angles should be visible through the storyline. Apply the jargon and accessibility rule throughout.
5. **Identify flagged technical terms** (Step 2) by scanning the styled story for accessibility gaps.

---

## Output

Return:

1. **Learning Angles**, formatted as structured data the next phase can ingest:
   - **Primary angle:** [name] — one sentence on how the storyline highlights it
   - **Secondary angles** (if any, per the style's capacity rule): [name] — one sentence each, with a tag noting which beat/clue/era/side they attach to
   - **Style-specific tags:**
     - For Walk in Shoes: which persona trait the primary angle derives from
     - For Debate: which side each primary angle belongs to
     - For Investigation: which clue or revelation each secondary attaches to
     - For Time Traveler: which era each primary angle belongs to, and identify the meta-angle separately

2. The narrative-styled story as a complete standalone document.

3. **Flagged technical terms**, formatted as a list:
   - Term (and acronym, if any)
   - Plain-language definition for the target age band
   - Story beat where the term first appears
   - Status: "defined inline" or "tagged for Explainer"

4. A brief note (2–3 sentences) on key narrative choices made — what was reordered, what framing was added, and how the style shaped the presentation.

---

## Usage

```
Source document: [Paste the age-transformed story]
Age band: [A / B / C / D]
Narrative style: [Investigation / Time Traveler / Debate / Walk in Someone's Shoes / Recommend]
Flagged terms from age transformation: [Paste the list from the previous phase, if any]
```
