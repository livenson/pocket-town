# Decisions

One entry per decision: date, choice, reason. Newest at the bottom.

## 2026-11-07: rendering and UI stack

**Choice:** PixiJS v8 for the play stage, React 19 DOM for all menus and controls, plain TypeScript for the simulation.

**Why:**
- The game is heavy on interface (wizards, docks, sheets, cards, settings, a parental gate). Real DOM elements give screen-reader support, keyboard focus and voice-over hooks for free; canvas-drawn UI (Phaser, Godot) would need all of that rebuilt.
- PixiJS is a small, fast 2D renderer (about 0.2 MB empty build) with active releases (v8.19 in June 2026). It doesn't force a scene or physics model, which suits a 2D dollhouse with no physics.
- Keeping the sim free of rendering code makes it deterministic and unit-testable.

**Alternatives considered:**
- **Phaser 4** (stable since April 2026, rebuilt WebGL renderer): a full 2D framework with scenes, input, tweens and audio, and the largest community. A good choice for an action game; less so here because its UI is canvas-drawn.
- **Godot 4.x web export:** free and open source, but web builds are large (about 9 MB gzipped empty), C# can't export to the web, and Safari on iOS has known problems. iPad Safari is the main target.
- **Excalibur.js:** TypeScript-first with an ECS, but still pre-1.0 with a smaller ecosystem.
- **Defold:** smallest and fastest-loading builds, but Lua and a separate editor, and UI accessibility would again be custom.

**Revisit if:** characters need skeletal animation beyond what code-drawn pegs can do (consider Rive or Spine runtimes, both of which have web runtimes), or native app packaging becomes a goal (wrap the web build with Capacitor before considering an engine switch).

Sources: [Best web game engines for 2026 (cinevva)](https://app.cinevva.com/guides/web-game-engines-comparison), [Phaser v4.0.0 announcement](https://github.com/phaserjs/phaser/discussions/7274), [PixiJS June 2026 update](https://pixijs.com/blog/june-2026), [PixiJS React v8](https://pixijs.com/blog/pixi-react-v8-live), [Rive character animation](https://rive.app/use-cases/character-animation).

## 2026-11-07: no server, no network

**Choice:** a static site with all data on the device (IndexedDB). No accounts, analytics or third-party requests.

**Why:** children's data rules (GDPR Article 8; COPPA if the game later targets the US) apply as soon as data leaves the device. The social features are designed but deferred until there is a consent process and moderation plan.

## 2026-11-07: self-hosted fonts and procedural sound

**Choice:** fonts via @fontsource packages; sound effects generated with ZzFX; voice-over via the Web Speech API as a placeholder.

**Why:** no runtime calls to Google or CDNs, no audio licensing, tiny downloads. Recorded voice can replace the speech wrapper later.
