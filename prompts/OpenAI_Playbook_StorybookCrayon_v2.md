# The Day the World Held Its Breath — and Then Cheered (Maybe Too Soon)
## OpenAI Image Playbook — Storybook Crayon Style (v2)
## Server-Executed, Zero Post-Production

**Model:** `gpt-image-1.5` (OpenAI Images Edit endpoint, multi-image input)
**Goal:** Generate complete comic pages — hand-lettered text, speech bubbles, and narration integrated into every image. No editing after.
**Total output:** 1 Cover + 13 Pages
**Aspect:** 2:3 portrait (`1024x1536`)

---

# HOW THIS WORKS

This playbook is **executed by the StoryLens server, not by a human.** OpenAI image calls are stateless — there is no chat session between requests. The server attaches reference images to every call, and every prompt below is self-contained.

**The execution flow:**

1. Parse this playbook into ordered prompts (Cover = prompt 1, Page 1 = prompt 2, …).
2. For each prompt, call `openai.images.edit({ model: 'gpt-image-1.5', image: [...], prompt, size: '1024x1536', quality: 'high' })`.
3. The `image` array always contains the style reference from `/styles/storybook-hero/`. From Page 1 onward, it also contains the previously generated page (server-attached automatically).
4. Save the returned image immediately to `/output/[story-slug]/`. It is the input for the next call.
5. On failure, retry up to 3× with exponential backoff. On persistent drift, swap the previous-page reference for the cover and prepend the Style-Drift Reminder.

**Why this works:**
- The style reference image (attached every call) anchors the visual style.
- The previous-page reference (attached every call after the cover) anchors character likeness.
- The prompt text inlines the style lock and character bible word-for-word every time — because the model has no memory between calls.

**Format note:** the Cover and Page 1 prompts below show the fully-inlined form. Page prompts 2–13 use `[STYLE LOCK]` and `[CHARACTERS]` placeholders for readability — in a production playbook emitted by `playbook_converter_prompt.md`, those placeholders are replaced with the verbatim Setup Block content.

---

# SETUP BLOCK (Reference — inlined into every page prompt)

This block is not sent to the API by itself. Its contents are copied into each page prompt below.

```
STYLE LOCK:
Children's picture book illustration — COLORED PENCIL, CRAYON, AND PASTEL layered over LOOSE WATERCOLOR WASHES. Visible pencil/crayon TEXTURE on every surface — hatching, stippling, grain. NOT clean digital art. Characters have LARGE ROUND HEADS, big circle eyes with dot pupils, rosy dotted cheeks, scribbly textured hair, short stubby limbs. Warm earthy palette: burnt orange, gold/ochre, rusty red, teal, olive green, deep purple. GENEROUS WHITE SPACE. ALL TEXT HAND-LETTERED in crayon/pencil style — key words MUCH LARGER, mixed sizes/colors, NEVER a typed font. Speech bubbles: hand-drawn wobbly ovals. Panel borders: slightly wobbly pencil lines. Sound effects: ENORMOUS hand-drawn crayon letters with starburst shapes — part of the illustration. Think Brian Biggs picture book illustration. NOT manga, NOT digital, NOT clean vector.

CHARACTER BIBLE:
1. MILO: Age 9, small and wiry. Messy dark brown curly hair drawn with scribbly pencil strokes and flyaway wisps. Fair skin with rosy pink dotted cheeks and freckles. Very large round blue eyes with dot pupils. Wears a bright sky-blue windbreaker jacket with a gold clock-gear patch on the chest. Orange-and-green patterned rain boots (polka dots or checks — hand-drawn pattern). An oversized chunky wristwatch on his left wrist that glows gold during time jumps. Energetic, curious, talks to the reader.
2. NEDA: Age 10, slight build. Long straight dark brown hair in a ponytail with a red hair tie. Light olive skin with rosy dotted cheeks. Large round dark brown eyes. Cream-colored tunic over dark trousers. A green canvas messenger bag covered in hand-drawn doodles (stars, cat face, soccer ball). Quiet and brave.
3. HANA: Age 8, stocky, shorter than Milo. Reddish-brown bob haircut with bangs, drawn with textured pencil strokes. Fair skin with lots of freckles (stippled dots). Large round green eyes. Yellow t-shirt with a small flag patch. Denim overalls with visible pencil-stroke texture. Red rain boots (always). Carries a paper airplane. Cheerful but worried about her soldier parent.
4. TICK: A small floating golden clock mascot — round analog clock face with stubby crayon-drawn arms and legs. Clock hands form expressions. Wears a tiny crooked top hat. About grapefruit-sized next to the kids. Drawn in warm gold/ochre pencil and crayon with visible texture.

All characters are fictional. Do not base any character on any real person.

VISUAL RULES:
- PRESENT DAY scenes: full warm color, slightly more environmental detail
- PAST/FLASHBACK scenes: softer, more muted watercolor washes underneath, less contrast — like a faded memory
- TIME TRAVEL transitions: loose swirling watercolor washes with hand-drawn calendar pages and clock shapes scattered through
- Emotion drives composition: quiet moments = lots of white space, small figures. Big moments = figures filling the page, giant hand-lettered text
- Important numbers (data points) appear large and bold in hand-drawn colored circles

GLOBAL CONSTRAINTS:
- Aspect ratio: 2:3 portrait
- All text hand-lettered in the image (no typed fonts, no post-production)
- No real names — figures described by appearance and role only
```

