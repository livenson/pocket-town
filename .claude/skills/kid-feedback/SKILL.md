---
name: kid-feedback
description: Run the kid play-testing loop for Pocket Town. A child plays the dev server and taps the feedback tab to point at something, pick a face and say or write what they think. Claude evaluates each piece, changes the game, and asks the child to keep it; Claude commits only what the child keeps. Use when asked to "listen to the kid", "run play-testing", "handle kid feedback" or /kid-feedback.
---

# Kid feedback loop

A child is playing the game on the dev server in feedback mode. They tap the dashed tab on the right edge, point at something, pick a face (love / OK / don't like / idea), and talk or write. You read it, decide, change the game, and send back a short spoken message. The child hears it and taps **keep** (heart), **put it back** (undo) or **change it more**. You commit only what they keep.

Everything goes through `node scripts/feedback/cli.ts` (alias: `npm run feedback:inbox --`). The inbox is `feedback/` at the repo root. It is git-ignored and holds the child's voice and screenshots, so never commit it, upload it, or paste it anywhere outside this machine.

## Start

1. Check that the feedback dev server is running: `curl -s localhost:5180/__feedback/items` (or `https://...` for the LAN mode). If it isn't, start `npm run feedback` with `run_in_background`. Tell the grown-up the URL: http://localhost:5180/pocket-town/. If the child plays on a tablet, use `npm run feedback:lan` and give the https address it prints; the grown-up accepts the self-signed certificate once.
2. Run `node scripts/feedback/cli.ts status`. If the working tree is not clean, ask the grown-up whether to commit or stash first. A clean tree is what makes "put it back" safe.
3. Start listening: run `node scripts/feedback/cli.ts wait` with `run_in_background: true`. It exits and prints JSON when something needs you, or `{"idle": true}` after about 50 minutes. Handle what it printed, then start `wait` again. Keep looping until the grown-up says stop.

## Each item

`wait` prints the item with a `next` hint and absolute paths for each round: `screenshot` (open it with Read), `voice`, `world` (the town as JSON) and `transcript`, if whisper.cpp is installed. `point` is where the child tapped, including the accessible name of what was under their finger. `trail` lists the last things they tapped.

### status `new`: evaluate

Look at the screenshot, the point, the mood and the words. Work out what the child means. They are 6 to 12, so read generously: "the cake is weird" next to a pointed-at cake is a real request.

If there is a voice note but no transcript, you cannot hear it. Say so in the terminal and ask the grown-up what the child said. Meanwhile, don't guess beyond what the face, the point and any writing show.

Then decide:

- **Do it** when it is clear, small (a few files, roughly under 30 minutes), and fits `docs/BRIEF.md` and the hard rules in `CLAUDE.md`. Most look-and-feel wishes qualify: bigger, brighter, a new colour, a sound, a funnier animation, a new food or piece of furniture, a name, something confusing made clearer.
- **Ask the grown-up in the terminal** when it is a big feature, changes how the game works for everyone, or you are unsure. Run `take` only once they agree.
- **Decline kindly** when it conflicts with the hard rules or the brief. Examples: ads, shops or buying, chatting with strangers, anything leaving the device, scary or violent content, streaks and rewards for coming back, timers that pressure, bots undoing what the child made, removing undo, or copying another game's characters or look ("make it like ..."). Offer an original version when one exists: a new hat rather than a famous character's hat. Do the same for things you cannot do well.

To do it:

1. `node scripts/feedback/cli.ts take <id>`. This marks the item as thinking, so the child sees a sparkle. It refuses on a dirty tree.
2. Make the smallest change that does what the child asked. Follow `CLAUDE.md`. Every new visible or spoken word goes into all three dictionaries in `src/i18n/`. Keep touch targets, the zero-reading core, calm motion and contrast intact.
3. Check it: `npx tsc -b`, `npm run lint`, `npx vitest run`. Look at it in a browser against the dev server (`http://localhost:5180/pocket-town/`, which hot-reloads; the child's page reloads by itself and comes back to the same player and screen).
4. `node scripts/feedback/cli.ts reply <id> --say "..." --screen scene --room home-living`. `--screen` can be `scene`, `hub`, `map` or `characters`; it and `--room` tell the "show me" button where to take the child.

To decline: `node scripts/feedback/cli.ts decline <id> --say "..."`. Make no code changes.

### Writing `--say`

The child hears it through text-to-speech, and may not read yet.

- Use the item's `language` (`en`, `et` or `lv`).
- One or two short sentences, at most about 25 words. Plain words, no symbols, emoji or code words.
- Say what changed in their terms, then ask: "I made the cake twice as big. Do you like it?"
- When declining: warm, no blame, no rules jargon, and offer something if you can. "Shops are not part of Pocket Town, but I can make a market stall where everything is free. Shall I?"

### status `again`: the child wants it different

Read the newest round, which has its own screenshot, point, mood and words. Keep working on the same uncommitted change; don't revert first. Check it again, then `reply` again.

### status `kept`: commit

Run lint, tests and `npx tsc -b` once more, then `node scripts/feedback/cli.ts commit <id> -m "<what changed, in the repo's commit style>"`. That commits the whole working tree, which holds only this change because `take` required a clean tree. Do not push. Pushing deploys to everyone, and `CLAUDE.md` requires a production-build check in the browser first. Tell the grown-up what is waiting to be pushed.

### status `undone`: put it back

`node scripts/feedback/cli.ts revert <id>`. This stashes the change as `kid-feedback <id>`, so nothing is lost; `git stash list` shows it. The page reloads to the old version.

## Notes

- One change at a time: `wait` holds back new items while one is thinking, proposed or again. Verdicts come first.
- Voice to text happens only on this computer, with whisper.cpp when it is installed (`brew install whisper-cpp`, plus a model such as `ggml-small.bin` in `~/.cache/whisper/`; set `WHISPER_MODEL` to use another path). Without it, voices are kept but not transcribed. Never send recordings to an online service.
- The tool exists only in `vite --mode feedback*`: `src/dev/feedback/` (the child's side), `scripts/feedback/` (the server plugin and this CLI). None of it is in a build.
