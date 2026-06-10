# StoryLens Visual Style Guide

This is a fixed reference document — not a prompt. It defines the four visual styles available in the app and the recurring Explainer character.

**How this is used:**
- The **UI descriptions** (Section 1) are what users see when picking a style.
- The **full style specs** (Section 2) are consumed by the Comic Script Generator prompt.
- The **Explainer character spec** (Section 3) defines Mira Chen, the recurring science journalist who appears across all StoryLens comics to make technical terms accessible.
- The **reference images** in `/styles/[style-id]/` are the primary style anchor. The server attaches one or more of them to every `gpt-image-1.5` call during image generation (Phase 6). The text descriptions support the images — the images are the source of truth for what the style looks like.

**Important:** Each style is anchored to a specific artist or tradition. The reference images in the folder should be from that artist's work. All downstream prompts and generation should stay true to that single visual anchor — do not blend styles or reference other artists.

---

## Section 1: UI Descriptions

These are the short descriptions shown to the user alongside a thumbnail from each style's reference folder.

### Storybook Hero
**Recommended for ages 8–10**
Colored pencil and crayon over watercolor washes. Warm, textured, handmade — like a picture book you'd curl up with.

### Painted World
**Recommended for ages 11–13**
Loose gouache and watercolor with muted earthy tones. Tiny characters in vast, philosophical landscapes. Warm and contemplative.

### Pop Editorial
**Recommended for ages 14–16**
Bold flat colors, clean lines, structured grids. Editorial illustration meets comic book. Smart, graphic, authoritative.

### Manga Action Report
**Recommended for ages 17–18**
Dynamic manga-style art with saturated color, speed lines, and kinetic energy. High-energy graphic journalism you'd binge.

---

## Section 2: Full Style Specifications

### Storybook Hero

**Style ID:** `storybook-hero`
**Reference folder:** `/styles/storybook-hero/`
**Visual anchor:** Brian Biggs, *My Hero*

**Look and feel:** Textured colored-pencil and watercolor with visible pencil grain, crayon strokes, and brushy washes. Warm palette: golden yellows, reds, oranges, warm teals, with generous white space. Everything looks hand-made — surfaces have the slight unevenness of real media on paper. Backgrounds are loose washes and suggestion; foregrounds are detailed and tactile. The art has weight and warmth, like you can feel the paper texture through the screen.

**Character rendering:** Oversized round heads on compact bodies (roughly 1:3 head-to-body ratio). Big circular dot eyes (solid color, no irises). Rosy cheeks with visible freckle clusters. Wild, scribbly hair with stray curls that bounce during action. Limbs are short and stubby with mitten-like hands. Expressions are theatrical — wide-open O mouths for shock, squeezed crescent eyes for laughter, gritted teeth for effort. Every emotion reads instantly at thumbnail size.

**Panels and layout:** 2–3 large panels per page. Panel borders are hand-drawn with slight wobble. Characters and action regularly break panel borders — an arm reaching out, sound effects exploding across the gutter, a character leaping between panels. Generous white space. Pages breathe.

**Text treatment:** Hand-lettered throughout in a crayon/pencil texture matching the art. Text varies in size, weight, and color for emphasis — key words get oversized and filled with colored-pencil texture (e.g., "TERRIBLE" in scratchy red, "SAVE THE DAY" in rainbow). Speech bubbles are white with thin sketchy borders. Narration in warm yellow boxes with hand-drawn edges. Sound effects are drawn in the same medium as the art — they are illustrations, not typeset overlays.

**Abstract concepts:** Physical metaphors a kid's imagination would invent. Data = something painted on a wall. A legal fight = a literal balance beam. Corporate power = a tower you have to look up at. Playful, slightly absurd, but accurate.

