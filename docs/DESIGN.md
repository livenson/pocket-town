# Design

The source of truth for the look is the design canvas; the files in `design-reference/` are copies of its key artboards and the two interactive prototypes. Tokens and icons are already in code: `src/design/tokens.ts` and `src/design/icons.ts`.

## Identity: wooden peg-folk, felt and clay

Chunky rounded shapes, flat colour with simple inset shading (a darker band at the bottom of shapes, a lighter band on one side), thick aubergine outlines on important objects, soft "toy" press shadows. Warm and high-contrast. No gradients, no glossy effects, no emoji.

### Colour

| Token | Hex | Use |
|---|---|---|
| ink (aubergine) | `#2A1640` | text, outlines, selected states |
| ground (apricot) | `#FFE6CF` | app background |
| paper | `#FFF8F0` | cards, sheets, docks |
| tomato | `#EF4B2F` (shadow `#B8321C`, text-safe `#C7341B`) | primary actions, current step |
| marigold | `#FFB627` (shadow `#C98800`) | dice, hint halos, carried item |
| teal | `#0FA394` (dark `#0B7A6F`, shadow `#075249`) | world, done, valid targets |
| cornflower | `#4F6BF0` (shadow `#2F45B5`) | friends, presence |
| blossom | `#FF8FB1` | hearts, cheeks |
| leaf | `#7BC74D` | gardens, map grass `#9AD46F` |
| sky | `#BFE3FF` | outdoor backgrounds |
| muted text | `#5E3F62` | secondary text on light grounds (AA) |

Room pastels: kitchen `#FFE08A`, living `#BFE6DC`, bedroom `#FAD0DC`, bath `#CDD6FF`, music `#E6CCF0`, play `#D9F0C4`. Wood floor `#E0A46B` / `#F3C99B`.

Use the text-safe variants (`#C7341B`, `#0B7A6F`) for any text or icon on light grounds. White text only on tomato, teal-dark, cornflower and ink.

### Type

- **Baloo 2 ExtraBold (800):** titles, names, button words, numbers.
- **Nunito Black/Bold (900/700):** optional labels for older children (20–24 px), grown-up text (16 px, minimum 14).
- All text is optional for children; meaning always comes from icon + motion + voice.

### Icons

One family: 32 × 32 grid, round caps and joins, stroke 2.6, no fills, drawn with `currentColor`. Every icon has exactly one meaning across the app. Full set in `src/design/icons.ts`. Add new icons in the same style and keep a list in `icons.ts`.

## Peg-folk

Single wooden-peg silhouette, felt clothes, dot eyes. No gender step; every option mixes freely.

Construction (relative to height H; width W = 0.62 H; head diameter d = 0.86 W):

- Body: rounded rectangle from y = 0.1 H + 0.8 d to the bottom, top corners strongly rounded (≈ 46% / 36%), bottom slightly rounded; outfit colour; a lighter inset on the left and a darker one on the right; a dark band near the bottom.
- Head: circle of diameter d, centred horizontally, top at 0.1 H; skin colour; soft darker inset at bottom-right.
- Hair: cap over the top of the head (bob, crop), side locks (bob), a large round puff on top (puff), a small bun on top (bun), or none.
- Eyes: two dots at 30% and 60% across the head, 47% down; "sleep" = short horizontal bars; "wow" = taller ovals with an open "o" mouth.
- Cheeks: blossom ovals at 42% opacity. Mouth: a small curved smile.
- Helpers: wheelchair (large wheel behind the body, push handle, small front caster), hearing aid (teal rounded shape at the ear with white edge), prosthetic arm (light grey rounded limb with outline).

Skin tones: `#F6D2B4 #EDC09A #E9B48A #D49C6C #C98E62 #A86E46 #8D5A3B #5A3725`. Hair: `#2A1640 #5A2E1A #C2552B #FFB627 #FF8FB1`. Outfits: any palette accent.

See `design-reference/Peg.dc.html` for the exact geometry in code (its `renderVals()` computes every part).

## Layout

One system on every screen: the stage fills the middle; tools live on the same edges everywhere.

