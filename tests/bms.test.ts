import { describe, it, expect } from 'vitest';
import { rdsAtTemp, solveMosfetThermal } from '../src/lib/bms/mosfetThermal';

const within = (a: number, b: number, tol: number) =>
  expect(Math.abs(a - b)).toBeLessThan(tol);

describe('BMS · MOSFET thermal', () => {
  it('rdsAtTemp: 25°C base unchanged', () => {
    within(rdsAtTemp(2.0, 25, 0.5), 2.0, 1e-9);
  });
  it('rdsAtTemp: doubles roughly at 200°C with α=0.5%/°C', () => {
    const r = rdsAtTemp(2.0, 200, 0.5);
    // 1 + 0.005·175 = 1.875 → 3.75 mΩ
    within(r, 3.75, 0.001);
  });

  it('solver: 50A · 1mΩ FET · θ=20 K/W converges, T_j sane', () => {
    const r = solveMosfetThermal({
      current: 50,
      rds25_mohm: 1,
      alphaPctPerC: 0.5,
      numParallel: 1,
      numSeries: 1,
      thetaJA: 20,
      Tambient: 25,
      TjMaxAbs: 175,
    });
    // baseline P ≈ 50²·0.001 = 2.5 W → T_j ≈ 25 + 50 = 75 °C (initial)
    // R rises ~ +25%, P → ~3.1, T_j ~ 87. Iterate to converge ~ 90s.
    expect(r.converged).toBe(true);
    expect(r.Tj).toBeGreaterThan(80);
    expect(r.Tj).toBeLessThan(120);
    expect(r.runaway).toBe(false);
  });

  it('parallel halves R per branch and roughly halves T_j rise', () => {
    const single = solveMosfetThermal({
      current: 50, rds25_mohm: 1, alphaPctPerC: 0.5, numParallel: 1, numSeries: 1,
      thetaJA: 20, Tambient: 25, TjMaxAbs: 175,
    });
    const dual = solveMosfetThermal({
      current: 50, rds25_mohm: 1, alphaPctPerC: 0.5, numParallel: 2, numSeries: 1,
      thetaJA: 20, Tambient: 25, TjMaxAbs: 175,
    });
    expect(dual.Tj).toBeLessThan(single.Tj);
  });

  it('back-to-back doubles total path resistance and dissipation', () => {
    const one = solveMosfetThermal({
      current: 50, rds25_mohm: 1, alphaPctPerC: 0.5, numParallel: 1, numSeries: 1,
      thetaJA: 20, Tambient: 25, TjMaxAbs: 175,
    });
    const two = solveMosfetThermal({
      current: 50, rds25_mohm: 1, alphaPctPerC: 0.5, numParallel: 1, numSeries: 2,
      thetaJA: 20, Tambient: 25, TjMaxAbs: 175,
    });
    within(two.Rpath_mohm / one.Rpath_mohm, 2, 1e-6);
    within(two.Ptotal / one.Ptotal, 2, 1e-6);
  });

  it('thermal runaway flag triggers with under-designed cooling', () => {
    const r = solveMosfetThermal({
      current: 100, rds25_mohm: 5, alphaPctPerC: 0.7, numParallel: 1, numSeries: 1,
      thetaJA: 80, Tambient: 60, TjMaxAbs: 175,
    });
    expect(r.runaway || r.Tj > 175).toBe(true);
  });
});