**Style lock (inlined into every page prompt):** Children's picture book illustration — colored pencil, crayon, and pastel layered over loose watercolor washes. Visible pencil/crayon texture on every surface. Characters have large round heads, big circle eyes with dot pupils, rosy dotted cheeks, scribbly textured hair, and short stubby limbs. Warm palette: golden yellows, burnt orange, teal, rusty red, olive green. Generous white space. ALL text hand-lettered in crayon/pencil style — key words drawn LARGER, mixed sizes and colors. Speech bubbles are wobbly hand-drawn ovals. Panel borders are slightly wobbly pencil lines. Think Brian Biggs picture book illustration. NOT manga, NOT digital, NOT clean vector.

**Style-drift fix:** "Keep the style textured and handcrafted — colored pencil hatching and crayon over loose watercolor. Picture book illustration, NOT digital art, NOT manga."

---

### Painted World

**Style ID:** `painted-world`
**Reference folder:** `/styles/painted-world/`
**Visual anchor:** Oliver Jeffers, *Here We Are*

**Look and feel:** Loose, painterly gouache and watercolor with visible brushstrokes and soft wet edges. Palette is more muted and earthy than Storybook Hero — ochres, slate blues, sage greens, dusty pinks — with selective bright accents (a red coat, a yellow sun) that pop against the subdued backgrounds. Backgrounds are vast and atmospheric: sweeping landscapes, cloudy skies, cosmic views of Earth. Foregrounds are intimate. The overall feeling is philosophical and warm — a wise, gentle guide showing you the world.

**Character rendering:** Simple and iconic — round heads, dot eyes, minimal facial features (sometimes just two dots and a line). Bodies are loose and slightly elongated, more gestural than Biggs' compact proportions. Characters are often small in the frame, dwarfed by the world around them — this sense of scale is central to the style. Clothing is suggested with a few brushstrokes of color rather than detailed. Emotion comes from posture and context more than facial expression.

**Panels and layout:** Flexible — alternates between full-page atmospheric illustrations (a character standing on a hilltop looking at a vast sky) and smaller vignette panels clustered on a page. Less rigid panel structure than other styles. Pages can be a single sweeping image with text overlaid, or 3–4 loose panels with generous margins. The layout breathes and varies with the story's rhythm — expansive for big ideas, intimate for personal moments.

**Text treatment:** Clean typeset font (friendly sans-serif or soft serif), not hand-lettered. Text floats on the page with space around it — never crammed. Narration is the primary voice, positioned thoughtfully in relation to the illustration. Speech bubbles are minimal and simple when used. The text-to-image relationship is more picture-book than comic — words and images share the page as equals rather than text living inside the art.

**Abstract concepts:** Through scale and wonder. A complex system becomes a vast landscape the reader looks out over. Opposing viewpoints become two tiny figures standing on opposite sides of a huge divide. Data becomes stars in a night sky or drops in an ocean. The style makes abstract ideas feel enormous and real by placing the reader (through the character) in physical relationship to them.

**Style lock (inlined into every page prompt):** Loose painterly gouache and watercolor with visible brushstrokes and soft wet edges. Muted earthy palette — ochres, slate blues, sage greens, dusty pinks — with selective bright accents. Small simple characters with round heads and dot eyes, often dwarfed by vast atmospheric landscapes. Clean typeset text (friendly sans-serif), not hand-lettered. Text floats on the page with space around it. Picture-book-meets-graphic-novel feel. Think Oliver Jeffers' Here We Are. NOT manga, NOT clean vector, NOT high-energy.

**Style-drift fix:** "Keep the style loose and painterly — visible brushstrokes, soft watercolor edges, muted earthy colors with selective bright accents. Characters are small and simple against vast backgrounds. NOT manga, NOT digital, NOT high-contrast."

---

### Pop Editorial

**Style ID:** `pop-editorial`
**Reference folder:** `/styles/pop-editorial/`
**Visual anchor:** Editorial illustration meets Hergé's ligne claire, updated

