import { describe, it, expect } from 'vitest';
import { capImpedance, parallelImpedance, magnitude, type Cap, type Complex } from '../../src/lib/pdn/impedance';

const CAP_100NF: Cap = { C: 100e-9, ESL: 1e-9, ESR: 0.01 };

describe('capImpedance', () => {
  it('at self-resonant frequency, magnitude approaches ESR', () => {
    const srf = 1 / (2 * Math.PI * Math.sqrt(CAP_100NF.ESL * CAP_100NF.C));
    const z = capImpedance(CAP_100NF, srf);
    expect(magnitude(z)).toBeCloseTo(CAP_100NF.ESR, 3);
  });

  it('far below SRF, magnitude matches 1/(2πfC)', () => {
    const f = 1e3;
    const z = capImpedance(CAP_100NF, f);
    const expected = 1 / (2 * Math.PI * f * CAP_100NF.C);
    expect(magnitude(z) / expected).toBeCloseTo(1, 2);
  });

  it('far above SRF, magnitude matches 2πfL', () => {
    const f = 1e9;
    const z = capImpedance(CAP_100NF, f);
    const expected = 2 * Math.PI * f * CAP_100NF.ESL;
    expect(magnitude(z) / expected).toBeCloseTo(1, 2);
  });
});

describe('parallelImpedance', () => {
  it('two equal impedances combine to half', () => {
    const a: Complex = { re: 2, im: 0 };
    const b: Complex = { re: 2, im: 0 };
    const z = parallelImpedance([a, b]);
    expect(z.re).toBeCloseTo(1, 9);
    expect(z.im).toBeCloseTo(0, 9);
  });

  it('empty array returns infinity (open circuit)', () => {
    const z = parallelImpedance([]);
    expect(magnitude(z)).toBe(Infinity);
  });

  it('single element returned unchanged', () => {
    const a: Complex = { re: 3, im: 4 };
    const z = parallelImpedance([a]);
    expect(z.re).toBeCloseTo(3, 9);
    expect(z.im).toBeCloseTo(4, 9);
  });
});