---

# PROMPT #1 — COVER

```
Generate a comic book COVER. Same art style as the reference images from setup. Aspect ratio 2:3, portrait.

Milo (age 9, messy dark brown curly hair with flyaway wisps, big round blue eyes, rosy dotted cheeks, freckles, sky-blue windbreaker with gold clock-gear patch, orange-and-green patterned rain boots, oversized glowing gold wristwatch) is riding a giant glowing wristwatch laid flat like a surfboard. He's soaring through a swirl of loose watercolor washes — sky blue, warm gold, lavender — with hand-drawn calendar pages fluttering around him ("DEC 2025," "JAN 2026," "FEB 2026," "MAR 2026") and little crayon-drawn clock gears floating like bubbles.

Milo is grinning with a wide-open mouth showing teeth, one arm forward, windbreaker billowing. His body language is BIG and dynamic.

Tick (small golden clock mascot with stubby arms, crooked top hat) rides on his shoulder, tiny arms up in excitement, top hat flying off.

Below them, small soft watercolor vignettes are visible like reflections: a crowd marching, ships in a narrow waterway, a gas station, a girl on porch steps. These are muted and soft.

Background: mostly white page with swirling watercolor washes of gold and blue around the action.

HAND-LETTERED TEXT ON THE IMAGE (drawn in crayon/pencil style, NOT a typed font):
- Title across the top in big, bold, textured crayon letters with mixed colors (warm gold, orange, teal): "The DAY the WORLD Held Its BREATH" — make "WORLD" and "BREATH" extra large
- Subtitle below in smaller hand-lettered text: "— and Then CHEERED (Maybe Too Soon)"
- Tagline at bottom in smaller hand-drawn text: "One kid. One watch. A journey through the events that changed everything."
- Small hand-drawn badge in bottom-left: "BASED ON REAL EVENTS"

All text should look hand-lettered with crayon/pencil texture — NOT a digital font. Make it large and readable.
```

---

# PROMPT #2 — PAGE 1: "Something Big Just Happened"

Server attaches: style reference + cover.png. Page 1 is shown fully inlined below as a second concrete example.

```
Generate a full comic book PAGE. Same art style and characters as reference image. Aspect ratio 2:3, portrait. All text hand-lettered.

Layout: 3 panels with hand-drawn wobbly pencil-line borders. Generous white space between panels.

PANEL 1 (large, top half of page):
Milo (messy dark brown curly hair, big round blue eyes, rosy dotted cheeks, freckles, sky-blue windbreaker with gold clock-gear patch, patterned rain boots, oversized wristwatch) sitting cross-legged on a cozy blue couch. Cereal bowl on one knee, spoon frozen halfway to his open mouth. He's staring at a TV on the wall. The TV screen shows a big bright green upward arrow and "MARKETS SURGE" in hand-drawn text. Warm golden watercolor wash coming through a window. A hand-drawn world map poster on the wall. Couch has visible pencil-stroke texture on the fabric.
HAND-LETTERED TEXT floating above in crayon style: "April 1, 2026. Something BIG is happening."
SPEECH BUBBLE from Milo (hand-drawn wobbly oval): "Why is everyone so HAPPY all of a sudden?"

PANEL 2 (bottom-left):
Close-up of an adult's hands holding a phone. Phone screen shows hand-lettered headline: "PRESIDENT: TROOPS COMING HOME in WEEKS." Hands drawn with visible pencil strokes.
HAND-LETTERED TEXT floating nearby: "The President said soldiers are coming HOME from a war. People felt hopeful."

PANEL 3 (bottom-right):
Milo turned to face the reader directly, pointing with his thumb at the world map behind him. Wide eyes, excited grin. Tick (small golden clock, crooked top hat) floats beside his head.
SPEECH BUBBLE from Milo: "But HOW did we get here? Let's find out."
SPEECH BUBBLE from Tick: "Hold on to your hat. We're going BACK IN TIME!"

Milo's wristwatch should glow with soft gold crayon marks around it in Panel 3.
```

---

# PROMPT #3 — PAGE 2: "Into the Time Stream"

Server attaches: style reference + previous page.

