import { describe, it, expect } from 'vitest';
import { gamma, simulateReflections } from '../../src/lib/si/reflection';

const approx = (a: number, b: number, tol = 1e-6) => expect(Math.abs(a - b)).toBeLessThan(tol);

describe('gamma', () => {
  it('matched -> 0', () => approx(gamma(50, 50), 0));
  it('open -> +1', () => approx(gamma(Infinity, 50), 1));
  it('short -> -1', () => approx(gamma(0, 50), -1));
  it('2x impedance -> 1/3', () => approx(gamma(100, 50), 1 / 3));
});

describe('simulateReflections — lossless transmission line', () => {
  // Sample a small number of points at key times to sanity-check superposition.
  const base = {
    Vs: 1.0,
    Z0: 50,
    Td: 1e-9,    // 1 ns one-way
    tRise: 0,    // ideal step — makes analytical checks exact
    tMax: 10e-9, // 10 ns
    dt: 0.01e-9,
  };

  const sampleAt = (arr: Float64Array, t: Float64Array, tWant: number) => {
    // find closest index
    let bestIdx = 0, best = Infinity;
    for (let i = 0; i < t.length; i++) {
      const d = Math.abs(t[i] - tWant);
      if (d < best) { best = d; bestIdx = i; }
    }
    return arr[bestIdx];
  };

  it('matched source and load: V_S = Vs/2 always, V_L = Vs/2 after Td', () => {
    const r = simulateReflections({ ...base, Zs: 50, ZL: 50 });
    approx(r.gammaS, 0);
    approx(r.gammaL, 0);
    approx(sampleAt(r.vSource, r.t, 2e-9), 0.5, 1e-3);
    approx(sampleAt(r.vLoad,   r.t, 0.5e-9), 0, 1e-3);
    approx(sampleAt(r.vLoad,   r.t, 2e-9), 0.5, 1e-3);
  });

  it('matched source, open load: V_L jumps to full Vs at Td', () => {
    const r = simulateReflections({ ...base, Zs: 50, ZL: Infinity });
    approx(sampleAt(r.vLoad, r.t, 0.5e-9), 0, 1e-3);
    approx(sampleAt(r.vLoad, r.t, 2e-9), 1.0, 1e-3);
    // source eventually sees full Vs too after 2Td (reflected wave returns)
    approx(sampleAt(r.vSource, r.t, 3e-9), 1.0, 1e-3);
  });

  it('matched source, shorted load: V_L = 0, V_S collapses to 0 after 2Td', () => {
    const r = simulateReflections({ ...base, Zs: 50, ZL: 0 });
    approx(sampleAt(r.vLoad, r.t, 2e-9), 0, 1e-3);
    approx(sampleAt(r.vSource, r.t, 0.5e-9), 0.5, 1e-3);
    approx(sampleAt(r.vSource, r.t, 3e-9), 0, 1e-3);
  });

  it('mismatched source, open load: converges to Vs = 1.0 in steady state', () => {
    const r = simulateReflections({
      ...base, Zs: 25, ZL: Infinity, tMax: 40e-9,
    });
    // with Zs=25, gS = -1/3. First forward = 1·50/75 = 2/3. Open load reflects +1.
    // First step at source: 2/3. At t = 2Td, source sees first bwd (2/3) plus a new
    // fwd of (-1/3)(2/3) = -2/9. Total at source after = 2/3 + 2/3 - 2/9 ≈ 1.111...
    // Then further reflections converge to 1.0 (DC Vs, open load -> full Vs).
    const vFinal = r.vSource[r.vSource.length - 1];
    approx(vFinal, 1.0, 0.02);
    const vLoadFinal = r.vLoad[r.vLoad.length - 1];
    approx(vLoadFinal, 1.0, 0.02);
  });

  it('initial launched voltage: V+ = Vs·Z0/(Zs+Z0)', () => {
    const r = simulateReflections({ ...base, Zs: 10, ZL: 50 });
    approx(r.vFirstStep, 1.0 * 50 / 60, 1e-6);
  });
});
