# Handing Pocket Town to Claude Code

This pack is meant to be the first commit of `https://github.com/livenson/pocket-town`.

## What's in it

| Path | What it is |
|---|---|
| `CLAUDE.md` | Project rules Claude Code reads automatically: stack, hard rules, layout, commands. |
| `docs/BRIEF.md` | Product brief and scope for the web-only phase. |
| `docs/PLAN.md` | Milestones M0–M8 with tasks and acceptance criteria. |
| `docs/SIM.md` | Bot simulation spec (needs, traits, utility AI, influence ladder, protections). |
| `docs/DESIGN.md` | Visual identity, layout, controls, motion, sound, screen index. |
| `docs/DECISIONS.md` | Why this stack, with sources. |
| `src/design/tokens.ts` | Colours, sizes, motion timings, breakpoints. |
| `src/design/icons.ts` | The full custom icon set as SVG path data. |
| `.github/workflows/deploy.yml` | CI (lint, tests, build, e2e) and GitHub Pages deploy. |
| `design-reference/` | Design canvas artboards and the two interactive prototypes, as reference. |

## Steps

1. **Create the repo** (if it doesn't exist yet). It must be public for GitHub Pages on a free plan.
   ```
   gh repo create livenson/pocket-town --public --clone
   ```
2. **Copy this pack** into the repo folder (keep the folder structure), then commit:
   ```
   git add -A && git commit -m "Add design handoff pack" && git push -u origin main
   ```
3. **Turn on Pages from Actions:** GitHub → the repo → Settings → Pages → Build and deployment → Source: **GitHub Actions**. (Claude Code can also do this with `gh api` in milestone 0.)
4. **Start Claude Code** in the repo folder and give it the first prompt below.
5. After each milestone, open `https://livenson.github.io/pocket-town/` on an iPad and a phone, play with it, and give feedback before saying "continue".

## First prompt for Claude Code

```
Read CLAUDE.md, then docs/BRIEF.md, docs/PLAN.md, docs/DESIGN.md and docs/SIM.md.
Then do milestone M0 from docs/PLAN.md. Keep the files in src/design/ as they are.
When M0's acceptance criteria pass and the site is live on GitHub Pages,
stop and give me a short summary plus anything I need to do by hand.
```

## Prompts for later milestones

```
Continue with milestone M<n> from docs/PLAN.md. Use design-reference/ for the look and behaviour.
Stop when its acceptance criteria pass, the site is deployed, and docs/PLAN.md is updated.
```

For the vertical slice to test with children, M0–M4 are enough. M5 adds the proper first-time flow.

## Tips

- Ask Claude Code to show you the plan for a milestone before it starts if you want to steer the approach.
- If a milestone is too big for one session, ask it to split the milestone into commits and stop halfway.
- Feedback from testing with children is best given as "what the child tried to do" rather than "change X to Y"; add it to `docs/PLAYTEST.md` and point Claude Code at it.
