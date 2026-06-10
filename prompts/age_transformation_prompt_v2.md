# Age-Appropriate Story Transformation Prompt

## Purpose
Transform a completed News Story Document for a specific age group while preserving factual accuracy, neutrality, and educational value.

---

## Instructions

You will receive:
1. A News Story Document (the "source document")
2. A target age band (A, B, C, or D)

Your job: assess the source against seven developmental parameters, then produce a transformed version appropriate for that age group.

**Core rules:**
- Do not invent facts. Everything must originate from the source document.
- Do not simplify into inaccuracy. If a concept can't be made age-appropriate without becoming misleading, omit it.
- Preserve multiple perspectives, even if reduced in number for younger readers.

---

## Age Bands

### Band A: Ages 8–10 (Upper Elementary)
Concrete thinkers. Understand fairness, rules, and basic cause-and-effect. Limited awareness of institutions. Need emotional safety.
**Goal:** Awareness — "This is happening in the world, and here's why it matters."

### Band B: Ages 11–13 (Middle School)
Beginning abstract thought. Can hold competing ideas. Developing awareness of systems. Starting to form independent opinions. Can handle difficult content with appropriate framing.
**Goal:** Understanding — "Here's how this works, who's involved, and why people disagree."

### Band C: Ages 14–16 (High School)
Abstract and systemic thinking. Can evaluate arguments and weigh evidence. Comfortable with moral ambiguity. Can process heavy material with critical distance.
**Goal:** Analysis — "Here's the evidence — evaluate it and form your own position."

### Band D: Ages 17–18 (Pre-College)
Near-adult capacity. Can engage with nuance, systemic critique, and policy analysis. Approaching civic participation.
**Goal:** Engagement — "Here's the full picture — what should happen, and what's your role?"

---

## Seven Parameters

Assess the source document for the selected age band. Rate each 1–5 (1 = minimal adjustment, 5 = major transformation). Include a brief note on what changes are needed.

### 1. Conceptual Complexity
Number of ideas, relationships, and logical steps the reader must track simultaneously. Determines how content is sequenced and chunked.

### 2. Abstraction Tolerance
How much the content relies on systemic, institutional, or structural reasoning versus concrete, observable, story-driven reasoning. Determines whether concepts are introduced through analogy and experience (concrete-first) or can be stated as principles (abstract-first).

*Distinct from conceptual complexity:* a concept can be simple but abstract ("duty of care") or complex but concrete ("five events in sequence").*

### 3. Vocabulary Complexity
Difficulty and familiarity of words and sentence structures. Determines whether jargon is replaced, scaffolded (defined on first use), or retained.

If a technical term must be retained because no plain-language equivalent preserves accuracy, define it inline on first use **and** flag it in the output as a candidate for downstream Explainer treatment. The downstream pipeline includes a recurring journalist character (Mira Chen, defined in `style_guide.md` Section 3) who can step into the comic phase to define jargon visually. Your job here is to make sure no technical term survives transformation without either an inline definition or a flag for Mira to pick up — never both stripped, never the acronym kept while the definition is dropped.

### 4. Emotional Weight
Assessed on two sub-dimensions:
- **Intensity:** How heavy or distressing the subject matter is.
- **Proximity:** How close it hits to the reader's own life.

High intensity requires careful framing. High proximity requires extra care to avoid triggering personal anxiety. Both together demand the most adjustment.

### 5. Moral and Value Ambiguity
Degree of competing ethical positions and unresolved questions. Determines whether the content presents a clear moral direction, balanced perspectives, or genuinely open-ended questions the reader must sit with.

### 6. Prior Knowledge Assumptions
Background knowledge the content assumes. Determines how much context must be built from scratch versus briefly refreshed.

### 7. Relevance and Agency
How the content connects to the reader's life, across three types:
- **Personal agency:** Can they do something in their own life?
- **Intellectual agency:** Can they form an opinion and evaluate evidence?
- **Civic agency:** Can they engage through participation or advocacy?

Younger bands lean personal. Older bands gain intellectual and civic agency. Frame realistically — don't imply they can fix systemic problems or that they're powerless.

---

## Transformation Process

### Step 1: Parameter Assessment

Produce this table:

| Parameter | Rating (1–5) | Key Adjustments |
|-----------|:---:|---|
| Conceptual complexity | | |
| Abstraction tolerance | | |
| Vocabulary complexity | | |
| Emotional weight | | |
| Moral and value ambiguity | | |
| Prior knowledge assumptions | | |
| Relevance and agency | | |

Then write 2–3 sentences summarizing the overall transformation strategy.

### Step 2: Transform the Story

Use the parameter assessment to guide a full rewrite. Follow these band-specific principles:

**Band A (8–10):**
- Single clear narrative thread. Reduce to core sequence of events.
- Define every key concept with analogy or concrete comparison.
- Maximum 2 perspectives, clearly and simply stated.
- Omit legal and procedural mechanics — simplify to essentials.
- Reference harm in general terms without specific details about suicide, exploitation, or death.
- End with personal-agency grounding: "What can you do?"
- Significantly shorter than the original.

**Band B (11–13):**
- Can follow 2–3 narrative threads with clear transitions.
- Define key concepts with brief scaffolding, not full analogies.
- Present 3–4 perspectives with evidence cited.
- Introduce legal and policy concepts in simplified terms.
- Can reference depression, anxiety, body image, and suicidal thoughts with appropriate framing. Keep specifics of individual exploitation or death cases general.
- Include simplified fact-vs-allegation distinction.
- End with reflection questions that prompt independent thinking.
- Moderately shorter than the original.

**Band C (14–16):**
- Full chronological narrative with multiple threads.
- Streamlined scaffolding — focus on legal and policy concepts.
- All perspectives with evidence and counter-arguments.
- Can include specific testimony and case details with critical distance.
- Full allegations-vs-verified-facts section.
- End with analytical prompts: "What would you rule? What evidence would change your mind?"
- Close to original length.

**Band D (17–18):**
- Near-full complexity. Minimal scaffolding.
- All perspectives with full nuance, including internal tensions.
- Emotional content presented fully.
- Full allegations-vs-verified-facts with legal status.
- End with civic agency prompts.
- Can match original length.

### Step 3: Quality Check

Before finalizing, verify:
- No facts invented or distorted during simplification
- Omitted content was genuinely removed, not replaced with misleading simplification
- The story stands alone — reader won't feel lost or talked down to
- Emotional content is age-appropriate without being dishonestly sanitized
- Reader's agency is framed realistically
- No technical term was kept in acronym or jargon form without either an inline definition or a flag for the downstream Explainer

---

## Output

Return:
1. Parameter assessment table + transformation strategy summary
2. The transformed story as a complete standalone document
3. **Flagged technical terms list** — any technical terms that survived this transformation because they couldn't be plain-language replaced. For each, provide: the term (and acronym if any), a one-sentence plain-language definition appropriate to the target age band, the location in the transformed story where it first appears, and whether it was defined inline in the transformation or left for the downstream Explainer to handle. This list flows into the narrative style prompt as input.
4. Brief note (2–3 sentences) on what was omitted and why

---

## Usage

```
[Paste this prompt]

Source document:
[Paste the News Story Document]

Target age band: [A / B / C / D]
```
