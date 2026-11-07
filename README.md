# Pocket Town

An original, open-ended life-simulation and digital dollhouse for children aged about 6–12.
Children make peg-folk characters and houses, then watch and steer a small town where the
characters live their own routines. No score, no goal, no way to lose.

**Play it:** https://livenson.github.io/pocket-town/

It speaks English, Estonian and Latvian (grown-ups choose in the grown-up area), and it runs in the browser on tablets, phones and desktops, installs as an app (PWA), and plays
fully offline. Nothing leaves the device: no accounts, analytics, ads or third-party requests.

## Development

Needs Node.js 24 or newer.

| Command           | What it does                                                                                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm install`     | Install dependencies.                                                                                                                                                                          |
| `npm run dev`     | Local dev server at http://localhost:5173/pocket-town/.                                                                                                                                        |
| `npm run build`   | Type-check, then build into `dist/`.                                                                                                                                                           |
| `npm run preview` | Serve `dist/` at http://localhost:4173/pocket-town/.                                                                                                                                           |
| `npm test`        | Unit tests (Vitest), in watch mode; add `-- --run` for a single run.                                                                                                                           |
| `npm run e2e`     | End-to-end tests (Playwright) against the production build at phone, tablet and desktop sizes. Run `npm run build` first; install browsers once with `npx playwright install chromium webkit`. |
| `npm run lint`    | oxlint (type-aware) and Prettier check. `npm run format` fixes formatting.                                                                                                                     |
| `npm run icons`   | Regenerate the app icons in `public/` from `src/design/icons.ts`.                                                                                                                              |

Pushing to `main` runs lint, tests, build and e2e in GitHub Actions, then deploys to GitHub Pages.

## Docs

- [`CLAUDE.md`](CLAUDE.md): stack and hard rules.
- [`docs/BRIEF.md`](docs/BRIEF.md): what the game is.
- [`docs/PLAN.md`](docs/PLAN.md): milestones and progress.
- [`docs/DESIGN.md`](docs/DESIGN.md): visual identity, layout, motion and sound.
- [`docs/SIM.md`](docs/SIM.md): how the bots think.
- [`docs/DECISIONS.md`](docs/DECISIONS.md): decisions and their reasons.