```
Generate a full comic book SPLASH PAGE — one big illustration filling the whole page, NO panel borders. Same art style as reference image. Aspect ratio 2:3, portrait.

Milo (messy dark brown curly hair, big round blue eyes, sky-blue windbreaker, patterned rain boots, oversized wristwatch BLAZING with gold crayon glow marks) is leaping joyfully through a swirling tunnel of LOOSE WATERCOLOR WASHES — sky blue, warm gold, lavender all blending and swirling together like paint dropped in water. His body is stretched out mid-leap, one arm forward, windbreaker billowing. Big wide grin, teeth showing.

Calendar pages flutter around him drawn in pencil — "DEC 2025," "JAN 2026," "FEB 2026." Crayon-drawn clock gears float like bubbles. Gold ripple rings radiate from his glowing watch.

Tick (golden clock mascot, crooked top hat) rides on his shoulder, stubby arms up, top hat flying.

The tunnel curves toward warm golden light ahead.

Lots of white page around the edges — the watercolor swirls don't fill every corner.

HAND-LETTERED TEXT at top in large crayon-style letters: "When you want to understand TODAY, sometimes you have to visit YESTERDAY."

Small HAND-DRAWN BADGE at bottom-right: "NEXT STOP → Stop #1: Late December 2025"

Make this feel magical and full of wonder. Loose, warm, textured. The watercolor should look like actual wet paint, not digital gradients.
```

---

# PROMPT #4 — PAGE 3: "People March in the Streets"

Server attaches: style reference + previous page.

```
Generate a full comic book PAGE. Same art style and characters as reference image. Aspect ratio 2:3, portrait. All text hand-lettered.

This page is a FLASHBACK — colors should be slightly SOFTER and more MUTED than the present-day pages. The watercolor washes underneath should be gentler, like a faded memory.

Layout: 4 panels.

PANEL 1 (top, wide):
A wide view of a city street. Thousands of people fill the street, arms linked, some with fists raised. Colorful awnings on buildings (orange, green, blue) drawn with crayon texture. The crowd is diverse — old and young. Neda (long dark brown ponytail, red hair tie, cream tunic, green doodled messenger bag) stands at the edge of the crowd, gripping her bag strap, eyes wide and serious. Warm but muted afternoon light.
HAND-DRAWN BADGE top-left: "STOP #1: Late December 2025"
HAND-LETTERED TEXT floating above: "Our first stop: IRAN, a country far from home. People were UPSET. Life had become really HARD."

PANEL 2 (bottom-left):
A family in the crowd — a mother holding a child's hand, carrying a sign. An elderly man with a walking stick beside them. Neda visible nearby. Drawn with warm colored pencil, rosy cheeks on everyone.
HAND-LETTERED TEXT: "They MARCHED because they wanted things to CHANGE."

PANEL 3 (bottom-center, small — emotional close-up):
Just Neda's face filling the small panel. Her big dark eyes are glistening. Tiny gray pencil-drawn cloud shapes near her head. Hand gripping bag strap visible at bottom edge. Soft watercolor wash background — no setting, just emotion.
SPEECH BUBBLE (small, wobbly hand-drawn oval): "I just want things to be okay."

PANEL 4 (bottom-right):
Soldiers in helmets (simple, no specific insignia — just shapes) in a line facing the crowd. A tense gap between them. Papers and pencil-drawn dust marks in the air. Colors shift COOLER — blue-gray watercolor wash underneath.
HAND-LETTERED TEXT: "The government didn't LISTEN. The whole world was WATCHING."
```

---

# PROMPT #5 — PAGE 4: "A Glimmer... Then Everything Changes"

Server attaches: style reference + previous page.

```
Generate a full comic book PAGE. Same art style and characters as reference image. Aspect ratio 2:3, portrait. All text hand-lettered.

Layout: 4 panels — the mood SHIFTS dramatically from hopeful at top to somber at bottom.

PANEL 1 (top-left — warm bright colors, SOFT watercolor edges):
A round table in a conference room. Simplified friendly figures in suits shake hands across it. A beam of golden light from a window. Little hand-drawn star/sparkle shapes in the air. Milo (messy curly brown hair, blue windbreaker, patterned rain boots) peeks in from the panel edge, smiling.
HAND-DRAWN BADGE: "STOP #2: February 27, 2026"
HAND-LETTERED TEXT: "Countries sat down to TALK. For one day, there was a BREAKTHROUGH!"

PANEL 2 (top-right — warm colors):
Milo grinning, arms crossed. Tick floating nearby with clock-hands in a grin position. A golden crayon-drawn sunrise behind them.
SPEECH BUBBLE from Milo: "Maybe everything will be OKAY!"
SPEECH BUBBLE from Tick: "Hold on... let's see what happens NEXT."

PANEL 3 (center — thin horizontal strip across the full page):
A torn calendar drawn in pencil/crayon. Left page: "FEB 27" in warm gold with a small sun. Right page: "FEB 28" in cool blue-gray with a lightning bolt. A jagged hand-drawn tear rips down the middle.
HAND-LETTERED TEXT in large crayon letters across the tear: "But the VERY NEXT DAY..."

PANEL 4 (bottom, large — colors shift COOL, blue-gray watercolor washes):
The city street from Page 3, but changed. Gray sky — cool watercolor wash. Dust and papers in the air (pencil-drawn). Some buildings have cracked walls (drawn gently — broken pencil lines, not graphic). Neda (ponytail, red hair tie, cream tunic, green bag) sits on a low wall hugging her messenger bag to her chest. A small boy (age 6) sits beside her staring at the ground, holding a little stuffed cat. Adults carry belongings behind them. NO sparkles — the page feels heavy and quiet.
HAND-DRAWN BADGE: "STOP #3: February 28, 2026"
HAND-LETTERED TEXT: "WAR started. Planes and missiles hit military targets. Many leaders were killed."
HAND-LETTERED TEXT at bottom, slightly smaller: "Sadly, some strikes hit places they shouldn't have. A SCHOOL was hit. Children and teachers were hurt. Over 1,350 regular people have been killed."

Make "Sadly" and "SCHOOL" emotionally weighted — slightly larger, maybe a different color (deep blue or purple).
```

