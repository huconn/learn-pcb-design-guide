import { describe, it, expect } from 'vitest';
import { simulateTimeDomain, type SimParams } from '../../src/lib/pdn/timeDomain';

describe('simulateTimeDomain', () => {
  it('at steady state with no load, V stays near V_target', () => {
    const params: SimParams = {
      Vtarget: 3.3,
      Rvrm: 0.01,
      Lvrm: 100e-9,
      Ctotal: 1e-6,
      ESRtotal: 0.01,
      loadCurrent: () => 0,
      dt: 10e-9,
      tMax: 5e-6,
    };
    const { t, V } = simulateTimeDomain(params);
    expect(t.length).toBe(V.length);
    const last = V[V.length - 1];
    expect(last).toBeCloseTo(3.3, 2);
  });

  it('on a load step, V dips and recovers within window', () => {
    const params: SimParams = {
      Vtarget: 3.3,
      Rvrm: 0.05,
      Lvrm: 500e-9,
      Ctotal: 10e-6,
      ESRtotal: 0.005,
      loadCurrent: (t) => (t > 1e-6 ? 1.0 : 0),
      dt: 10e-9,
      tMax: 10e-6,
    };
    const { V } = simulateTimeDomain(params);
    const minV = Math.min(...V);
    expect(minV).toBeLessThan(3.3);
    expect(minV).toBeGreaterThan(2.5);
    const last = V[V.length - 1];
    expect(last).toBeGreaterThan(3.0);
  });

  it('larger Ctotal reduces peak dip for same load step', () => {
    const base = (C: number) => ({
      Vtarget: 3.3,
      Rvrm: 0.05,
      Lvrm: 500e-9,
      Ctotal: C,
      ESRtotal: 0.005,
      loadCurrent: (t: number) => (t > 1e-6 ? 1.0 : 0),
      dt: 10e-9,
      tMax: 10e-6,
    });
    const small = simulateTimeDomain(base(1e-6));
    const big = simulateTimeDomain(base(100e-6));
    expect(Math.min(...big.V)).toBeGreaterThan(Math.min(...small.V));
  });
});
