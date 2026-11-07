# Product brief

## What it is

Pocket Town is an original, open-ended life-simulation and digital-dollhouse game for children aged about 6–12. Children make characters ("peg-folk") and houses, then watch and steer a small town where characters live their own routines. There is no score, no goal and no way to lose.

Two layers serve two age groups:

- **6–8 (pre-readers):** a zero-reading core of icons, motion and voice-over.
- **9–12:** optional text labels, an icon event ticker, typed names (stored on device only) and a drag-icon daily plan for bots.

## Platform for now

Web only: tablet and phone browsers (touch, portrait and landscape) and desktop browsers (mouse and keyboard). Deployed as a static site to GitHub Pages and installable as a PWA. Native app wrappers are out of scope for now.

## Core principles

1. **Play within 60 seconds.** Setup is optional and skippable. A "surprise me" dice is on every creation step.
2. **Icon-first, audio-first, animation-rich.** Every tap gives instant sound and motion.
3. **Everything is draggable onto everything**, and every drag has a tap-to-pick / tap-to-place alternative.
4. **Big targets.** Primary touch targets about 2 × 2 cm; nothing interactive below 44 × 44 pt. Paged carousels instead of scrolling lists.
5. **Forgiving.** Global undo/redo, autosave, press-and-hold for destructive actions, no error states that blame the child.
6. **Legible bots.** Bots run autonomous routines whose intent is always visible. The child can watch, follow, nudge, puppet or freeze them. Bots never undo the child's story.
7. **Safe by default.** Social features are not part of this web-only phase at all. Anything for grown-ups sits behind a parental gate.
8. **One layout system.** A central stage plus edge docks: characters on the left, objects at the bottom, home top-left, map and edit ("pencil") top-right, time control and camera bottom-right. Phone portrait folds the character and object docks into a "+" bottom sheet; desktop adds hover labels and keyboard shortcuts.

## Scope of this phase

In scope (see `PLAN.md` for order):

- First-time onboarding: splash, neutral age screen, parental gate, profile select, dice avatar, celebration, first play with hint halos.
- Profiles (faces, no passwords), stored on the device.
- Avatar wizard: start (blank / dice / copy), body (including wheelchair, prosthetic arm, hearing aid; no gender step), face, hair, clothes, accessories, colours, personality (pick 3 traits that drive behaviour), name (dice or curated list; typed only for 9–12).
- House wizard: plot, shape, "ready to play" vs "ready to decorate", rooms, walls and floors, furniture (snap grid, ghost preview, valid/invalid, turn, copy, hold-to-delete, bot test), move in, housewarming.
- Home hub, my-characters gallery.
- Scene view (the core play stage) with object drawer, bot detail card, follow-cam, time control, photo (saved on device).
- World map with a few buildings (my house, café, park, library, music hall) and bot travel between them.
- "While you were away" postcard on return (5–10 s, skippable).
- Child settings: volumes, voice-over, text labels, left-handed, calm motion, bot energy (lively / calm / paused).
- A small local grown-up area behind the gate: reset, export/import save file, play-time wind-down setting.

Out of scope for this phase:

- Accounts, servers, friends, shared worlds, phrase/emote wheels, invites, reporting. (Designed, but they need a backend and a consent process.)
- Purchases, ads, analytics of any kind.
- Native iOS/Android packaging.

## Success for this phase

- A child aged 6 can go from opening the link to giving food to a bot without help, in under a minute, on an iPad.
- Children choose to keep playing for 10+ minutes in observed sessions, mostly watching and steering bots.
- No crashes or lost saves across a week of family testing.