---

# PROMPT #6 — PAGE 5: "This Part Is Hard"

Server attaches: style reference + previous page.

```
Generate a full comic book PAGE. Same art style and characters as reference image. Aspect ratio 2:3, portrait. All text hand-lettered. This is a QUIET, REFLECTIVE page. Lots of white space.

Layout: 2 large illustrations stacked vertically with generous white space around them.

TOP HALF (soft muted colors — flashback):
Neda (dark brown ponytail, red hair tie, cream tunic, green doodled messenger bag) walking down a quiet side street with the young boy from the previous page. Her hand is on his shoulder. Her face: determined — brow furrowed, mouth firm, eyes forward. The boy holds a small stuffed cat toy. Behind them, gray sky but ONE small break in the clouds where pale gold watercolor light peeks through. Buildings on this street are intact. Drawn with soft colored pencil, muted watercolor washes underneath.
HAND-LETTERED TEXT floating in the white space: "War hurts REGULAR people. Kids. Teachers. Families. And that is NEVER okay — no matter which side you're on."

BOTTOM HALF (warm present-day colors):
Milo (curly brown hair, blue windbreaker) sitting on the edge of his couch, facing the reader. Serious expression — no grin. Hands on his knees. Tick floats beside him, clock-hands drooping sadly, top hat held against its body. Warm living-room light — soft gold watercolor wash.
SPEECH BUBBLE from Milo (hand-drawn, wobbly): "Some parts of the truth are HARD. But Time Travelers don't look away."
HAND-LETTERED TEXT at bottom: "Let's keep going. The story isn't OVER."

Keep this page gentle. No dramatic action. The emotion comes from quiet body language and white space.
```

---

# PROMPT #7 — PAGE 6: "The Water Closes"

Server attaches: style reference + previous page.

```
Generate a full comic book PAGE. Same art style and characters as reference image. Aspect ratio 2:3, portrait. All text hand-lettered.

Layout: 4 panels.

PANEL 1 (top, small — time-travel transition):
Milo running through swirling watercolor washes (blue, gold, lavender). Watch glowing. Tick riding on his head. Pencil-drawn calendar pages reading "MARCH 2026" flutter past.
HAND-DRAWN BADGE: "STOP #4: Early March 2026"
HAND-LETTERED TEXT: "Iran struck back. And then they did something that changed EVERYTHING..."

PANEL 2 (middle, LARGE — bright clear colors, bird's-eye view):
A map-like aerial view of the Strait of Hormuz — a narrow strip of bright turquoise watercolor between two sandy-gold landmasses. Cute round-hulled oil tanker ships (drawn like chunky bath toys with crayon texture) lined up trying to pass through. A big RED barrier has dropped across the narrow water like a boom gate. Ships pile up on one side, empty water on the other. Tick floats above pointing down with one stubby arm.
HAND-LETTERED TEXT: "Iran CLOSED the Strait of Hormuz — a narrow strip of water where one out of every FIVE barrels of oil in the WHOLE WORLD passes through."
Small text in a hand-drawn dotted box: "STRAIT = a narrow passage of water between two pieces of land"
Make "CLOSED," "FIVE," and "WHOLE WORLD" extra large in the hand-lettering.

PANEL 3 (bottom-left):
Hand-drawn golden ripple circles connect from the Strait above down to this panel — an American gas station. Family car at a pump. Price sign shows "$4.89" in big hand-drawn red numbers. Hana (reddish-brown bob, bangs, freckles, yellow t-shirt, denim overalls, RED RAIN BOOTS) staring up at the price sign. Her parent (back to camera) holds the gas nozzle, grimacing.
SPEECH BUBBLE from Hana: "Mom, why does gas cost so MUCH now?"
HAND-LETTERED TEXT: "When oil can't move, prices go UP — for everyone."

PANEL 4 (bottom-right):
Grocery store shelf drawn with pencil/crayon texture. Bread, milk, cereal with hand-drawn upward red arrows next to price tags. A parent's hand hesitates reaching for cereal. Tick in the corner.
HAND-LETTERED TEXT: "And when oil costs more, EVERYTHING costs more."
Large hand-drawn text inside a RED CIRCLE: "$126 per barrel!"
```

---

# PROMPT #8 — PAGE 7: "Peace Gets Hard"

Server attaches: style reference + previous page.

