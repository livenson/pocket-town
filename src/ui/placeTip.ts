// Where a desktop hover label goes next to its button (HoverTips.tsx). Pure.

/** Space between the button and its label, and kept from the screen's edges. */
const GAP = 10;
const EDGE = 8;

export interface Size {
  w: number;
  h: number;
}

/**
 * Where a label of size `tip` goes next to `anchor` in a viewport of size `view`:
 * under the button, or above when there is no room; beside it in a tall dock;
 * always fully on screen.
 */
export function placeTip(
  anchor: { left: number; top: number; right: number; bottom: number },
  tip: Size,
  view: Size,
  beside: boolean,
): { x: number; y: number } {
  const cx = (anchor.left + anchor.right) / 2;
  const cy = (anchor.top + anchor.bottom) / 2;
  const clampX = (x: number) => Math.min(Math.max(x, EDGE), view.w - tip.w - EDGE);
  const clampY = (y: number) => Math.min(Math.max(y, EDGE), view.h - tip.h - EDGE);
  if (beside) {
    const right = anchor.right + GAP;
    const left = anchor.left - GAP - tip.w;
    const x = right + tip.w <= view.w - EDGE || left < EDGE ? right : left;
    return { x: clampX(x), y: clampY(cy - tip.h / 2) };
  }
  const below = anchor.bottom + GAP;
  const above = anchor.top - GAP - tip.h;
  const y = below + tip.h <= view.h - EDGE || above < EDGE ? below : above;
  return { x: clampX(cx - tip.w / 2), y: clampY(y) };
}
