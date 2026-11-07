// The bridge between the Pixi stage and the DOM target layer laid over it.
// Every bot, placed thing, door and floor spot has a real <button> over the canvas
// (for taps, drops, keyboard focus and screen readers); the stage keeps each one
// positioned over what it stands for. No Pixi here.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Room units → stage-element pixels, and back. Set by the stage on every layout. */
export const view = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  /** The stage element on screen (for converting client coordinates). */
  host: null as HTMLElement | null,
};

export function roomToStage(r: Rect): Rect {
  return {
    x: view.offsetX + r.x * view.scale,
    y: view.offsetY + r.y * view.scale,
    w: r.w * view.scale,
    h: r.h * view.scale,
  };
}

/** Client (pointer) coordinates → room units, or null when off the stage. */
export function clientToRoom(clientX: number, clientY: number): { x: number; y: number } | null {
  const box = view.host?.getBoundingClientRect();
  if (!box) return null;
  return {
    x: (clientX - box.left - view.offsetX) / view.scale,
    y: (clientY - box.top - view.offsetY) / view.scale,
  };
}

const elements = new Map<string, HTMLElement>();
/** Rectangles in room units, refreshed by the stage every frame. */
const rects = new Map<string, Rect>();

export function registerTarget(key: string, el: HTMLElement | null): void {
  if (el) {
    elements.set(key, el);
    const r = rects.get(key);
    if (r) place(el, r);
  } else {
    elements.delete(key);
  }
}

function place(el: HTMLElement, r: Rect): void {
  const s = roomToStage(r);
  el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`;
  el.style.width = `${s.w.toFixed(1)}px`;
  el.style.height = `${s.h.toFixed(1)}px`;
}

/** Called by the stage: where a target is now (room units). */
export function setTargetRect(key: string, r: Rect): void {
  rects.set(key, r);
  const el = elements.get(key);
  if (el) place(el, r);
}

export function clearTargetRects(): void {
  rects.clear();
}

/** Re-place every target (after a layout change). */
export function relayoutTargets(): void {
  for (const [key, el] of elements) {
    const r = rects.get(key);
    if (r) place(el, r);
  }
}
