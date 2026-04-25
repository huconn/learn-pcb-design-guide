import { describe, it, expect } from 'vitest';
import { traceWidthForCurrent, maxCurrentForTrace } from '../../src/lib/pcb/traceWidth';
import { microstripZ0, diffPairZ, widthForZ0 } from '../../src/lib/pcb/microstrip';
import { crosstalkRatio, ratioToDb } from '../../src/lib/pcb/crosstalk';

const within = (a: number, b: number, tol: number) =>
  expect(Math.abs(a - b)).toBeLessThan(tol);

describe('IPC-2221 trace width', () => {
  it('1 A on external 1 oz with 10 °C rise -> ~10..20 mil', () => {
    const r = traceWidthForCurrent(1.0, 10, 1, true);
    // canonical IPC tables put this around ~12-15 mil for 10C rise external
    expect(r.widthMil).toBeGreaterThan(8);
    expect(r.widthMil).toBeLessThan(25);
  });

  it('inverse round-trips: width -> current -> width', () => {
    const w = traceWidthForCurrent(2.0, 20, 1, true).widthMil;
    const I = maxCurrentForTrace(w, 1, 20, true);
    within(I, 2.0, 1e-6);
  });

  it('internal half the current of external (by k ratio)', () => {
    const ext = maxCurrentForTrace(20, 1, 10, true);
    const int = maxCurrentForTrace(20, 1, 10, false);
    within(int / ext, 0.024 / 0.048, 1e-9);
  });

  it('higher temperature rise -> wider current capacity', () => {
    const lo = maxCurrentForTrace(20, 1, 10, true);
    const hi = maxCurrentForTrace(20, 1, 30, true);
    expect(hi).toBeGreaterThan(lo);
  });
});

describe('Microstrip Z0', () => {
  it('canonical FR4 microstrip near 50 Ω: w=10, h=6, t=1.4, er=4.2', () => {
    const z = microstripZ0(10, 6, 1.4, 4.2);
    // IPC-2141 closed-form: this geometry yields ~49 Ω
    expect(z).toBeGreaterThan(45);
    expect(z).toBeLessThan(55);
  });

  it('wider trace -> lower Z (monotonic)', () => {
    const z1 = microstripZ0(8, 6, 1.4, 4.2);
    const z2 = microstripZ0(12, 6, 1.4, 4.2);
    const z3 = microstripZ0(20, 6, 1.4, 4.2);
    expect(z1).toBeGreaterThan(z2);
    expect(z2).toBeGreaterThan(z3);
  });

  it('higher dielectric -> higher Z (more spacing from plane)', () => {
    const z1 = microstripZ0(10, 4, 1.4, 4.2);
    const z2 = microstripZ0(10, 8, 1.4, 4.2);
    expect(z2).toBeGreaterThan(z1);
  });

  it('widthForZ0 inverse: target 50 Ω -> width such that Z0(width) ≈ 50', () => {
    const w = widthForZ0(50, 6, 1.4, 4.2);
    const z = microstripZ0(w, 6, 1.4, 4.2);
    within(z, 50, 0.1);
  });
});

describe('Differential pair Z_diff', () => {
  it('s -> ∞ approaches 2·Z0', () => {
    const Z0 = microstripZ0(12, 6, 1.4, 4.2);
    const { Zdiff } = diffPairZ(12, 1000, 6, 1.4, 4.2);
    within(Zdiff, 2 * Z0, 0.01);
  });

  it('tighter spacing -> lower Z_diff', () => {
    const wide = diffPairZ(10, 30, 6, 1.4, 4.2).Zdiff;
    const tight = diffPairZ(10, 4, 6, 1.4, 4.2).Zdiff;
    expect(tight).toBeLessThan(wide);
  });
});

describe('Crosstalk', () => {
  it('s=0 -> ratio = 1', () => within(crosstalkRatio(0, 5), 1, 1e-9));
  it('s=h -> ratio = 0.5', () => within(crosstalkRatio(5, 5), 0.5, 1e-9));
  it('s=3h -> ratio ≈ 0.1', () => within(crosstalkRatio(15, 5), 0.1, 1e-9));
  it('ratioToDb of 0.1 = -20 dB', () => within(ratioToDb(0.1), -20, 1e-9));
});
