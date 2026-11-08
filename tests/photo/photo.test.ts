import { describe, expect, it } from 'vitest';
import {
  faceFromLandmarks,
  faceShapeOf,
  type Pt,
  type Sampler,
} from '../../src/photo/faceFromPhoto';
import { LookAverager } from '../../src/photo/lookAverager';
import { ExpressionReader, poseOf } from '../../src/photo/liveFace';

/** A plausible frontal face: 478 points, the ones we read placed by hand. */
function face(over: Partial<Record<number, Pt>> = {}): Pt[] {
  const pts: Pt[] = Array.from({ length: 478 }, () => ({ x: 200, y: 200 }));
  const set: Record<number, Pt> = {
    10: { x: 200, y: 80 }, // top of forehead
    152: { x: 200, y: 330 }, // chin
    234: { x: 100, y: 200 }, // cheek edges: face 200 wide, 250 tall
    454: { x: 300, y: 200 },
    172: { x: 125, y: 280 }, // jaw corners
    397: { x: 275, y: 280 },
    54: { x: 125, y: 110 }, // forehead edges
    284: { x: 275, y: 110 },
    33: { x: 130, y: 180 }, // eyes 46 wide, inner corners 48 apart
    133: { x: 176, y: 180 },
    159: { x: 153, y: 172 },
    145: { x: 153, y: 186 },
    362: { x: 224, y: 180 },
    263: { x: 270, y: 180 },
    386: { x: 247, y: 172 },
    374: { x: 247, y: 186 },
    61: { x: 164, y: 270 }, // mouth 72 wide
    291: { x: 236, y: 270 },
    168: { x: 200, y: 180 },
    2: { x: 200, y: 245 },
    50: { x: 140, y: 230 },
    280: { x: 260, y: 230 },
    151: { x: 200, y: 110 },
    468: { x: 153, y: 180 },
    469: { x: 160, y: 180 },
    473: { x: 247, y: 180 },
    474: { x: 254, y: 180 },
    ...Object.fromEntries([70, 63, 105, 66, 107].map((i, k) => [i, { x: 130 + k * 10, y: 160 }])),
    ...Object.fromEntries(
      [300, 293, 334, 296, 336].map((i, k) => [i, { x: 230 + k * 10, y: 160 }]),
    ),
  };
  for (const [i, p] of Object.entries({ ...set, ...over })) if (p) pts[Number(i)] = p;
  return pts;
}

/** Skin above the forehead too: no hair there. */
const bald: Sampler = (_x, y) => (y < 75 ? [232, 188, 158] : [235, 190, 160]);
/** Blendshape scores by name. */
const m = (o: Record<string, number>) => new Map(Object.entries(o));

/** Skin everywhere, dark hair above the forehead. */
const sampler: Sampler = (_x, y) => (y < 75 ? [60, 40, 30] : [235, 190, 160]);

describe('a face from landmarks', () => {
  it('reads proportions, colours and features', () => {
    const look = faceFromLandmarks(face(), sampler);
    expect(look).not.toBeNull();
    expect(look?.skin).toBe('#EBBEA0');
    expect(look?.hair).toBe('#3C281E');
    expect(look?.face.eyes).toBe('almond'); // 14 open across 46 wide
    expect(look?.face.ears).toBe(true);
    expect(look?.face.eyeSize).toBeGreaterThan(1);
  });

  it('suggests no hair when above the forehead looks like skin (bald or a hat)', () => {
    expect(faceFromLandmarks(face(), bald)?.hair).toBeUndefined();
  });

  it('gives up gently on a broken reading', () => {
    expect(faceFromLandmarks([], sampler)).toBeNull();
    const squashed = face({ 234: { x: 200, y: 200 }, 454: { x: 201, y: 200 } });
    expect(faceFromLandmarks(squashed, sampler)).toBeNull();
  });

  it('sorts face shapes', () => {
    expect(faceShapeOf(250, 200, 120, 190)).toBe('heart');
    expect(faceShapeOf(250, 200, 190, 190)).toBe('square');
    expect(faceShapeOf(320, 200, 160, 150)).toBe('oval');
    expect(faceShapeOf(190, 200, 160, 170)).toBe('wide');
    expect(faceShapeOf(244, 200, 160, 170)).toBe('round');
  });
});

describe('the live camera', () => {
  it('settles on the most common reading and averages sizes', () => {
    const avg = new LookAverager();
    for (let i = 0; i < 10; i++)
      avg.add({
        face: { shape: i < 7 ? 'oval' : 'wide', eyes: 'round', eyeSize: 1.2 },
        skin: '#C08060',
      });
    const now = avg.current();
    expect(now?.face.shape).toBe('oval');
    expect(now?.face.eyeSize).toBeCloseTo(1.2);
    expect(now?.skin).toBe('#C08060');
    avg.reset();
    expect(avg.current()).toBeNull();
  });

  it('learns the resting face, then follows smiles, winks and an open mouth', () => {
    const r = new ExpressionReader();
    // This child's resting face already reads as a slight smile.
    const rest = { mouthSmileLeft: 0.3, mouthSmileRight: 0.3 };
    for (let i = 0; i < 20; i++) r.read(m(rest), null);
    expect(r.calibrated).toBe(true);
    let f = r.read(m(rest), null);
    for (let i = 0; i < 5; i++) f = r.read(m(rest), null);
    expect(f.smile).toBeCloseTo(0.15, 1); // resting reads as neutral, not a grin
    for (let i = 0; i < 8; i++)
      f = r.read(m({ mouthSmileLeft: 0.75, mouthSmileRight: 0.75 }), null);
    expect(f.smile).toBeGreaterThan(0.8);
    for (let i = 0; i < 8; i++) f = r.read(m({ ...rest, eyeBlinkLeft: 0.9 }), null);
    expect(f.blinkL).toBeGreaterThan(0.8); // a wink: one eye only
    expect(f.blinkR).toBeLessThan(0.1);
    for (let i = 0; i < 8; i++) f = r.read(m({ ...rest, jawOpen: 0.6 }), null);
    expect(f.open).toBeGreaterThan(0.8);
  });

  it('reads a head tilt and turn as a mirror shows them', () => {
    const pts = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
    pts[33] = { x: 0.4, y: 0.4 };
    pts[263] = { x: 0.6, y: 0.45 }; // the right eye lower: head tilted
    pts[234] = { x: 0.3, y: 0.5 };
    pts[454] = { x: 0.7, y: 0.5 };
    pts[1] = { x: 0.55, y: 0.55 }; // nose to the picture's right
    const pose = poseOf(pts);
    expect(pose.roll).toBeLessThan(0);
    expect(pose.yaw).toBeLessThan(0);
    expect(poseOf([])).toEqual({ roll: 0, yaw: 0 });
  });
});
