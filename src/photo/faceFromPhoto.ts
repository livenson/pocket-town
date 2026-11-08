// Turn face landmarks (MediaPipe Face Landmarker's 478 points, in pixels) and the
// photo's colours into a suggested peg-folk face. Pure: no MediaPipe, no DOM, so
// it is unit-tested. The photo itself is never kept; only these few settings are.
import { clampFace, type FaceDetail, type FaceShape } from '../content/appearance';

export interface Pt {
  x: number;
  y: number;
}

/** Average colour around a point (radius in pixels), or null outside the picture. */
export type Sampler = (x: number, y: number, r: number) => [number, number, number] | null;

export interface PhotoLook {
  face: FaceDetail;
  skin?: string;
  hair?: string;
}

// Landmark indices (MediaPipe face mesh, with the 10 iris points at 468–477).
const L = {
  top: 10,
  chin: 152,
  cheekL: 234,
  cheekR: 454,
  jawL: 172,
  jawR: 397,
  foreheadL: 54,
  foreheadR: 284,
  eyeOutL: 33,
  eyeInL: 133,
  eyeUpL: 159,
  eyeDownL: 145,
  eyeInR: 362,
  eyeOutR: 263,
  eyeUpR: 386,
  eyeDownR: 374,
  mouthL: 61,
  mouthR: 291,
  noseBridge: 168,
  noseBase: 2,
  browL: [70, 63, 105, 66, 107],
  browR: [300, 293, 334, 296, 336],
  skinL: 50,
  skinR: 280,
  forehead: 151,
  irisL: 468,
  irisEdgeL: 469,
  irisR: 473,
  irisEdgeR: 474,
} as const;

/** Typical proportions of a child's face, the "middle" setting of each option. */
const TYPICAL = { eye: 0.2, gap: 0.24, mouth: 0.36, height: 1.22 };

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** One colour channel as two hex digits. */
const h2 = (v: number) =>
  Math.round(Math.min(255, Math.max(0, v)))
    .toString(16)
    .padStart(2, '0');

export function hex([r, g, b]: [number, number, number]): string {
  return `#${h2(r)}${h2(g)}${h2(b)}`.toUpperCase();
}

const lum = ([r, g, b]: [number, number, number]) => 0.299 * r + 0.587 * g + 0.114 * b;
const diff = (a: [number, number, number], b: [number, number, number]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function average(colours: ([number, number, number] | null)[]): [number, number, number] | null {
  const ok = colours.filter((c): c is [number, number, number] => c !== null);
  if (ok.length === 0) return null;
  const sum = ok.reduce((s, c) => [s[0] + c[0], s[1] + c[1], s[2] + c[2]], [0, 0, 0]);
  return [sum[0] / ok.length, sum[1] / ok.length, sum[2] / ok.length];
}

/** Face shape from proportions: height to width, and jaw and forehead to cheeks. */
export function faceShapeOf(
  height: number,
  cheeks: number,
  jaw: number,
  forehead: number,
): FaceShape {
  const tall = height / cheeks;
  const jawRatio = jaw / cheeks;
  const browRatio = forehead / cheeks;
  if (jawRatio < 0.72 && browRatio > 0.8) return 'heart';
  if (jawRatio > 0.9 && browRatio > 0.82) return 'square';
  if (jawRatio > browRatio * 1.12) return 'pear';
  if (tall > TYPICAL.height * 1.12) return 'oval';
  if (tall < TYPICAL.height * 0.9) return 'wide';
  return 'round';
}

export function faceFromLandmarks(lm: readonly Pt[], sample: Sampler): PhotoLook | null {
  const p = (i: number) => lm[i];
  const need = [
    L.top,
    L.chin,
    L.cheekL,
    L.cheekR,
    L.eyeOutL,
    L.eyeInL,
    L.eyeInR,
    L.eyeOutR,
    L.mouthL,
    L.mouthR,
  ];
  if (need.some((i) => !p(i))) return null;
  const at = (i: number): Pt => p(i) ?? { x: 0, y: 0 };

  const faceW = dist(at(L.cheekL), at(L.cheekR));
  const faceH = dist(at(L.top), at(L.chin));
  if (faceW < 10 || faceH < 10) return null;

  const eyeW = (dist(at(L.eyeOutL), at(L.eyeInL)) + dist(at(L.eyeInR), at(L.eyeOutR))) / 2;
  const open = (dist(at(L.eyeUpL), at(L.eyeDownL)) + dist(at(L.eyeUpR), at(L.eyeDownR))) / 2 / eyeW;

  // Arched brows: the middle of the brow rises well above the line between its ends.
  const arch = (ids: readonly number[]) => {
    const pts = ids.map(at);
    const ends = ((pts[0]?.y ?? 0) + (pts[pts.length - 1]?.y ?? 0)) / 2;
    const peak = Math.min(...pts.slice(1, -1).map((q) => q.y));
    return (ends - peak) / eyeW;
  };
  const arched = (arch(L.browL) + arch(L.browR)) / 2 > 0.22;

  const r = faceW * 0.035;
  const skinRgb = average([
    sample(at(L.skinL).x, at(L.skinL).y, r),
    sample(at(L.skinR).x, at(L.skinR).y, r),
    sample(at(L.forehead).x, at(L.forehead).y, r),
  ]);
  const browRgb = average(
    [...L.browL.slice(1, 4), ...L.browR.slice(1, 4)].map((i) => sample(at(i).x, at(i).y, r * 0.4)),
  );
  const thick = skinRgb && browRgb ? lum(skinRgb) - lum(browRgb) > 70 : false;

  // Hair: just above the top of the forehead. Too close to the skin colour means
  // no hair there (or a hat), so no suggestion.
  const top = at(L.top);
  const hairRgb = sample(top.x, top.y - faceH * 0.1, faceW * 0.05);
  const hair = hairRgb && skinRgb && diff(hairRgb, skinRgb) > 45 ? hex(hairRgb) : undefined;

  // Eye colour: the ring between the pupil and the iris edge.
  const iris = (c: number, e: number) => {
    const a = p(c);
    const b = p(e);
    if (!a || !b) return null;
    const rr = dist(a, b);
    return average([
      sample(a.x + rr * 0.55, a.y, rr * 0.2),
      sample(a.x - rr * 0.55, a.y, rr * 0.2),
    ]);
  };
  const irisRgb = average([iris(L.irisL, L.irisEdgeL), iris(L.irisR, L.irisEdgeR)]);

  const face: FaceDetail = clampFace({
    shape: faceShapeOf(
      faceH,
      faceW,
      dist(at(L.jawL), at(L.jawR)),
      dist(at(L.foreheadL), at(L.foreheadR)),
    ),
    eyes: open > 0.34 ? 'round' : 'almond',
    eyeSize: eyeW / faceW / TYPICAL.eye,
    eyeGap: dist(at(L.eyeInL), at(L.eyeInR)) / faceW / TYPICAL.gap,
    mouthWidth: dist(at(L.mouthL), at(L.mouthR)) / faceW / TYPICAL.mouth,
    brows: thick ? 'thick' : arched ? 'arched' : 'thin',
    nose: dist(at(L.noseBridge), at(L.noseBase)) / faceH > 0.31 ? 'long' : 'button',
    ears: true,
    ...(irisRgb ? { eyeColour: hex(irisRgb) } : {}),
  });
  return { face, skin: skinRgb ? hex(skinRgb) : undefined, hair };
}
