#!/bin/sh
# Re-create the e2e screenshot baselines on Linux, the platform CI uses.
# Needs Docker. Uses a separate node_modules volume so Linux binaries never
# overwrite the host's.
set -eu
PW_VERSION=$(node -p "require('@playwright/test/package.json').version")
docker run --rm \
  -v "$PWD":/work \
  -v pocket-town-linux-node-modules:/work/node_modules \
  -w /work \
  -e CI=1 \
  "mcr.microsoft.com/playwright:v${PW_VERSION}-noble" \
  sh -c "npm ci --no-audit --no-fund && npm run build && npx playwright test --update-snapshots=all -g 'reference picture'"