**Look and feel:** Bold flat-color graphic art with a limited punchy palette — 3–4 dominant colors per spread plus black and white. Clean, confident lines with uniform stroke weight. No visible texture — smooth, graphic surfaces. Sits between magazine editorial illustration and comic storytelling. Cool, smart, visually authoritative without being cold.

**Character rendering:** Stylized but proportional — real human anatomy simplified to graphic essentials. Expressions through minimal means: a single curved line for a skeptical eyebrow, a slight mouth downturn for doubt. Characters are defined by silhouette and color — recognizable as solid black shapes. Clothing is contemporary and specific without being branded.

**Panels and layout:** Structured grids, 3–6 panels per page, that occasionally break for emphasis. Thick black gutters. Infographic elements (timelines, data visualizations, comparison charts) integrate seamlessly with narrative panels — same visual system, not a separate "info box" layer.

**Text treatment:** Typeset clean sans-serif. Speech bubbles are minimal — white fills, thin borders, no tails (speaker indicated by proximity). Narration in caption boxes matching the spread's color scheme. Real-source quotes in italic serif in a tinted box. Data labels in smaller-weight sans-serif.

**Abstract concepts:** Through information design. Data is presented as a clean chart or annotated timeline that lives naturally inside the comic page — not metaphorized, not dramatized. Respects the reader's ability to process data directly.

**Reference touchstones:** Hergé's *Tintin*, Chris Ware's information-design sensibility, The New York Times editorial illustration, Tillie Walden's *Spinning*.

**Style lock (inlined into every page prompt):** Bold flat-color graphic illustration with clean uniform-weight lines and limited punchy palette (3–4 dominant colors plus black and white per spread). No visible texture — smooth, graphic surfaces. Stylized but proportionally realistic characters defined by silhouette. Structured grid panel layouts with thick black gutters. Infographic elements (charts, timelines, annotated diagrams) integrated seamlessly with narrative panels. Modern editorial illustration meets comic book. Think Hergé's Tintin clarity meets NYT editorial illustration. NOT textured, NOT painterly, NOT manga.

**Style-drift fix:** "Keep it flat-color, clean-line, graphic. Uniform stroke weight. Limited palette per spread. Thick black gutters. NO texture, NO gradients, NO painterly effects. Editorial illustration, not manga."

---

### Manga Action Report

**Style ID:** `manga-action-report`
**Reference folder:** `/styles/manga-action-report/`
**Visual anchor:** Shonen-adjacent manga meets graphic journalism

**Look and feel:** Dynamic, high-energy manga-influenced art with clean ink lines, bold blacks, and full saturated color. Deep blues, hot pinks, electric greens, sharp whites. Shading uses screen-tone-style hatching and dramatic cast shadows. Kinetic — even quiet scenes have visual tension. Feels like a show you'd binge.

**Character rendering:** Semi-realistic proportions with manga expressiveness — larger eyes than real life but not oversized circles. Angular jawlines, sharper features, defined hair chunks with movement. Emotional reactions use manga conventions: speed lines for shock, sweat drops for anxiety, vein marks for frustration. Characters look 13–16. Clothing has detail (folds, patterns, personality-signaling accessories).

**Panels and layout:** 3–5 panels per page. Dynamic layouts — diagonal panel cuts, edge bleeds, overlapping frames. Key moments get full-page splashes. Borders are clean and sharp. Speed lines and motion blur in dialogue scenes too.

**Text treatment:** Clean typeset in manga-style rounded-rectangle bubbles with pointed tails. Narration in dark boxes (deep blue/charcoal) with white text. Shout text in spiky burst bubbles. Sound effects are bold, angular, rotated to follow motion. Data callouts use a semi-transparent "HUD overlay" look.

**Abstract concepts:** Dramatizes them. A legal battle becomes an arena face-off. Statistics appear as on-screen data readouts overlaid on the scene. Turns information into spectacle without losing accuracy.

**Reference touchstones:** Nathan Hale's *Hazardous Tales*, *My Hero Academia*, Jerry Craft's *New Kid*, *Spy x Family*.

