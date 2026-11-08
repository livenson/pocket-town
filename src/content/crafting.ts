// Making things at the workbench (owner's request: "take tools and use them on
// something to craft things"). Pure data and pure matching, so the sim and the UI
// agree on what a bench full of things makes.

/** Tools are never used up: they stay on the bench, ready for the next go. */
export const craftTools = ['hammer', 'wrench', 'screwdriver', 'ruler'] as const;
/** Materials are used up when something is made. */
export const craftMaterials = ['planks', 'wheel', 'nutAndBolt', 'gear', 'magnet'] as const;

export type CraftTool = (typeof craftTools)[number];
export type CraftMaterial = (typeof craftMaterials)[number];

export interface Recipe {
  /** The thing it makes (an object kind). */
  makes: string;
  tool: CraftTool;
  materials: CraftMaterial[];
}

/**
 * What the bench makes. No recipe holds all of another's pieces, so each one can be
 * reached; when two could be made at once, the first in this list wins.
 */
export const recipes: Recipe[] = [
  { makes: 'birdhouse', tool: 'hammer', materials: ['planks'] },
  { makes: 'toyCar', tool: 'wrench', materials: ['wheel'] },
  { makes: 'robot', tool: 'screwdriver', materials: ['magnet', 'nutAndBolt'] },
  { makes: 'woodChair', tool: 'screwdriver', materials: ['planks'] },
  { makes: 'clock', tool: 'wrench', materials: ['gear'] },
  { makes: 'boat', tool: 'ruler', materials: ['planks'] },
];

/** Things that only come from the workbench (not in the drawer). */
export const madeAtBench = ['birdhouse', 'woodChair', 'clock'] as const;
export const isMadeAtBench = (kind: string): boolean =>
  (madeAtBench as readonly string[]).includes(kind);

export const isCraftTool = (kind: string): boolean =>
  (craftTools as readonly string[]).includes(kind);
export const isCraftMaterial = (kind: string): boolean =>
  (craftMaterials as readonly string[]).includes(kind);
const isCraftPiece = (kind: string) => isCraftTool(kind) || isCraftMaterial(kind);

function counts(kinds: readonly string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const k of kinds) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
}

function missingFor(recipe: Recipe, have: Map<string, number>): string[] {
  const need = counts([recipe.tool, ...recipe.materials]);
  const missing: string[] = [];
  for (const [kind, n] of need) {
    for (let i = have.get(kind) ?? 0; i < n; i++) missing.push(kind);
  }
  return missing;
}

/** The recipe these things on the bench make now, if any. */
export function recipeFor(kinds: readonly string[]): Recipe | null {
  const have = counts(kinds);
  return recipes.find((r) => missingFor(r, have).length === 0) ?? null;
}

/**
 * A gentle nudge for a bench that makes nothing yet: the pieces still missing for
 * the recipe it is closest to (shown as faded pictures). Empty when there is
 * nothing to work with, or when something can be made already.
 */
export function benchHint(kinds: readonly string[]): { makes: string; missing: string[] } | null {
  const have = counts(kinds.filter(isCraftPiece));
  if (have.size === 0 || recipeFor(kinds)) return null;
  let best: { makes: string; missing: string[]; matched: number } | null = null;
  for (const r of recipes) {
    const missing = missingFor(r, have);
    const matched = 1 + r.materials.length - missing.length;
    if (matched === 0) continue;
    if (
      !best ||
      matched > best.matched ||
      (matched === best.matched && missing.length < best.missing.length)
    )
      best = { makes: r.makes, missing, matched };
  }
  return best && { makes: best.makes, missing: best.missing };
}
