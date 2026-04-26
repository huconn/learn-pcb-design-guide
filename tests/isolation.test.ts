import { describe, it, expect } from 'vitest';
import { clearanceMm, creepageMm } from '../src/lib/isolation/creepage';

const within = (a: number, b: number, tol: number) =>
  expect(Math.abs(a - b)).toBeLessThan(tol);

describe('Isolation · creepage / clearance', () => {
  it('250 V, PD2, mat II, basic → ~1.8 mm creepage', () => {
    const c = creepageMm(250, 2, 'II', 'basic');
    within(c, 1.8, 0.05);
  });

  it('reinforced doubles creepage', () => {
    const basic = creepageMm(250, 2, 'II', 'basic');
    const reinforced = creepageMm(250, 2, 'II', 'reinforced');
    within(reinforced / basic, 2, 1e-9);
  });

  it('material group worsens distance: IIIb > II > I', () => {
    const i = creepageMm(250, 2, 'I', 'basic');
    const ii = creepageMm(250, 2, 'II', 'basic');
    const iiib = creepageMm(250, 2, 'IIIb', 'basic');
    expect(i).toBeLessThan(ii);
    expect(ii).toBeLessThan(iiib);
  });

  it('pollution degree 3 worse than degree 2', () => {
    const pd2 = creepageMm(250, 2, 'II', 'basic');
    const pd3 = creepageMm(250, 3, 'II', 'basic');
    expect(pd3).toBeGreaterThan(pd2);
  });

  it('clearance: 600 V PD2 basic ≈ 3 mm', () => {
    const c = clearanceMm(600, 2, 'basic');
    within(c, 3.0, 0.05);
  });

  it('clearance reinforced doubles', () => {
    const b = clearanceMm(600, 2, 'basic');
    const r = clearanceMm(600, 2, 'reinforced');
    within(r / b, 2, 1e-9);
  });
});