| Position | Content |
|---|---|
| Top-left | Home, undo, redo |
| Top-centre | Event ticker (age 9+), presence chips (future) |
| Top-right | Map, edit (pencil) |
| Left edge | Characters dock (portraits in the current room) |
| Bottom | Object drawer with category tabs |
| Bottom-right | Camera, time control pill (pause, play, fast) |

- **Phone portrait:** characters and objects fold into a "+" button (bottom-centre) that opens a bottom sheet with two tabs.
- **Tablet and phone landscape:** all docks visible.
- **Desktop:** hover labels showing the shortcut key, voice on hover.
- **Left-handed setting:** mirror left/right docks and bottom-right controls.

### Desktop keyboard shortcuts

`H` home · `M` map · `E` edit · `Space` pause/play · `F` faster · `C` camera · `Tab` next bot · `Enter` open bot card · `Ctrl/⌘ Z` undo · `Ctrl/⌘ Shift Z` redo · `Esc` close/drop · `?` show shortcuts.

## Controls

- **Pressable toys:** buttons have a solid bottom shadow (5–6 px) in a darker shade and move down when pressed.
- **Selected state:** a 4–5 px aubergine ring plus a tick badge (never colour alone).
- **Carried item:** marigold halo; valid targets pulse with a teal dashed outline and a tick badge; invalid targets show a red cross badge.
- **Hold to delete:** ring fills over 700 ms around the trash icon; releasing early cancels.
- **Carousels:** 4–8 large tiles per page, arrow buttons, page dots (filled = current).
- **Hint halo:** pulsing marigold ring around the next thing to try; off under calm motion.

## Motion

- Every tap: a short press animation (80–120 ms) and a sound.
- Characters: idle bob (2–3 px, 2 s), walk hop, squash on landing, happy jump.
- Screen changes: slide or pop, 200–300 ms, ease-out. No spinners anywhere: loading shows builders stacking blocks.
- Calm motion / reduced motion: no looping animation except a gentle fade for loading; character movement keeps, hops removed.

## Sound

- Procedural effects via ZzFX; keep a table in `src/audio/sfx.ts` (tap, pick, place, invalid, eat, sleep, doorbell, happy, dice roll, camera).
- **Pocketese:** characters "speak" invented-language syllables generated as short pitched blips, one pitch range per character, so speech has rhythm and emotion without words. Captions are pictures (speech bubble with an icon).
- Example Pocketese words used in voice-over: "Bippa!" (hello / yay), "Moola-moo?" (hungry?), "Tok-tok!" (knock knock).
- Voice-over for instructions uses the speech wrapper (English for now), triggered on long-press / hover and on screen entry where a screen has a question.

## Screens

The design canvas covers all screens; use the matching files in `design-reference/`:

| Code | Screen | Reference |
|---|---|---|
| A1–A5 | Splash, age, gate, profile, offline | `Onboarding.dc.html`, `Proto-Onboarding.dc.html` |
| B2 | Home hub (phone, tablet, desktop) | `HomeHub-*.dc.html` |
| B3 | My characters | `Characters.dc.html` |
| C1 | Avatar wizard | `Avatar-Tablet.dc.html`, `Avatar-Steps.dc.html` |
| C2 | House wizard | `Proto-House.dc.html`, `House-Furnish.dc.html`, `House-Steps.dc.html` |
| D1–D7 | Map, scene, bot card, drawer, follow-cam, time, photo | `Scene-*.dc.html`, `WorldMap-Tablet.dc.html`, `BotCard-Tablet.dc.html`, `Play-Sheet.dc.html` |
| — | Bot legibility | `Bots.dc.html` |
| — | States (empty, loading, error, locked) | `States.dc.html` |
| — | Flows | `Flows.dc.html` |
| — | UI kit and layout rules | `Main.dc.html`, `Layout.dc.html` |

How to read a `.dc.html` file: the visual markup is inside `<x-dc>`; `{{name}}` placeholders and `<sc-for>` / `<sc-if>` blocks are filled from the object returned by `renderVals()` in the `<script type="text/x-dc">` block at the bottom. `<dc-import name="Peg" …>` means "render the Peg component with these props". Inline styles give exact sizes, radii and colours.
