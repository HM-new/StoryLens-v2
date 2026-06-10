# Comic Script Generator

## Purpose

Transform a completed narrative story into a full comic book script. This script will then be converted into image generation prompts in the next step.

---

## Inputs

```
Story document: [Paste the narrative-styled story]
Age band: [A / B / C / D]
Length setting: [Brief / Standard / Deep Dive]
Narrative style: [Investigation / Time Traveler / Debate / Walk in Someone's Shoes]
Visual style: [Paste the selected style's full spec from style_guide.md]
Learning angles: [Paste the structured Learning Angles output from Phase 3 — primary, secondaries, and any per-side/per-era/per-clue/per-persona tags]
Flagged technical terms: [Paste the flagged terms list from Phase 3 — each term with its plain-language definition, the story beat where it first appears, and whether it was defined inline or tagged for the Explainer]
```

---

## Instructions

You are a comic book writer and visual director. Read the story document, the Learning Angles, the flagged technical terms, and the selected visual style spec from `style_guide.md`. Then produce the complete comic script in five parts.

All character designs, color palettes, text treatments, panel styles, and abstract concept visualizations must follow the selected style's specification exactly. Refer to the style guide for these rules — do not invent your own.

The Explainer character (Mira Chen) is defined in `style_guide.md` Section 3 — including her fixed identity, core visual signature, per-style rendering, and the rules for how she appears in each narrative style. Treat that section as authoritative; do not invent your own version of Mira.

Public figure names can be changed slightly so that they seem fictionalised, but fictionalization must never make the story harder to understand. If a real public figure, company leader, analyst, politician, regulator, expert, institution, or named source is fictionalized or renamed, the comic must give the reader a clear, reader-facing bridge back to who or what that character represents.

---

## Part A: Character and Setting Bible

Before writing any panels, establish visual consistency by defining every recurring element.

**For each recurring character:**
- Name and role in the story
- Physical description (detailed enough to reproduce consistently): approximate age, build, hair, skin tone, clothing style, distinguishing features
- Default expression or demeanor
- Visual shorthand: one or two signature visual traits that make them instantly recognizable across panels (e.g., always wears a red notebook, has round glasses, carries a magnifying glass)

**Mira Chen (the Explainer):** If Mira will appear in this comic, do **not** redefine her here — reference `style_guide.md` Section 3 by name and copy in only the specific per-style rendering paragraph for the visual style this comic uses (so the downstream playbook converter can inline it into every page prompt where Mira appears). Add a note on what setting/context Mira will appear in for this specific comic (a launchpad, a courtroom, a hospital corridor, etc.) — this is the one variable element of her appearance that's story-specific.

**For each recurring setting:**
- Name and what it represents in the story
- Visual description: architecture, lighting, color temperature, key objects, atmosphere
- How it changes across the story (if it does)

**Visual system rules:**
- How the selected narrative style is visually encoded (e.g., "Evidence panels have a yellow-tinted border and a document texture background"; "Time jumps use a sepia wash and torn-edge panels")
- Color palette: primary colors, accent colors, colors reserved for specific meanings
- Text treatment: how narration boxes, dialogue bubbles, and special text (e.g., document excerpts, data callouts) are visually differentiated — per the selected style spec
- Any recurring visual motifs or symbols

**Character roster page (when to include one):**

Some stories have enough recurring characters that a reader walking in cold can get lost in the first few pages. A character roster page solves this — but it costs a page from the length budget, and if done badly it kills the cold-open punch of Page 1. Use these style-specific rules:

- **Identity-orientation trigger:** If any public figure, company leader, analyst, politician, regulator, expert, institution, or named source is fictionalized or renamed, you must include a reader-facing orientation mechanism. This can be a roster page, half-page, sidebar, dossier, field guide, caption system, or first-appearance labels, but it must appear in the comic itself, not only in Part A or backend notes. The reader must understand which real-world role each fictionalized character represents.
- **Threshold:** Include a full roster/orientation page when **3 or more recurring characters appear in the first 3 pages** OR when **3 or more real-world people/roles are fictionalized anywhere in the comic**. Below that threshold, inline introduction can be enough only if the first-appearance caption clearly maps the fictionalized character to their real-world role.
- **Walk in Someone's Shoes:** Optional. If included, the roster page must be **diegetic** — framed as an in-world artifact that the story's universe would actually contain (a NASA mission press kit, a hospital staff directory, a court dossier, a trial program). It must NOT be an explainer breakout that addresses the reader. **Placement:** immediately after Page 1 (the cold-open POV punch lands first, then the reader gets oriented, then the story continues). The POV character is signaled visually — larger portrait, hero position, or a small diegetic tag in the document's graphic style — never with a fourth-wall caption like "← you" or "POV character." Mira does NOT appear on this page.
- **Investigation:** Encouraged. Frame as a "case file" or "dramatis personae" — the genre expects it. Can be placed before the mystery begins (Page 1 or Page 2). Treat it as the detective's pinboard.
- **Time Traveler:** If no characters are fictionalized, a unified roster is usually discouraged because the cast shifts by era. If characters are fictionalized, use a diegetic orientation page early in the comic — for example, "Time Traveler's Field Guide," "Cast Across Time," or "Who We Meet on This Journey." Place it immediately after the cold open or first present-day setup page. It should map fictionalized characters to real-world roles/anchors such as "the founder," "a senator/regulator voice," "a market analyst," "a retail investor," or "the explainer journalist." It should not over-explain the plot; it exists so the reader knows who each stylized person represents before the timeline starts moving quickly.
- **Debate:** Required when 3+ positions are presented. Frame as "the positions" — each side gets visually equal weight. Appears early, before the arguments begin. The structure of the page itself (equal portraits, equal labels, equal space) is part of the comic's commitment to non-false-equivalence.

**Cost:** Roster pages count against the length budget (Brief 8–14, Standard 16–28, Deep Dive 30–48). For Brief in particular, only add a roster when the threshold is genuinely hit — the page count is tight.

**Information per character on the roster:** fictionalized display name, real-world role/anchor, affiliation or viewpoint, and at most one short distinguishing line. Resist the urge to write paragraphs — the roster is for orientation, not exposition. If exact real names are avoided for image-generation reasons, the mapping must still be clear through role language such as "SpaceX founder," "U.S. senator questioning investor risk," "market analyst warning about valuation," or "ordinary retail investor."

**Inline identity captions:** When a full roster page is not needed, every fictionalized character must get a first-appearance caption that includes role mapping. Good: "Eli Mars, the founder-CEO figure." Good: "Senator Warren-like regulator voice, questioning investor risk." Bad: "Eli, visionary." Bad: "The critic."

---

## Part B: Pedagogical Spine

Before writing panels, identify how the Learning Angles will be visually anchored across the comic. The **primary angle** is the spine — every act of the comic should advance it, and the closing pages must dwell on it. **Secondary angles** appear only where they're already implicit in beats that serve the primary or its structural role. Do not add beats solely to cover a secondary angle.

Critically: Learning Angles are anchored through **image, action, and juxtaposition** — never stated in narration boxes. Show the angle, do not tell it.

**Style-specific anchoring rules** — these mirror how the angles were structured in Phase 3:

- **Walk in Someone's Shoes:** The primary angle is anchored through the persona's internal moments — the panels where their judgment, doubt, or choice is externalized visually (a look, a hesitation, a juxtaposition between what they say and what they see, a visual contrast between their inner state and their surroundings).
- **The Debate:** Each side's primary angle is anchored through the *values* its character embodies in their panels — body language, environment, what they point to as evidence — not through their dialogue stating the angle directly.
- **The Investigation:** The spine angle is anchored through the framing of the central mystery (cover, opening page, closing page). Secondary angles attach to the specific clue panels they were tagged to in Phase 3.
- **The Time Traveler:** Each era-specific angle is anchored in that era's pages. The meta-angle is anchored in the *transitions* between eras and in the closing page that returns to the present.

**Output a Pedagogical Spine map** before Part B.5: list each angle (primary first, then secondaries) and name the specific page(s) where it will be anchored. Example:

> **Primary angle:** Institutional trust vs. individual judgment — anchored on Cover, Page 1, Page 6 (the heat shield review beat), Page 12 (closing).
> **Secondary angle:** Representation under pressure — anchored on Page 4 (the letter from Waterloo schoolkids).

