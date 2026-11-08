import { describe, expect, it } from 'vitest';
import {
  BOARDING_MINUTES,
  DELAY_MINUTES,
  DESTINATIONS,
  FLIGHT_EVERY,
  SHOWN_AFTER,
  boardRows,
  clockDigits,
  runwayStatus,
  timetable,
  type BoardRow,
} from '../../src/stage/board';
import { RUNWAY_PERIOD, runwayPlaneAt } from '../../src/stage/planes';
import { setLanguage, strings } from '../../src/i18n';

describe('the plane outside', () => {
  it('boards while waiting, departs as it rolls, lands when it comes back', () => {
    expect(runwayStatus(0).status).toBe('boarding');
    expect(runwayStatus(6.9).status).toBe('boarding');
    expect(runwayStatus(8).status).toBe('departed');
    expect(runwayStatus(20).status).toBe('departed');
    expect(runwayStatus(30).status).toBe('landed');
    expect(runwayStatus(RUNWAY_PERIOD).status).toBe('boarding');
    expect(runwayStatus(RUNWAY_PERIOD + 1).cycle).toBe(1);
  });

  it('stays in step with the runway animation', () => {
    const stand = runwayPlaneAt(0);
    const outOfStep: number[] = [];
    for (let t = 0; t < RUNWAY_PERIOD * 2; t += 0.25) {
      const p = runwayPlaneAt(t);
      const parked = p.x === stand.x && p.y === stand.y && !p.away;
      const { status } = runwayStatus(t);
      // Boarding only while it waits on its stand; departed as it rolls off and flies
      // away (towards the left); landed as it comes back in (from the right).
      const expected = parked ? status : p.away || p.x < stand.x ? 'departed' : 'landed';
      if (status === 'boarding' ? !parked : status !== expected) outOfStep.push(t);
    }
    expect(outOfStep).toEqual([]);
  });

  it('calm motion keeps the plane parked and its row boarding', () => {
    expect(boardRows(500, 0, 600, 4)[0]?.status).toBe('boarding');
  });
});

function statusesOf(flight: string): BoardRow['status'][] {
  const seen: BoardRow['status'][] = [];
  for (let m = 0; m < 2700; m++) {
    const row = timetable(m, 3).find((r) => r.flight === flight);
    if (row && seen.at(-1) !== row.status) seen.push(row.status);
  }
  return seen;
}

describe('the timetable', () => {
  it('a departure goes on time (or delayed) → boarding → departed, never cancelled', () => {
    const all = new Set<string>();
    for (let n = 0; n < 50; n++) {
      const s = statusesOf(`t${n}`);
      all.add(s.join('>'));
      expect(s.at(-1) === 'departed' || s.at(-1) === 'landed').toBe(true);
    }
    expect(all).toContain('onTime>boarding>departed');
    expect(all).toContain('delayed>boarding>departed');
    expect(all).toContain('onTime>landed');
  });

  it('changes with game time: flights move up and new ones arrive', () => {
    const early = timetable(0, 3).map((r) => r.flight);
    const later = timetable(FLIGHT_EVERY * 4, 3).map((r) => r.flight);
    expect(later).not.toEqual(early);
    expect(timetable(123, 3)).toEqual(timetable(123, 3));
  });

  it('shows a flight for a while after it goes, then drops it', () => {
    // Flight 0 leaves at minute 30 (08:30) unless delayed.
    const first = timetable(0, 3)[0];
    expect(first?.flight).toBe('t0');
    const leaves = 30 + (first?.status === 'delayed' ? DELAY_MINUTES : 0);
    expect(timetable(leaves - BOARDING_MINUTES, 3)[0]?.status).toMatch(/boarding|landed/);
    expect(timetable(leaves + 1, 3)[0]?.flight).toBe('t0');
    expect(timetable(leaves + SHOWN_AFTER, 3)[0]?.flight).not.toBe('t0');
  });

  it('has a time and a picture for every row, with times in order', () => {
    for (let m = 0; m < 3000; m += 37) {
      const rows = timetable(m, 3);
      expect(rows).toHaveLength(3);
      for (const r of rows) expect(DESTINATIONS).toContain(r.destination);
      const times = rows.map((r) => r.time);
      // In order through the day (allowing for midnight).
      for (let i = 1; i < times.length; i++) {
        const a = times[i - 1] ?? 0;
        const b = times[i] ?? 0;
        expect(b > a || a - b > 1000).toBe(true);
      }
    }
  });

  it('writes clock digits', () => {
    expect(clockDigits(0)).toBe('00:00');
    expect(clockDigits(8 * 60 + 37)).toBe('08:35');
    expect(clockDigits(23 * 60 + 59)).toBe('23:55');
  });

  it('every place and status has a name in every language', () => {
    for (const lang of ['en', 'et', 'lv'] as const) {
      setLanguage(lang);
      for (const d of DESTINATIONS) expect(strings.board.places[d]).toBeTruthy();
      for (const s of ['boarding', 'onTime', 'delayed', 'departed', 'landed'] as const)
        expect(strings.board.status[s]).toBeTruthy();
    }
    setLanguage('en');
  });
});