```
Generate a full comic book PAGE. Same art style and characters as reference image. Aspect ratio 2:3, portrait. All text hand-lettered.

Layout: 3 panels.

PANEL 1 (top, wide — soft muted flashback colors):
A split scene. LEFT: a suited figure behind a podium holds up a thick document labeled "15 IDEAS for PEACE" (hand-lettered). RIGHT: another suited figure holds a thinner document labeled "5 IDEAS for PEACE." Between them, a big hand-drawn red "X." Milo (curly hair, blue windbreaker, patterned rain boots) stands tiny in the center with arms stretched toward both sides like a referee, frustrated face.
HAND-DRAWN BADGE: "STOP #5: March 8–25, 2026"
HAND-LETTERED TEXT: "Both sides tried to make a deal. The U.S. sent 15 ideas. Iran sent 5. Neither could AGREE."
SPEECH BUBBLE from Milo: "It's like two people arguing who can't find the MIDDLE!"

PANEL 2 (bottom-left, slightly larger — somber, warm but quiet):
Hana (reddish-brown bob, freckles, yellow t-shirt, overalls, RED RAIN BOOTS) sitting on her front porch steps folding a paper airplane. Through an open door behind her, a TV is visible. Her expression: worried, not really seeing the airplane. Tiny gray pencil-drawn cloud shapes near her head. Beside her on the step, a framed photo of an adult in military uniform (uniform visible, warm smile suggested but face not detailed). Drawn with soft colored pencil, warm but muted.
HAND-LETTERED TEXT: "15 American soldiers didn't come HOME. 300 more were hurt."
SPEECH BUBBLE from Hana (small, quiet): "Come home soon."

PANEL 3 (bottom-right, small):
Close-up of Milo's wristwatch on his left wrist. The watch face shows "DAY 33" in hand-drawn numbers instead of regular time. Soft gold crayon glow around the watch.
HAND-LETTERED TEXT: "The war was 33 days old."
Large hand-drawn text in a RED CIRCLE: "DAY 33"
```

---

# PROMPT #9 — PAGE 8: "Hope Returns?"

Server attaches: style reference + previous page.

```
Generate a full comic book PAGE. Same art style and characters as reference image. Aspect ratio 2:3, portrait. All text hand-lettered.

Layout: 4 panels.

PANEL 1 (top, small — time-travel transition):
Milo emerging from swirling watercolor into bright golden light, shielding eyes with one hand. Tick on his shoulder, clock-hands pointing straight up (excited). Calendar pages "MARCH 31, 2026" flutter past.
HAND-DRAWN BADGE: "STOP #6: March 31, 2026"
HAND-LETTERED TEXT: "And then — TWO big announcements in ONE day!"
Make "TWO" and "ONE" extra large.

PANEL 2 (middle-left):
A TV screen showing a press conference — a suited figure behind a podium with a seal (drawn generically, no identifying features). Milo's living room visible around the TV.
SPEECH BUBBLE from the TV: "Our troops will be HOME in two or three weeks!"
HAND-LETTERED TEXT: "The President said the war would END soon."

PANEL 3 (middle-right):
A TV news graphic showing a hand-drawn globe with two countries highlighted in green. Arrows curve toward the conflict zone. A hand-lettered banner: "NEW PEACE PLAN." Three small crayon-drawn icons: crossed-out swords, a ship in water, two chairs facing each other.
HAND-LETTERED TEXT: "China and Pakistan said: STOP fighting, OPEN the water, sit down and TALK."
Make "STOP," "OPEN," and "TALK" extra large.

PANEL 4 (bottom, wide — SPLIT into two sides):
LEFT SIDE: Milo's living room — Milo LEAPING off the couch with arms up, cereal flying everywhere. Little hand-drawn star sparkles ALL around him. Parent (back to camera) pumping fist. TV shows green arrows. Bright, warm, joyful colors. Big, dynamic, lots of energy.
RIGHT SIDE: Iranian street — Neda (ponytail, red hair tie, cream tunic, green messenger bag) standing very still, looking up. NOT celebrating. Cautious expression — one hand on bag strap, eyes slightly narrowed. Only ONE tiny hand-drawn sparkle near her — much smaller and lonelier than Milo's explosion of sparkles.
SPEECH BUBBLE from Milo (big, excited): "YES! It's going to be OKAY!"
SPEECH BUBBLE from Neda (small, quiet): "I hope so. But I've heard that before."

The contrast between the two sides should be visually dramatic — LEFT is loud and full, RIGHT is quiet and sparse.
```

---

# PROMPT #10 — PAGE 9: "Is This Time for Real?"

Server attaches: style reference + previous page.