---

## Part B.5: Explainer Appearances

Mira Chen (the Explainer) is the recurring StoryLens journalist defined in `style_guide.md` Section 3. Her job in this comic is to make the flagged technical terms accessible to the reader at the target age band. Do **not** redefine her — reference the style guide. Your job here is to plan when, where, and how she appears in this specific comic.

**Length budget — strict cap:**
- **Brief:** 1–2 Mira appearances maximum
- **Standard:** 2–4 Mira appearances
- **Deep Dive:** as many as the story needs

If the flagged-terms list is longer than the budget allows, you must choose which terms get Mira appearances and which get inline definitions inside narration boxes. Prioritize terms that (a) are most central to the story's primary learning angle, (b) cannot be defined cleanly in a single short caption, or (c) recur multiple times in the story.

**Mechanism by narrative style — strict rule:**

- **Investigation, Time Traveler, Debate:** Mira can appear as a full character in dedicated panels. She can be situated in a setting appropriate to the story domain (a launchpad, a courtroom, a hospital corridor, etc.). She can briefly address other figures who exist outside the news story. She is rendered in the comic's chosen visual style, with her core visual signature from `style_guide.md` always present (notebook, round glasses, dark hair, mustard-yellow scarf).

- **Walk in Someone's Shoes:** Mira appears **only** as a sidebar callout adjacent to panels — never inside the POV character's world. The reason: Walk in Shoes is monocular, and any character stepping into the POV space breaks the form. Her sidebar is visually clearly *outside* the panel grid — a tinted callout box positioned in the page margin or between panels, containing a small portrait of her (with all four core visual signature elements present) and her explanation in her own voice. The narration of the main story continues uninterrupted; the reader's eye briefly visits Mira's sidebar and returns. Treat the sidebar as a footnote with a face.

**For each Mira appearance, output:**

- **Page number** where she appears
- **Term being explained** (from the flagged-terms list)
- **Form:** "full panel" (Investigation/Time Traveler/Debate only) or "sidebar callout" (Walk in Shoes only)
- **Setting/context** for this appearance (if full panel)
- **Mira's exact dialogue** — written in her voice as defined in `style_guide.md` Section 3. She always reframes the term as a question first, then answers it. Example: *"TLI? That stands for translunar injection. Which is a fancy way of saying: the engine fires long enough to push the spacecraft fast enough to escape Earth's gravity and start coasting toward the Moon. Six minutes of engine. Then nothing for days."*
- **Confirmation** that her core visual signature (notebook, round glasses, dark hair, mustard-yellow scarf, leaning-forward posture) is present in this appearance

**For terms NOT getting a Mira appearance:** specify how they will be handled inline — "defined in narration caption on Page X" or "defined via on-panel data callout on Page X." Every flagged term must be accounted for somewhere.

---

## Part C: Page-by-Page Script

For each page, provide:

**Page [number] — [brief description of what this page accomplishes in the story]**
**Story beat:** [Which section of the source story this page covers]
**Learning angle anchored (if any):** [Primary or secondary angle name, per the Pedagogical Spine map]
**Mira appearance (if any):** [Term being explained, per Part B.5]

**Panel layout:** Describe how many panels are on this page and how they are arranged (e.g., "3 panels — wide establishing shot on top, two equal panels below"; "Full-page splash"; "6-panel grid"). For Walk in Shoes pages with a Mira sidebar, note the sidebar's position separately ("sidebar callout in right margin, adjacent to Panel 2").

**For each panel:**

> **Panel [number]**
> **Visual description:** A detailed, specific description of what is shown — characters, their positions, expressions, actions, setting, lighting, camera angle, and any important objects. Write this as if you are directing a cinematographer. Be specific enough that an image generation model could produce this image without guessing.
> **Text — Narration:** [Any narrator voice-over text that appears in a caption box]
> **Text — Dialogue:** [Character name]: "[Their dialogue]"
> **Text — Special:** [Any on-screen text like document excerpts, signs, labels, data callouts]
> **Visual notes:** [Any additional notes on mood, color emphasis, visual metaphors, or continuity details]