**Style lock (inlined into every page prompt):** Dynamic manga-influenced comic art with clean ink lines and full saturated color. Semi-realistic character proportions with expressive manga-style eyes and reactions. Bold blacks and dramatic shadows. Kinetic panel layouts with diagonal cuts, speed lines, and motion blur. Sharp panel borders. Deep blues, hot pinks, electric greens. High-energy editorial manga feel — closer to shonen action manga meets graphic journalism. Think Spy x Family meets Nathan Hale's Hazardous Tales. NOT kawaii, NOT watercolor, NOT flat editorial.

**Style-drift fix:** "Keep it manga — clean ink lines, bold blacks, saturated color, speed lines, diagonal panel cuts. High energy. NOT watercolor, NOT flat editorial, NOT picture book."

---

## Section 3: The Explainer Character — Mira Chen

Mira Chen is the recurring science journalist who appears across **all** StoryLens comics. Her job is to make technical terms, acronyms, and domain-specific concepts accessible to the reader at the comic's age band. She is the same person in every StoryLens comic — readers should recognize her as a familiar face the moment they see her, regardless of which visual style the comic is rendered in.

### Fixed identity (constant across every comic, every style)

- **Name:** Mira Chen
- **Age:** mid-30s
- **Role:** science journalist — specifically the StoryLens journalist whose beat is "explaining the technical guts of the news to people who deserve to understand them"
- **Personality:** Curious, warm, never condescending. She asks the question the reader is already thinking, then answers it. Slightly self-deprecating ("Honestly, I had to look this one up too."). Treats the reader as a fellow learner, not a student. Never lectures.
- **Voice:** Conversational, plain-language. Always reframes a piece of jargon as a question first, then answers it second. Example: *"TLI? That stands for translunar injection. Which is a fancy way of saying: the engine fires long enough to push the spacecraft fast enough to escape Earth's gravity and start coasting toward the Moon. Six minutes of engine. Then no engine for days."*
- **Relationship to the story:** She is **not** part of the story being told. She does not interact with the characters in the news story. She steps in from outside the narrative to clarify a technical term, then steps back out. Think of her as the reader's friend who happens to be a journalist who happens to know about this stuff.

### Core visual signature (must survive every style shift)

These elements are what make Mira recognizable as Mira regardless of which art style the comic uses. **All four must be present** in every rendering of her:

1. **A small reporter's notebook** — always in hand or visibly carried. Usually flipped open, sometimes with a pen tucked into the spiral. Dark cover.
2. **Round wire-frame glasses** — small, simple, clearly visible. Not oversized fashion frames; reading-and-reporting glasses.
3. **Shoulder-length dark hair** — usually pulled back loosely or tucked behind one ear. Not styled, not severe — practical journalist hair.
4. **A mustard-yellow scarf** — her signature accent. A single warm color spot that survives every art style as a flat color element. This is the visual anchor that pops across palettes.

**Posture:** Leaning slightly forward, mid-conversation. She's always in the middle of explaining something or about to.

### Variable elements (these flex by comic)

- **Art style:** Mira is rendered in whatever visual style the comic uses (see per-style rendering below). Same person, drawn in the local visual language.
- **Setting/context:** Mira appears in a setting appropriate to the story's domain — at a launchpad for a space story, in a courtroom hallway for a legal story, at a hospital nurses' station for a medical story, on a city sidewalk for an urban-policy story. She's a journalist on assignment; she goes where the beat takes her.

### Per-style rendering

**Storybook Hero version:**
Mira has a large round head with big circular dot eyes, scribbly dark hair pulled into a loose knot at the back of her head. Her glasses are two simple hand-drawn circles. Her mustard-yellow scarf is rendered as a loose painted swatch with visible brushwork and crayon texture. Compact stubby body, mitten-like hands holding a small notebook drawn with crayon-textured pages. Rosy dotted cheeks. Curious, slightly theatrical expression — eyebrows up, mouth in a small "oh!" of mid-explanation. Picture-book warmth.