```
Generate a full comic book PAGE. Same art style and characters as reference image. Aspect ratio 2:3, portrait. All text hand-lettered.

Layout: 3 panels.

PANEL 1 (top, large — PLAYFUL and FUNNY):
A slapstick game of musical chairs! Cartoon adults in suits are SCRAMBLING, DIVING, and TRIPPING over each other to grab chairs. Chairs have hand-drawn dollar signs on them. Music notes fly through the air. One figure is completely mid-air. It's chaotic and HILARIOUS — big exaggerated expressions, arms and legs everywhere. Tick floats above blowing a tiny whistle. Drawn with energetic, loose pencil strokes and bright watercolor splashes.
HAND-LETTERED TEXT: "Not everyone thinks the good news is REAL. Some say the stock market jumped because of a 'SHORT SQUEEZE.'"
Small hand-drawn text in a dotted box: "SHORT SQUEEZE = like MUSICAL CHAIRS — everyone scrambling at once!"
Large crayon sound effect text: "SCRAMBLE!" with starburst behind it.

PANEL 2 (bottom-left):
Two small "snapshot" frames inside the panel — like crayon-drawn Polaroid photos pinned to a wall with tape. PHOTO 1: people with sparkle stars around them, labeled in hand-lettering: "Earlier in March: HOPE!" PHOTO 2: same people with gray cloud shapes, sparkles fading, labeled: "Then: DISAPPOINTMENT." Below the photos, Milo holds them up, expression serious.
HAND-LETTERED TEXT: "This has happened TWICE before. People got hopeful, and both times the hope FADED."

PANEL 3 (bottom-right):
Milo in front of his TV. TV shows hand-drawn countdown: "TONIGHT — 9 PM." Milo looks at reader with one eyebrow raised, head tilted — "what do you think?" face. Tick sits on the TV, clock-hands at 10-and-2 (thinking).
SPEECH BUBBLE from Milo: "Tonight, the President talks to the WHOLE country."
SPEECH BUBBLE from Tick: "Is this time for REAL? Nobody knows yet."
```

---

# PROMPT #11 — PAGE 10: "How One Thing Leads to Another"

Server attaches: style reference + previous page.

```
Generate a full comic book PAGE — one large illustration filling the whole page. Same art style as reference image. Aspect ratio 2:3, portrait. All text hand-lettered.

A visual DOMINO CHAIN flows from top to bottom of the page like a winding path. Each domino is a small rounded hand-drawn rectangle with a colorful crayon illustration inside and a hand-lettered label. GOLDEN HAND-DRAWN RIPPLE LINES (wavy concentric circles) connect each domino to the next.

The chain from top to bottom:

DOMINO 1 (top): crowd marching. Label: "People demand CHANGE"
Wavy golden line down to →
DOMINO 2: handshake breaking apart. Label: "Peace talks FAIL"
Wavy golden line down to →
DOMINO 3: planes in the sky. Label: "WAR begins"
Wavy golden line down to →
DOMINO 4: red barrier across blue water. Label: "The Strait CLOSES"
Wavy golden line down to →
DOMINO 5: gas station with climbing price numbers. Label: "Oil prices SOAR"
Wavy golden line down to →
DOMINO 6: grocery shelf with upward arrows. Label: "Everything costs MORE"
Wavy golden line down to →
DOMINO 7: Hana (red rain boots, overalls) on porch steps. Label: "Families WORRY"

At the bottom, Milo (curly hair, blue windbreaker, patterned rain boots) stands looking up at the chain with arms spread wide. Tick floats beside him.

HAND-LETTERED TEXT at top in large crayon letters: "ONE thing leads to ANOTHER. A war far away can change the price at YOUR grocery store."
SPEECH BUBBLE from Milo at bottom: "See? Geography MATTERS!"

Make each domino illustration small, colorful, and immediately recognizable. The golden ripple lines should look hand-drawn and warm. Generous white page around the chain.
```

---

# PROMPT #12 — PAGE 11: "The Whole World Feels It"

Server attaches: style reference + previous page.

```
Generate a full comic book PAGE. Same art style and characters as reference image. Aspect ratio 2:3, portrait. All text hand-lettered.

Layout: 3 panels.

PANEL 1 (top, wide):
A cute hand-drawn globe seen from above. Around it, small circular crayon-drawn vignettes float like satellites — each is a tiny scene: a family at a gas pump, a ship stuck in water, a soldier calling home on a phone, a child watching the news. Golden hand-drawn ripple lines radiate from the globe to each vignette. The globe has soft rounded continents in green watercolor and blue oceans.
HAND-LETTERED TEXT: "When one country does something BIG, it RIPPLES out and touches people EVERYWHERE — even kids going to school far, far away."

PANEL 2 (bottom-left — soft muted flashback colors):
Neda (ponytail, red hair tie, cream tunic, green doodled messenger bag) walking toward a school entrance. Sandbags near the door. A taped-up cracked window. But kids are filing in. Neda walks with the young boy (he still holds his stuffed cat). Chin up, eyes forward — resolute. Soft colored pencil rendering.
SPEECH BUBBLE from Neda: "We still go to SCHOOL. We still keep GOING."

PANEL 3 (bottom-right — warm present-day colors):
Hana (reddish-brown bob, freckles, yellow t-shirt, overalls, RED RAIN BOOTS) at a kitchen table doing homework. Paper airplane beside notebook. Red rain boots dangle from chair — feet don't reach the floor. A phone on the table shows a text: heart emoji from "Dad" with "Miss you, bug." Hana smiling a small private smile. Warm gold watercolor wash for the light.
SPEECH BUBBLE from Hana: "Dad says he might be coming HOME soon."
HAND-LETTERED TEXT: "The hope is REAL. But so is the waiting."
```

