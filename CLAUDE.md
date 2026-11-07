# Pocket Town: instructions for Claude Code

Pocket Town (working title) is an original, open-ended life-simulation / digital-dollhouse game for children aged about 6–12. It runs in the browser only for now and is deployed to GitHub Pages from `livenson/pocket-town`.

Read these before writing code, in this order:

1. `docs/BRIEF.md`: what the game is and the principles that are not negotiable.
2. `docs/PLAN.md`: milestones, tasks and acceptance criteria. Work through it in order.
3. `docs/DESIGN.md`: visual identity, layout system, components, motion and sound.
4. `docs/SIM.md`: how the bots (autonomous characters) think and how the child steers them.
5. `design-reference/`: interactive HTML prototypes and screen mockups. Read them as a spec for look and behaviour. Do not copy their markup into the app: they are written for a design tool's runtime (`support.js`, `<x-dc>`, `{{holes}}`) and will not run on their own.

## Stack (decided; do not swap without asking)

| Concern | Choice | Notes |
|---|---|---|
| Language | TypeScript 7 (native compiler), `strict: true` | No `any` except at untyped library edges. |
| Build | Vite | `base: '/pocket-town/'` for GitHub Pages. |
| Play stage | PixiJS v8 (latest 8.x), used imperatively | One `Application`, one canvas. Do not use `@pixi/react` for the stage: the sim updates every frame and must not go through React reconciliation. |
| UI shell (menus, wizards, docks, sheets, cards, settings) | React 19 rendering normal DOM | Real `<button>`, `<input>`, `<label>` for accessibility, voice-over and keyboard use. |
| UI state | Zustand | One store per concern (`settings`, `profiles`, `ui`); the sim world is not in Zustand. |
| Sim | Plain TypeScript modules in `src/sim/`, no Pixi or React imports | Deterministic with a seeded RNG, so it can be unit-tested headless. |
| Persistence | IndexedDB via `idb-keyval` | Versioned save schema with migrations. Call `navigator.storage.persist()` when available. |
| Sound effects | ZzFX (procedurally generated sounds; no audio files to license) | Unlock audio on the first user gesture (iOS requirement). |
| Voice-over placeholder | Web Speech API (`speechSynthesis`) | Behind an interface so recorded voice can replace it later. |
| Fonts | Self-hosted via `@fontsource/baloo-2` and `@fontsource/nunito` | Never load Google Fonts or any third-party URL at runtime. |
| Offline and install | `vite-plugin-pwa` | App shell and assets cached; plays fully offline. |
| Unit tests | Vitest | Sim, undo/redo, save/load and migrations. |
| End-to-end tests | Playwright | Phone, tablet and desktop viewports with touch emulation. |
| Lint/format | oxlint (type-aware, via `oxlint-tsgolint`) + Prettier | Replaced ESLint: typescript-eslint cannot run on TypeScript 7 (see `docs/DECISIONS.md`). |

Avoid adding further runtime dependencies without a clear reason; record any you add in `docs/DECISIONS.md` with one line of justification.

## Hard rules

These come from the brief and apply to every change.

- **Child safety and privacy.** The app makes no network requests except to load its own static files. No analytics, ads, trackers, external fonts, CDNs, embeds or outbound links. Anything that would leave the device, or any link, purchase or settings change for grown-ups, sits behind the parental gate.
- **Original work only.** Do not imitate Toca Boca or any existing game's art, characters, logos, palette or UI. Use the identity in `docs/DESIGN.md`.
- **Zero-reading core.** Every action works from icon, motion and sound alone. Text labels are an optional layer, on by default only for ages 9 and up.
- **Every drag has a tap alternative.** Tap to pick up (item rides on a marigold halo, valid targets glow), then tap to place. Both must work with mouse, touch and keyboard.
- **Touch targets.** At least 44×44 CSS px; primary actions at least 76×76 px on tablet.
- **Nothing blames the child.** No error dialogs. Undo/redo everywhere, autosave after every change, press-and-hold for anything destructive.
- **Bots never undo the child's story.** They never move, delete or rearrange what the child placed (see `docs/SIM.md`).
- **No manipulative design.** No streaks, timers that pressure, rewards for returning, "don't leave" messages or loot mechanics.
- **Accessibility.** WCAG AA text contrast; colour is never the only signal; `prefers-reduced-motion` and the in-game "calm motion" setting both reduce animation; keyboard shortcuts on desktop; every icon-only control has an `aria-label`.

## Repository layout (target)

```
src/
  main.tsx              entry: mounts React shell, creates Pixi app
  app/                  screen state machine, top-level layout, docks
  ui/                   React components (Button, IconButton, Sheet, Carousel, HoldButton, ...)
  design/               tokens.ts, icons.ts (provided), fonts.css
  stage/                Pixi scene graph: rooms, house diorama, map, peg characters, effects
  sim/                  world model, needs, activities, utility AI, time, RNG (no DOM/Pixi)
  input/                pick-and-place controller, drag, hold, keyboard shortcuts
  audio/                ZzFX sounds, Pocketese voice, speech wrapper
  persist/              save schema, migrations, idb-keyval adapter, autosave
  content/              data: rooms, furniture, foods, traits, names (pure data)
  i18n/                 strings.en.ts (reference), strings.et.ts, strings.lv.ts; all visible text lives here
tests/                  vitest unit tests mirroring src/
e2e/                    playwright specs
docs/                   brief, plan, design, sim spec, decisions
design-reference/       prototypes from the design canvas (read-only reference)
```

## Commands (create these in milestone 0)

- `npm run dev`: local dev server.
- `npm run build`: type-check, then production build into `dist/`.
- `npm run preview`: serve `dist/` at `/pocket-town/`.
- `npm test`: Vitest.
- `npm run e2e`: Playwright against `npm run preview`.
- `npm run lint`: oxlint + Prettier check.

## How to work

- Follow `docs/PLAN.md` milestone by milestone. Finish each milestone's acceptance criteria, run lint, tests and build, then commit before starting the next.
- Small commits with clear messages. Push to `main`; the GitHub Actions workflow deploys to Pages.
- Check changes in a real, visible local browser, not only in headless tests:
  - While working, use `npm run dev` (fast, hot reload).
  - Before every push, run `npm run build && npm run preview` and check that build in the browser at phone, tablet and desktop sizes: no console errors, no CSP violations, no third-party requests, and the changed interaction works. Use the build because the CSP, the service worker (offline, install) and the hashed asset paths exist only there, and it is what deploys.
  - Push only after that check passes.
- When the plan is ambiguous, choose the option that keeps the zero-reading core and the hard rules intact, note it in `docs/DECISIONS.md`, and carry on.
- Keep `docs/PLAN.md` checkboxes up to date as tasks are completed.
- Test on a real iPad and an Android tablet when possible (the owner will do this from the Pages URL). Design for Safari on iPadOS first; it is the strictest target.
- Never commit secrets. There are none needed: this is a static site.
- Every new visible or spoken word goes into all three dictionaries in `src/i18n/` (English, Estonian, Latvian); the `Strings` type fails the build when one is missing.
