// Sky and light by time of day (SIM.md → Time): day, dusk, night, dawn.
import { color } from '../design/tokens';

export interface Daylight {
  sky: string;
  /** 0–1 darkness laid over the room. */
  dim: number;
  night: boolean;
}

const DAY = color.sky;
const DUSK = '#FFD2AE';
const NIGHT = color.night;
const DAWN = '#FAD0DC';

const channel = (p: number, shift: number) => (p >> shift) & 0xff;

function mix(a: string, b: string, t: number): string {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const ch = channel;
  const m = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
  return `#${((m(16) << 16) | (m(8) << 8) | m(0)).toString(16).padStart(6, '0')}`;
}

/** `m` = minute of the day, 0–1439. */
export function daylight(m: number): Daylight {
  const h = m / 60;
  if (h >= 7 && h < 17.5) return { sky: DAY, dim: 0, night: false };
  if (h >= 17.5 && h < 19.5) {
    const t = (h - 17.5) / 2;
    return { sky: mix(DAY, DUSK, t), dim: 0.08 * t, night: false };
  }
  if (h >= 19.5 && h < 22) {
    const t = (h - 19.5) / 2.5;
    return { sky: mix(DUSK, NIGHT, t), dim: 0.08 + 0.17 * t, night: t > 0.6 };
  }
  if (h >= 5 && h < 7) {
    const t = (h - 5) / 2;
    return {
      sky: t < 0.5 ? mix(NIGHT, DAWN, t * 2) : mix(DAWN, DAY, (t - 0.5) * 2),
      dim: 0.25 * (1 - t),
      night: false,
    };
  }
  return { sky: NIGHT, dim: 0.25, night: true };
}