**Painted World version:**
Mira is a small simple figure — round head, dot eyes, gestural elongated body. Her dark hair is suggested with a few brushstrokes. Her mustard-yellow scarf is a single bright brushstroke against the muted ochre/slate palette of the page — it's the warmest color in any panel she's in. Her glasses are suggested with two tiny dots or a thin painted line. The notebook is a small painted rectangle. She's often shown small in the frame, in keeping with the style's scale conventions. Posture conveys curiosity — leaning slightly forward, gesturing.

**Pop Editorial version:**
Mira is rendered in clean uniform-weight line, flat color fill, no texture. Mid-30s, shoulder-length dark hair pulled back loosely behind one ear, round wire-frame glasses as clean black circles, flat-color skin tone. Mustard-yellow scarf as a flat geometric color block — the only saturated warm color in most of her panels. Notebook held open in one hand, rendered as a small flat rectangle with a few suggested page lines. Defined by silhouette. Editorial-portrait register — she could be from a New York Times illustration.

**Manga Action Report version:**
Mira has semi-realistic manga proportions — slightly larger expressive eyes (but not oversized), angular jawline, shoulder-length dark hair with defined movement chunks. Round wire-frame glasses rendered with the manga convention of a single highlight line on each lens. Mustard-yellow scarf rendered with screen-tone shading and sharp folds. Notebook held open, the pen visible. Curious, slightly excited expression — eyebrows raised, a small smile. She has the energy of a young investigative reporter who genuinely loves her beat.

### Style lock for Mira (inlined into every page prompt where she appears)

```
RECURRING EXPLAINER CHARACTER — MIRA CHEN:
Mira is the StoryLens science journalist. She is the same character in every comic — readers should recognize her regardless of the art style. She is rendered in the same visual style as the rest of this comic, but her core features must always be present:

- Mid-30s woman
- Shoulder-length dark hair, loosely pulled back or tucked behind one ear
- Small round wire-frame glasses
- A mustard-yellow scarf (her signature accent — must always be visible, must always be that specific warm yellow)
- A small dark-cover reporter's notebook in her hand or clearly visible, often flipped open
- Posture: leaning slightly forward, mid-conversation

She is curious, warm, never condescending. Her expression is always engaged — she's mid-explanation. She is NOT part of the news story being told; she steps in from outside the narrative to clarify a technical term, then steps back out.
```

### Appearance budget (referenced from the comic script prompt)

- **Brief comics:** 1–2 Mira appearances
- **Standard comics:** 2–4 Mira appearances
- **Deep Dive comics:** as many as the story needs

### Mechanism by narrative style (referenced from the comic script prompt)

- **Investigation, Time Traveler, Debate:** Mira can appear as a full character in dedicated panels. She can be shown in a setting appropriate to the story domain. She can even briefly address other figures who exist outside the news story (an unnamed expert, a stock-footage scientist, etc.).
- **Walk in Someone's Shoes:** Mira appears **only** as a sidebar callout adjacent to panels — never inside the POV character's world. The reason: Walk in Shoes is monocular, and any character stepping into the cabin/room/space the POV character occupies breaks the form. Her sidebar is visually clearly *outside* the panel grid — a tinted callout box with a small portrait of her and her explanation.

---

## Age Band → Style Recommendation Map

| Age Band | Recommended Style | Why |
|----------|-------------------|-----|
| 8–10 | Storybook Hero | Warm, handmade, concretizes abstract concepts through playful metaphor |
| 11–13 | Painted World | Philosophical, scale-driven, matches expanding awareness |
| 14–16 | Pop Editorial | Smart, graphic, information-forward without being dry |
| 17–18 | Manga Action Report | High energy, matches the visual language this age group consumes |

The user can select any style for any age band.
