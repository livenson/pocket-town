import { describe, expect, it } from 'vitest';
import {
  furnitureKinds,
  mainColour,
  surfaceTop,
  type FurnitureKind,
  type FurnitureKindId,
} from '../../src/content/furniture';
import { color } from '../../src/design/tokens';

describe('furniture drawings', () => {
  const kinds: FurnitureKind[] = Object.values(furnitureKinds);
  const ids = Object.keys(furnitureKinds).filter((k): k is FurnitureKindId => k in furnitureKinds);

  it('every piece has an ink outline somewhere (the house style)', () => {
    for (const k of kinds) {
      const outlined =
        k.shapes.some((s) => s.stroke?.color === color.ink) ||
        // Organic pieces get their outline as an ink silhouette under the fills.
        k.shapes.some((s) => s.fill === color.ink && (s.alpha ?? 1) === 1);
      expect({ id: k.id, outlined }).toEqual({ id: k.id, outlined: true });
    }
  });

  it('every piece has a main colour the child can paint', () => {
    const unpaintable = kinds.filter((k) => mainColour(k) === undefined).map((k) => k.id);
    expect(unpaintable).toEqual([]);
  });

  it('surfaces stay inside the piece', () => {
    const outside = ids.filter((id) => {
      const top = surfaceTop[id];
      return top !== undefined && (top < 0 || top >= furnitureKinds[id].h);
    });
    expect(outside).toEqual([]);
  });
});