---

# PROMPT #13 — PAGE 12: "Hoping and Knowing"

Server attaches: style reference + previous page.

```
Generate a full comic book PAGE. Same art style and characters as reference image. Aspect ratio 2:3, portrait. All text hand-lettered.

Layout: 3 panels.

PANEL 1 (top):
Two hand-drawn doors side by side in a hallway. LEFT door labeled "HOPING" in warm gold crayon letters — painted in golden-orange watercolor with little hand-drawn sparkle stars around it, looks warm and inviting. RIGHT door labeled "KNOWING" in sky-blue crayon letters — painted in blue watercolor with a magnifying glass icon, looks solid and trustworthy. Between the doors, Milo (curly hair, blue windbreaker, patterned rain boots) stands with one hand on each doorknob, grinning at the reader. Tick floats above pointing to both.
HAND-LETTERED TEXT: "HOPING is wonderful. But KNOWING means asking questions and checking the facts."
SPEECH BUBBLE from Milo: "You can walk through BOTH doors!"
Make "HOPING" and "KNOWING" very large, each matching the color of its door.

PANEL 2 (middle, wide — this is the emotional climax):
All three kids together for the FIRST TIME. Milo (center, blue windbreaker), Neda (left, cream tunic, green messenger bag, red hair tie), and Hana (right, yellow t-shirt, overalls, RED RAIN BOOTS, holding paper airplane up). Standing in a row facing the reader. Milo's arms around the other two's shoulders. Neda has a cautious half-smile. Hana is grinning. Warm cream/white background with golden hand-drawn ripple lines radiating from behind them. Their different colors (Milo's blue, Neda's cream/green, Hana's yellow/red) make a colorful trio. Big, warm, central composition.
HAND-LETTERED TEXT: "Different countries. Different lives. But the SAME WORLD — connected by everything that happens in it."

PANEL 3 (bottom — closing):
Milo's living room. Milo on the couch, notebook open in lap, pen in hand. Looking directly at reader with warm knowing expression. Tick on the couch arm, top hat on straight, clock-hands at 10-and-2. TV is OFF. World map poster visible. Warm golden watercolor wash — golden hour light.
SPEECH BUBBLE from Milo: "The war is 33 days old. Countries are still talking. Nobody knows what happens NEXT."
SPEECH BUBBLE from Milo: "But now YOU know how we got here. And that's where understanding STARTS."
HAND-LETTERED TEXT at bottom in gentle crayon: "The story is still going. Keep traveling. Keep asking. Keep THINKING."
```

---

# PROMPT #14 — PAGE 13: "Your Time Traveler Kit"

Server attaches: style reference + previous page.

```
Generate a full comic book PAGE. Same art style and characters as reference image. Aspect ratio 2:3, portrait. All text hand-lettered. Layout: 4 panels in a 2x2 grid — each is a standalone "tip card" with a hand-drawn sky-blue banner header.

PAGE TITLE at top in large crayon letters: "Your TIME TRAVELER Kit"

PANEL 1 (top-left — tip card):
Milo holding a magnifying glass up to a newspaper headline. The magnifying glass reveals a question mark hidden inside the headline.
HAND-DRAWN SKY-BLUE BANNER: "ASK: Who SAID this?"
HAND-LETTERED TEXT below: "Every story comes from someone. Ask: who is telling it, and what might they LEAVE OUT?"

PANEL 2 (top-right — tip card):
Three colorful hand-drawn dominoes toppling in sequence. Each has a tiny icon: a wave, a dollar sign, a shopping bag.
HAND-DRAWN SKY-BLUE BANNER: "TRACE the Chain"
HAND-LETTERED TEXT below: "When something happens, ask: what happened BEFORE? And what might happen NEXT?"

PANEL 3 (bottom-left — tip card):
A cute hand-drawn globe with two kids on opposite sides waving to each other. Golden crayon ripple lines connect them across the surface.
HAND-DRAWN SKY-BLUE BANNER: "ZOOM Out"
HAND-LETTERED TEXT below: "A MAP can show you why something far away matters right HERE at home."

PANEL 4 (bottom-right — tip card):
The two doors from Page 12 — "HOPING" (gold) and "KNOWING" (blue) — but now BOTH doors are wide open and warm light streams through both. Milo walks between them into the light.
HAND-DRAWN SKY-BLUE BANNER: "HOPE and Check"
HAND-LETTERED TEXT below: "It's okay to HOPE. But always check: is this hope, or is this a FACT? Both matter!"

Small hand-lettered text at very bottom: "Based on events as of April 1, 2026. Events are ongoing."
HAND-DRAWN STAMP at bottom center: "STATUS: TIME TRAVELING CONTINUES!"
```

---

