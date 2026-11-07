# Build plan

Work through the milestones in order. Each one ends with something playable at `https://livenson.github.io/pocket-town/`. Tick the boxes as you go. Before marking a milestone done: `npm run lint && npm test && npm run build && npm run e2e` all pass, and the change is pushed and deployed.

---

## M0: scaffold and deploy pipeline

Goal: an empty but real app live on GitHub Pages, with CI.

- [x] Scaffold with Vite (React + TypeScript template), then add PixiJS 8, Zustand, idb-keyval, zzfx, @fontsource/baloo-2, @fontsource/nunito, vite-plugin-pwa.
- [x] Dev tooling: Vitest, @testing-library/react, Playwright, oxlint (type-aware; replaced ESLint, see DECISIONS), Prettier.
- [x] `vite.config.ts`: `base: '/pocket-town/'`; PWA plugin with `registerType: 'autoUpdate'`, manifest (name "Pocket Town", short_name "Pocket Town", `display: 'standalone'`, `orientation: 'any'`, `background_color: '#FFE6CF'`, `theme_color: '#EF4B2F'`, `start_url` and `scope` `/pocket-town/`), generated icons in `public/` (tomato rounded square with a white house glyph from `icons.ts`).
- [x] Copy the provided `src/design/tokens.ts` and `src/design/icons.ts` into place (already in this pack); add `src/design/fonts.css` importing the two @fontsource families (weights 600–900).
- [x] `index.html`: `lang="en"`, viewport `width=device-width, initial-scale=1, viewport-fit=cover`, no external URLs. Disable iOS double-tap zoom on the game surface with `touch-action: manipulation` and on the stage with `touch-action: none`.
- [x] A placeholder screen in the identity: apricot ground, "Pocket Town" in Baloo 2 ExtraBold, one tomato Play button that plays a ZzFX "pop" on tap.
- [x] `.github/workflows/deploy.yml` (provided in this pack; check each action's latest major version and bump if newer). Lint, unit tests and build run on every push and PR; deploy only from `main`.
- [x] Repository settings (do with `gh` if authenticated, otherwise list the steps for the owner):
  - Repo `livenson/pocket-town` exists and is public (GitHub Pages on a free account needs a public repo).
  - Settings → Pages → Build and deployment → Source: **GitHub Actions** (`gh api -X POST repos/livenson/pocket-town/pages -f build_type=workflow`, or `PUT` if Pages already exists).
- [x] `README.md`: what it is, live URL, commands.
- [x] `docs/DECISIONS.md` started.

Acceptance: pushing to `main` deploys; the live URL shows the placeholder and the button makes a sound on iPad Safari; Lighthouse PWA "installable" passes; the network panel shows no third-party requests.

---

## M1: design system in code and the app shell

Goal: the shared look and every reusable control, plus the screen state machine.

- [x] `src/ui/`: `Button` (primary, secondary, dice, done; pressable "toy" look with a 5–6 px bottom shadow that compresses on press), `IconButton` (64 px tablet / 56 px phone; required `label` prop used for `aria-label`, voice-over and the optional text label), `HoldButton` (press-and-hold with a filling ring, 700 ms, cancels on release or leave, keyboard: hold Space/Enter), `Switch` (tick + position, never colour alone), `Sheet` (bottom sheet with drag handle and close), `Carousel` (paged grid with arrow buttons and page dots; swipe optional, never required), `StepRail` (icon steps in any order, current = tomato, done = teal tick badge), `Toast` (non-blocking, auto-dismiss), `HintHalo` (pulsing marigold ring; off under calm motion).
- [x] `Icon` React component rendering paths from `icons.ts` (32×32 viewBox, round caps, stroke 2.6, `currentColor`), plus a Pixi helper that builds a `Graphics` from the same path data.
- [x] Voice-over service: `speak(text)`; long-press (touch, 450 ms) and hover (desktop, 600 ms) on any control with a `label` speaks it; respects the voice-over setting.
- [x] Optional text labels: shown when the profile's age ≥ 9 or the setting is on.
- [x] Settings store (persisted): music, effects and voice volumes; voice-over; text labels; left-handed (mirrors left/right docks); calm motion; bot energy (lively, calm, paused).
- [x] App shell: the stage container plus edge docks as in `DESIGN.md` → "Layout". Breakpoints: phone portrait (< 600 px wide), tablet/phone landscape, desktop (≥ 1024 px and a fine pointer). Phone portrait folds docks into a "+" sheet.
- [x] Screen state machine in `src/app/` (no URL router; GitHub Pages and SPAs do not mix well): `splash → age → profile → avatarWizard | houseWizard | hub → map → scene`, plus `gate`, `grownUp`, `settings`, `characters`, `photo`. Back/home always available.
- [x] Keyboard shortcuts on desktop (see `DESIGN.md`), with a "?" overlay listing them.
- [x] Storybook is not needed: add a hidden `#kit` screen (reachable from the grown-up area) that shows every component, for visual checks.

Acceptance: every component reachable by keyboard and screen reader; contrast checks pass; calm motion stops all looping animation; e2e test clicks through the empty screens at three viewport sizes.

---

## M2: the stage, peg-folk and rooms

Goal: a living room on screen with characters drawn in code.

- [ ] Pixi `Application` attached under the React shell, resized to the stage container, `resolution: devicePixelRatio` capped at 2, `autoDensity: true`, WebGL preference with WebGPU allowed when available.
- [ ] Logical stage coordinates: each room is 900 × 560 logical units (see `design-reference/Room.dc.html`), scaled to fit with letterboxing in the apricot ground colour.
- [ ] `PegView` (see `DESIGN.md` → "Peg-folk"): body, band, head, hair styles (bob, puff, bun, crop, none), eyes (open, sleep, wow), cheeks, mouth, helpers (wheelchair, hearing aid, prosthetic arm). Built from `Graphics`; cache to textures per appearance for performance.
- [ ] Motion: idle breathing bob, walk hop with squash and stretch, turn by flipping x, happy jump, sleep sway. All through one small tween/easing utility on the Pixi ticker. Calm motion reduces amplitude and removes hops.
- [ ] `RoomView`: wall, floor band, skirting, door(s), window, and furniture drawn from `content/furniture.ts` definitions (flat shapes with inset shading, 6 px aubergine outlines on key pieces).
- [ ] Depth sorting by y within the floor band.
- [ ] Intent bubble above each character: white circle with a 3 px drop shadow, icon from `icons.ts`, optional progress ring (see `SIM.md` → "Legibility").
- [ ] Performance budget: 60 fps on an iPad 9th generation with 8 characters and 30 furniture pieces; hold at least 50 fps with 3 rooms simulated off-screen.

Acceptance: a static room with five characters idling and one walking back and forth; e2e screenshot comparison at three viewports.

---

## M3: the bot simulation

Goal: characters that live their own day, legibly. Implement `SIM.md` fully.

- [ ] `src/sim/` with no DOM or Pixi imports: `World`, `Bot`, `Needs`, `Traits`, `Activity`, `Advertisement`, `Planner` (utility AI), `Clock`, `Rng` (seeded, e.g. mulberry32), `Commands`.
- [ ] Fixed-step simulation at 10 ticks per real second, decoupled from rendering; render interpolates positions.
- [ ] Clock and time control: pause, play, fast (×4). Day/night: one game day = 12 real minutes at normal speed; sky and window colours follow time of day.
- [ ] Movement within a room on a 1D floor line with a small depth offset; between rooms through doors; between buildings via the map (bot leaves through the front door, appears as a map pin, enters the destination).
- [ ] Each bot always exposes `now` (activity, progress 0–1) and `next` (planned activity) for the UI.
- [ ] Socialising: two bots with the "chat" activity face each other and alternate emote bubbles.
- [ ] Visits: a bot can visit another house; doorbell sound, bell bubble, visitor flag on the roof.
- [ ] Bot energy setting: lively (default rates), calm (half rates, longer activities), paused (autonomy off; bots idle in place).
- [ ] Unit tests with a fixed seed: needs decay; trait multipliers change choices; a hungry bot walks to food; nudges override the next choice; frozen bots do not move; bots never modify child-placed objects (property test over 10,000 ticks).

Acceptance: leave the starter house running for 10 minutes; every bot shows a sensible routine (eat, nap, play, chat, visit), nobody gets stuck, the `now`/`next` icons always match what the bot is visibly doing.

---

## M4: playing with bots: drawer, card, undo and saving

Goal: the core loop. This is the vertical slice to test with children.

- [ ] Pick-and-place controller (`src/input/`): pointer drag with a ghost preview, and tap-to-pick → tap-to-place. While carrying, valid targets glow teal; invalid ones show a red cross badge (never colour alone). Keyboard: arrows move a focus ring between targets, Enter places, Escape drops.
- [ ] Object drawer (D4): category tabs (food, toys, music, books, plants), paged carousel; on phone portrait it lives in the "+" sheet.
- [ ] Give an object to a bot: drop on the bot → it reacts (eats, plays, reads) immediately, satisfying the matching need, with hearts rising.
- [ ] Place an object in the room: snaps to the floor line; becomes an advertisement for bots (food on a plate is never used up; see `SIM.md`).
- [ ] Bot detail card (D3): portrait, mood face, 3 trait badges, NOW icon with progress ring → NEXT icon, and actions Follow, Call here, Nudge (6 ideas: eat, nap, play ball, read, chat, tidy), Take control, Freeze, Send home. Tablet: right-side panel; phone: bottom sheet; desktop: panel, opened with Enter on the focused bot.
- [ ] Characters dock (left): portraits of bots in the current room; tap to select, long-press to open the card.
- [ ] Follow-cam (D5): camera follows the bot across rooms and map; breadcrumb of places; stop button.
- [ ] Take control: the bot follows taps/drags; autonomy paused until released or the card is closed.
- [ ] Undo/redo (command pattern) covering everything the child does: placing, moving and removing objects; nudges; calls; giving objects; freeze/unfreeze. At least 50 steps. Bots' autonomous actions are not on the undo stack.
- [ ] Autosave: debounced 1 s after any change, on `visibilitychange` and `pagehide`; versioned schema; corrupted saves fall back to the last good copy (keep two slots).
- [ ] Photo (D7): snapshot of the stage (`renderer.extract`) saved to IndexedDB; a small on-device album. No sharing.
- [ ] Sound: ZzFX effects for tap, pick, place, invalid, eat, sleep, doorbell, happy; "Pocketese" voice (see `DESIGN.md` → "Sound").

Acceptance: e2e: open the drawer, give cake to a bot (by drag and by tap-tap), undo it, redo it, reload the page and find the same state. Manual: a 6-year-old completes this without help.

---

## M5: first-time onboarding

Goal: from opening the link to playing in under 60 seconds. Match `design-reference/Proto-Onboarding.dc.html` (behaviour notes are in its script block).

- [ ] Splash (A1): animated town build-up while assets load; continues by itself when ready, or on tap.
- [ ] Neutral age screen (A2): 4 … 15+ tiles, nothing preselected, question spoken aloud. Age stored on the profile only (on device). Age ≥ 9 turns text labels on.
- [x] Parental gate (A3): a random two-digit number written in words ("type forty-seven"); keypad; wrong answer clears gently. Reused for every grown-up entry. (Built early in M1 so the grown-up area and kit were never reachable without it.)
- [ ] Profile select (B1): faces only, "new player" tile, up to 6 profiles per device.
- [ ] Dice avatar: one big dice that rerolls appearance and name; pencil opens the full avatar wizard (M6); tick continues.
- [ ] Celebration, then land in the furnished starter house with bots already doing things.
- [ ] First-play hint chain with halos and spoken hints: "+" → pick cake → give to a bot → map glows. Hints stop after completion and never return for that profile.

Acceptance: e2e completes onboarding in under 15 taps; on an iPad, time from first load to first bot fed is under 60 s for an adult acting like a child.

---

## M6: avatar wizard and house wizard

Goal: full creation tools. Match `design-reference/Avatar-*.dc.html` and `design-reference/Proto-House.dc.html` (the house prototype is fully interactive; copy its behaviour, not its markup).

Avatar wizard (C1):
- [ ] Large live preview on a turntable (drag to spin), icon step rail in any order, option dock as paged carousel, dice/undo/redo/done always visible.
- [ ] Steps: start (blank / dice / copy existing), body (shape, wheelchair, prosthetic arm, hearing aid), face, hair, clothes, accessories, colours, personality (pick 3 of 10 trait cards), name (dice or curated list; typed name only for age ≥ 9, never leaves the device), celebration.

House wizard (C2):
- [ ] Steps: plot on neighbourhood map → shape (cottage, tall, round) → "ready to play" (furnished, skips to move-in) or "ready to decorate" (empty) → rooms (pick a room type, tap spaces) → walls and floors (per room or whole house) → furniture (12-cell snap grid per room, ghost preview, teal/red validity, turn, copy, hold-to-delete, bot-test toggle) → move in (tap a resident, then the front door) → housewarming (neighbours arrive and react).
- [ ] Every step: dice, undo/redo, any order via the step rail; all edits on the global undo stack.

Acceptance: e2e builds a house from scratch with each step, undoes three changes, completes housewarming; the new house appears on the map and in the hub.

---

## M7: hub, map, gallery and coming back

- [ ] Home hub (B2): the child's house as a live diorama with bots visible, and 4 big tiles: World, My characters, My house, Friends (Friends is shown locked with "ask a grown-up" and explains it is coming later).
- [ ] My characters gallery (B3): paged cards, new, dice, hold for edit / copy / move house / remove (remove is hold-to-confirm and undoable).
- [ ] World map (D1): my house, a neighbour house, café, park, library, music hall; bot portrait pins; tap a building to enter; time-of-day dial.
- [ ] "While you were away" postcard: on return after more than 10 minutes, simulate the elapsed time in coarse steps (capped at 2 game days), then show 3–4 picture moments (who ate, slept, visited, played music) for 5–10 s; tap anywhere skips.

Acceptance: e2e: close and reopen with the clock advanced; postcard shows and can be skipped; state is consistent.

---

## M8: grown-up area, polish and family testing

- [ ] Local grown-up area behind the gate: play-time wind-down (5 minutes before the chosen limit, bots yawn and head home; no hard lock for now), reset profile (hold to confirm), export and import the save as a file, about and privacy text ("nothing leaves this device").
- [ ] Offline overlay (A5) is not needed, since nothing needs the network; show nothing when offline.
- [ ] States from the design: empty (bots wander in), loading (builders stacking blocks, no spinner), error (a peg fixing things, automatic retry; play continues).
- [ ] Accessibility audit: axe-core in Playwright on every screen; manual VoiceOver pass on iPad.
- [ ] Performance pass on a low-end Android tablet; reduce texture sizes and particle counts as needed.
- [ ] Bundle budget: initial JS under 450 KB gzipped; first interactive under 3 s on a mid-range tablet over 4G.

Acceptance: a week of family testing with no lost saves and no crashes reported.