**For Mira sidebars (Walk in Shoes only), use this separate format:**

> **Sidebar — Mira [position on page]**
> **Visual description:** Mira's portrait — confirm all four core visual signature elements (notebook, round wire-frame glasses, shoulder-length dark hair, mustard-yellow scarf), rendered in the comic's visual style. Posture leaning slightly forward.
> **Text — Mira:** [Her exact dialogue, in her voice — question first, then answer]
> **Visual notes:** [Sidebar background color, border treatment, position relative to which panel]

**Pacing guidelines:**
- For ages 8–10: Average 2–3 panels per page. No more than 20–30 words of text per panel. At least one large or full-width panel per page for visual breathing room. Key reveals get splash panels or half-page panels.
- For ages 11–13: Average 3–4 panels per page. Text can be slightly denser. More varied layouts.
- For ages 14–16: 4–5 panels per page. Structured grids. Infographic panels count as panels.
- For ages 17–18: 4–6 panels per page. Complex layouts allowed. Text density can approach adult graphic novels.

**Page count by length setting:**
- Brief: 8–14 pages (including cover)
- Standard: 16–28 pages
- Deep Dive: 30–48 pages

**Story beat coverage:** Every major story beat from the source document must appear. Mark each page with which section of the source story it covers. If a beat requires multiple pages, note that. If a beat can share a page with another, note that too.

---

## Part D: Cover

Design the cover as a separate page with:
- **Visual description:** What image dominates the cover — it should visually capture the central tension or mystery of the story *and* anchor the primary learning angle
- **Title treatment:** How the title text appears, its style and placement
- **Tagline:** A short hook line (optional, 1 sentence max)
- **Back cover:** Brief visual description or summary text for the back

Mira Chen does **not** appear on the cover. Covers are reserved for the story's central image.

---

## Quality Checks

Before delivering the script, verify:

- [ ] Every major story beat from the source document is covered in at least one panel
- [ ] Character descriptions are consistent — no character changes appearance between their bible entry and their panel descriptions
- [ ] Any fictionalized public figure/source is clearly mapped for the reader through a roster/orientation page or first-appearance role caption
- [ ] The visual system rules established in Part A are followed throughout Part C
- [ ] Text per panel stays within age-band limits
- [ ] Page count falls within the length setting range
- [ ] Abstract concepts (data, laws, corporate decisions) have been given concrete visual form — they are shown, not just described in text boxes
- [ ] The tone and palette match the selected visual style from style_guide.md throughout
- [ ] The narrative style's visual language (clue borders, time-jump indicators, debate framing, etc.) is used consistently
- [ ] The cover captures the story's central question or tension *and* anchors the primary learning angle
- [ ] The primary learning angle is anchored on the cover, opening page, and closing page, and advanced in every act
- [ ] Each secondary angle is anchored in at least one specific panel through image, action, or juxtaposition — never stated in narration
- [ ] No beats were added solely to cover a secondary angle
- [ ] **For Walk in Shoes:** the primary angle derives from the persona, not imposed externally
- [ ] **For Debate:** each side's angle is shown through values and embodiment, not stated in dialogue
- [ ] **For Investigation:** the spine angle frames the cover and closing; secondaries attach to their tagged clues
- [ ] **For Time Traveler:** era-specific angles are anchored in their eras; the meta-angle is anchored in transitions and the closing return to the present
- [ ] **All flagged technical terms are accounted for** — either assigned a Mira appearance or defined inline in a narration caption / on-panel callout. None silently dropped.
- [ ] **Mira appearances are within the length budget** (Brief: 1–2, Standard: 2–4, Deep Dive: as needed)
- [ ] **Mira's core visual signature** (notebook, round wire-frame glasses, shoulder-length dark hair, mustard-yellow scarf, leaning-forward posture) is confirmed present in every appearance
- [ ] **For Walk in Shoes:** Mira appears only as sidebar callouts visually outside the panel grid — never inside the POV character's world
- [ ] **For Investigation, Time Traveler, Debate:** Mira's full-panel appearances are situated in a setting appropriate to the story's domain
- [ ] Mira does NOT appear on the cover