# TROUBLESHOOTING

| Problem | Fix |
|---------|-----|
| **Text is garbled or misspelled** | Regenerate. Try: "Regenerate with perfectly spelled, legible text. The text should look HAND-LETTERED but be correctly spelled." |
| **Characters look different page to page** | Server retries the page with the cover (known-good) as the previous-page reference instead of the immediately-prior page. Add to prompt: "Keep character designs exactly consistent with reference image." |
| **Style drifts to clean digital / manga** | Add at start: "STYLE: Children's picture book illustration — colored pencil and crayon hatching over watercolor washes. Visible pencil texture on everything. NOT digital art, NOT manga, NOT clean vector. Think Brian Biggs or Oliver Jeffers illustration." |
| **Text looks like a typed font** | Add: "ALL text must look HAND-LETTERED — as if drawn with crayon or pencil. Irregular, textured, with key words drawn LARGER. Never a typed computer font." |
| **Not enough white space** | Add: "Leave generous WHITE SPACE on the page. Characters and text should breathe. Not every inch needs to be filled." |
| **Pencil/crayon texture missing** | Add: "I need visible COLORED PENCIL HATCHING and CRAYON TEXTURE on all surfaces — skin, clothing, objects. You should be able to see individual pencil strokes." |
| **Flashback panels look same as present** | Add: "This is a FLASHBACK/MEMORY scene — use SOFTER, MORE MUTED watercolor washes with less contrast. Colors should feel slightly faded compared to present-day panels." |
| **Speech bubbles too clean** | Add: "Speech bubbles should be HAND-DRAWN — slightly wobbly pencil-line outlines, not perfect smooth ovals." |
| **Too many panels crammed** | Reduce to 2–3 panels. Say: "Use larger panels with more white space between them." |
| **AI refuses to generate** | Check for real names. All figures described by clothing/role only, never by name. |
| **Image is square** | Specify: "Aspect ratio 2:3, portrait orientation." |
| **Only getting 1 panel** | Add: "This should be a FULL COMIC PAGE with multiple panels on a single image." |

---

# QUICK CHECKLIST

- [ ] Setup Block: inlined verbatim into every page prompt (reference only — not an API call)
- [ ] Prompt #1: Cover
- [ ] Prompt #2: Page 1 — Something Big Just Happened (3 panels)
- [ ] Prompt #3: Page 2 — Into the Time Stream (1 splash)
- [ ] Prompt #4: Page 3 — People March in the Streets (4 panels)
- [ ] Prompt #5: Page 4 — A Glimmer / Everything Changes (4 panels)
- [ ] Prompt #6: Page 5 — This Part Is Hard (2 panels)
- [ ] Prompt #7: Page 6 — The Water Closes (4 panels)
- [ ] Prompt #8: Page 7 — Peace Gets Hard (3 panels)
- [ ] Prompt #9: Page 8 — Hope Returns? (4 panels)
- [ ] Prompt #10: Page 9 — Is This Time for Real? (3 panels)
- [ ] Prompt #11: Page 10 — How One Thing Leads to Another (1 infographic)
- [ ] Prompt #12: Page 11 — The Whole World Feels It (3 panels)
- [ ] Prompt #13: Page 12 — Hoping and Knowing (3 panels)
- [ ] Prompt #14: Page 13 — Your Time Traveler Kit (4 tip cards)

**Total: 14 API calls → 14 images → 1 complete comic book**

---

# STYLE-DRIFT REMINDER (prepended on retry if a page drifts)

```
STYLE REMINDER: Children's picture book illustration. Colored pencil, crayon, and pastel LAYERED OVER loose watercolor washes. Visible hatching, stippling, and pencil grain on every surface. Large round-headed characters with big circle eyes, dot pupils, rosy stippled cheeks, scribbly textured hair. Warm earthy palette: burnt orange, ochre gold, teal, rusty red, olive green, deep purple. GENEROUS WHITE SPACE. ALL text is HAND-LETTERED in crayon/pencil — key words drawn LARGER, mixed sizes and colors within sentences. Speech bubbles are wobbly hand-drawn ovals. Panel borders are slightly wobbly pencil lines. Think Brian Biggs / Oliver Jeffers. NOT manga, NOT digital, NOT clean vector art. Warm, textured, tactile, handmade.
```

---

# CHARACTER REFERENCE

| In the comic | Based on |
|---|---|
| Milo (curly brown hair, blue windbreaker, glowing watch, patterned rain boots) | Original fictional narrator/guide |
| Neda (ponytail, cream tunic, green messenger bag) | Composite — represents Iranian civilians |
| Hana (bob, freckles, red rain boots, overalls) | Composite — represents American military families |
| Tick (golden clock mascot, crooked top hat) | Original fictional narrator companion |
| "The President" (suited figure behind podium) | Generic — no specific individual |
| Conference figures (suited figures at table) | Generic diplomats |

---

*Playbook for "The Day the World Held Its Breath" — Storybook Crayon style, zero post-production Nano Banana workflow. All real names removed for clean generation.*
