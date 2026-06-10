# OpenAI Image Playbook Converter

## Purpose

Convert a completed comic script into an **OpenAI Image Playbook** — a structured sequence of per-page prompts the server runs against `gpt-image-1.5`. Each prompt is self-contained because OpenAI image calls are stateless (no chat memory between requests).

---

## Inputs

```
Comic script: [Paste the full output from the Comic Script Generator]
```

You also have access to:
- `style_guide.md` — read the selected style's full spec, style lock, and style-drift fix from this file
- `/styles/[style-id]/` — reference image folder the server attaches per call
- `OpenAI_Playbook_StorybookCrayon_v2.md` — reference example of what the output should look like (format, level of detail, structure)

---

## Instructions

Read the comic script and the style guide entry for the selected style. Then produce a single playbook document the server can parse into individual image-generation requests.

Use `OpenAI_Playbook_StorybookCrayon_v2.md` as your reference for format and level of detail. Your output should match that document's structure and specificity.

### Why this format is different from a chat-based playbook

OpenAI's `gpt-image-1.5` has **no conversation state between calls**. Every API call is independent. This means:

- The style lock cannot live in a "Prompt #0 setup turn" — it must be inlined in every page prompt.
- The model cannot "remember" characters from a prior page — character descriptions must be repeated verbatim every time a character appears.
- The model receives style and character context through **image inputs attached by the server**: the style reference from `/styles/[style-id]/` plus the previously generated page. The text prompt repeats the style lock and character bible to reinforce what the images already show.

### Key rules

- **Every page prompt is self-contained.** It must include: the style lock (one short paragraph from `style_guide.md`), full physical descriptions of every character that appears on the page, the panel layout, scene description, all dialogue and hand-lettered text verbatim, and the aspect ratio.

- **Do NOT write "upload previous page as reference."** The server attaches reference images automatically. Page prompts should be written assuming the model is seeing the style reference and the previous page on every call — but should never instruct the user (or executor) to upload anything.

- **Character descriptions repeated word-for-word.** Use the bible from the comic script. If Milo appears on three pages, the full physical description of Milo appears on three pages. This is the #1 character-consistency mechanism.

- **Style lock at the top of every page prompt.** A one-paragraph distillation from `style_guide.md`. Same wording each time. Brief enough that it doesn't dominate the prompt; specific enough to anchor the model.

- **Aspect ratio:** every prompt must specify `2:3 portrait` (the comic page).

- **No real names** for any public figure — described by appearance and role only.

---

## Output Structure

### 1. Header
Title, model, goal, total page count, age band, visual style. Note: `model: gpt-image-1.5`, `aspect: 2:3 portrait`.

### 2. How This Works (one short paragraph)
Brief workflow note for the server orchestrator: "Each prompt below is a standalone request to `gpt-image-1.5`. The server attaches the style reference from `/styles/[style-id]/` and the previously generated page on every call. Save each generated image immediately — it is required as input for the next call."

### 3. Setup Block (reference material — not a generation prompt)

A reusable block the converter can inline into every page prompt:

```
STYLE LOCK: [one-paragraph style lock from style_guide.md, verbatim]

CHARACTER BIBLE:
- CHARACTER NAME: [full physical description from the script's bible — hair, eyes, skin, clothing, accessories, distinctive marks]
- (repeat for every recurring character)

VISUAL RULES: [time-period color shifts, flashback treatment, emotional pacing rules — short bullets]

GLOBAL CONSTRAINTS:
- Aspect ratio: 2:3 portrait
- All text hand-lettered in the image (no typed fonts, no post-production)
- No real names — figures described by appearance and role only
```

The Setup Block is NOT sent to the API by itself. Its contents are copied into each page prompt.

### 4. Page Prompts (one per image — Cover + Pages 1–N)

Each page prompt has this skeleton:

```
# PROMPT — [Page N: title]

[STYLE LOCK paragraph — inlined from Setup Block]

CHARACTERS ON THIS PAGE: [for each character appearing on this page, the FULL physical description from the bible, verbatim]

VISUAL RULES: [only the rules relevant to this page — e.g. flashback color treatment if this is a flashback]

LAYOUT: [N panels, panel-by-panel description from the script]

PANEL 1: [scene description, character positions, expressions, environment]
HAND-LETTERED TEXT: "[verbatim from script]"
SPEECH BUBBLE from [character]: "[verbatim]"
[...]

PANEL 2: [...]

[...]

Aspect ratio: 2:3 portrait. All text hand-lettered in the image. No typed fonts.
```

Number prompts sequentially starting from the Cover (prompt 1), then Page 1 (prompt 2), Page 2 (prompt 3), etc.

### 5. Style-Drift Reminder
A copy-paste paragraph the server can prepend on a retry if the model drifts. Pull this from `style_guide.md`'s drift-fix section for the selected style.

### 6. Quick Checklist
Checkbox list of all prompts with page titles and panel counts. Used to verify completeness.

### 7. Character Reference
Table mapping comic characters to their story roles. Useful for review, not sent to the API.

---

## Quality Checks

- [ ] Style lock appears in every page prompt, identical wording each time
- [ ] Every character appearing on a page has their full physical description on that page
- [ ] Every page from the comic script has a corresponding prompt
- [ ] All text/dialogue from the script appears verbatim with exact wording
- [ ] No prompt mentions "upload" or "reference image" as a user instruction — the server handles attachments
- [ ] Aspect ratio `2:3 portrait` in every prompt
- [ ] No real names; public figures described by appearance and role only
- [ ] Style-drift reminder matches the selected style in `style_guide.md`
