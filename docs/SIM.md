# Bot simulation

Bots are the peg-folk who live in Pocket Town. They choose their own activities, but what they are doing and what they will do next must always be readable from pictures alone, and the child can always take over. The numbers below are starting values: put them in `src/content/tuning.ts` so they can be tuned without touching logic.

## Model

```ts
type NeedKey = 'hunger' | 'energy' | 'fun' | 'social';
// 0 = urgent, 100 = fully satisfied

interface Bot {
  id: string;
  appearance: Appearance;        // see DESIGN.md → Peg-folk
  name: string;
  traits: [TraitId, TraitId, TraitId];
  homeHouseId: string;
  needs: Record<NeedKey, number>;
  location: { buildingId: string; roomId: string; x: number; depth: number };
  mode: 'auto' | 'puppet' | 'frozen';
  now: { activity: ActivityId; targetId?: string; progress: number } | null;
  next: { activity: ActivityId; targetId?: string } | null;
  nudge: ActivityId | null;      // set by the child; consumed by the planner
  wish: ObjectKindId | null;     // shown in a thought bubble when a need can't be met
}
```

## Needs

| Need | Decay per game hour | Satisfied by |
|---|---|---|
| hunger | 6 | eating (kitchen table, plate, café counter, food given by the child) |
| energy | 4 (awake), recovers 12 while sleeping | bed, sofa nap |
| fun | 5 | ball, music box, books, park swings, music hall |
| social | 3 | chatting with another bot, visiting a house |

A bot's mood face (happy, OK, sleepy, hungry) comes from its lowest need.

## Traits

Ten traits; each bot has three. Each trait applies multipliers.

| Trait | Icon | Effect |
|---|---|---|
| Snacky | fork | hunger decay ×1.4; eating scores ×1.3 |
| Sleepy | zzz | energy decay ×1.3; naps more often |
| Chatty | talk | social decay ×1.5; chat scores ×1.4 |
| Musical | note | music activities ×1.6 |
| Explorer | map | going to other buildings ×1.5 |
| Tidy | sparkle | "tidy" activity unlocked (straightens its own items only, never the child's) |
| Brave | star | tries new places and objects first |
| Gardener | plant | plants and park ×1.5 |
| Sporty | ball | ball and park ×1.5; energy decay ×1.1 |
| Shy | eye | social decay ×0.6; prefers small groups; waves instead of chatting with strangers |

## Choosing what to do (utility AI)

Every object and place **advertises** activities with the need gains they give:

```ts
interface Advertisement {
  objectId: string;
  activity: ActivityId;          // eat, nap, sleep, play, music, read, chat, visit, garden, tidy, wander,
                                 // checkup, tinker, shop, planes (the town's public places)
  gains: Partial<Record<NeedKey, number>>;
  duration: number;              // game minutes
  capacity: number;              // how many bots can use it at once
}
```

When a bot finishes an activity (or has none), the planner scores every reachable advertisement:

```
score = Σ over needs of  gain[need] × urgency(need)
        × traitMultiplier(activity)
        × distancePenalty           // 1.0 same room, 0.8 same building, 0.5 other building
        × noveltyBonus              // 1.15 if not done in the last 2 game hours
        × (0.9 + 0.2 × rng())       // small randomness so bots differ

urgency(v) = ((100 − v) / 100) ^ 2  // grows sharply as a need runs low
```

The bot takes the best option as `now` and stores the second best as `next` (recomputed when `now` ends). If the best score is under a threshold (0.05), the bot "wanders" (short walk, look around) to avoid looking frozen.

If a need is below 20 and nothing reachable satisfies it, the bot sets `wish` to the object kind it would need (for example "cake") and shows it in a thought cloud. Satisfying a wish (the child gives that thing) gives a big happy reaction.

## Activities in progress

- Walk to the target, then perform for `duration`; `progress` goes 0 → 1 and drives the ring around the intent icon.
- Needs change gradually during the activity, not all at once at the end.
- Interruptions: only the child can interrupt (nudge, call, control, freeze, give). Another bot never interrupts.

## The child's influence ladder

From gentle to strong. All of these are child commands and go on the undo stack.

1. **Give an object.** Drop it on the bot. The bot immediately does the matching activity with that object (eats the cake, kicks the ball) for a short duration, and reacts happily. Given food is consumed; the drawer has infinite supply.
2. **Nudge.** Pick one of six ideas (eat, nap, play ball, read, chat, tidy). The current activity finishes quickly (progress jumps to at least 0.8), then the nudge becomes `now`. If nothing reachable offers it, the bot shows a wish cloud.
3. **Call here.** The bot walks to the tapped spot (or into the current room) and waits there for 30 game minutes before resuming.
4. **Take control (puppet).** `mode = 'puppet'`. Autonomy stops; the bot walks where the child taps or drags it; giving objects still works. Released when the child closes the card or taps "let go".
5. **Freeze.** `mode = 'frozen'`. The bot stops in place with a snowflake badge, needs stop changing. Unfreeze restores the previous mode.
6. **Send home.** The bot walks home and does a home activity next.
7. **Day plan (age 9+, M7 or later).** The child drags activity icons into 4 time slots (morning, afternoon, evening, night). In each slot the planner only considers activities from the plan, in order.

## Rules that protect the child's story

These must be enforced in code and covered by tests.

- Bots never move, remove, consume or rotate objects the child placed. Placed food is a plate that never empties.
- Bots never change room types, colours or furniture.
- Bots never move other bots, and never enter a house the child has marked as "closed" (future setting).
- Puppeted and frozen bots stay exactly where the child left them until released, including across save/reload.
- Visitors always leave on their own within 2 game hours; the host house is unchanged after a visit.
- A "tidy" bot only straightens objects that a bot dropped (for example a ball it played with), never the child's.
- A bot tinkering at a workbench sometimes (about one time in five, at most one at a time per room) leaves a little thing it made on the floor beside it (`madeBy: 'bot'`: only to look at, it offers no activity, and tidy bots put it away later). It never touches what stands on the bench: the child's tools and materials, and anything made from them. The chance comes from a hash of the bot and the minute, not the world's random numbers, so it does not shift any other choice.

## Legibility

- **Intent bubble** above each bot: the `now` activity icon, with a progress ring.
- **Thought cloud** (picture only) for a `wish`.
- **Bot card** shows `now` → `next` and the three trait badges.
- **Chatting:** bots turn to face each other and alternate emote bubbles (talk, heart, laugh, note) every 2–3 s, with Pocketese voice blips.
- **Visiting:** doorbell sound, bell bubble at the door, visitor flag on the roof; the house's map pin shows the guest's face.
- **Event ticker (age 9+ or setting):** a top-centre pill showing the last two events as `face → icon` pairs.
- Sounds always accompany state changes: a soft chime when a new activity starts, a happy jingle on need satisfied.

## Time

- 10 simulation ticks per real second; 1 game day = 12 real minutes at normal speed (1 game minute = 0.5 s).
- Fast-forward ×4. Pause stops the clock, but the child can still move things, open cards and give objects (the bot reacts once time resumes).
- Night (22:00–07:00 game time): bots prefer sleep; rooms dim; windows glow.
- Returning after being away: simulate the elapsed real time in coarse steps (1 game hour per step, capped at 2 game days), then show the postcard of 3–4 memorable moments (first time a need was satisfied by a visit, music, a wish, etc.).

## Determinism and tests

- All randomness goes through the seeded RNG stored in the save, so runs are reproducible.
- Unit tests run the world headless for many ticks with fixed seeds and assert behaviour (see `PLAN.md` M3).
