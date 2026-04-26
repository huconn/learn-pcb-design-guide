import { describe, it, expect } from 'vitest';
import { estimateThermal } from '../src/lib/thermal/junction';
import { designSnubber } from '../src/lib/buck/snubber';
import { ferriteImpedance } from '../src/lib/emi/ferrite';

const within = (a: number, b: number, tol: number) =>
  expect(Math.abs(a - b)).toBeLessThan(tol);

describe('Thermal · estimateThermal', () => {
  it('no enhancement: theta_eff = theta_base', () => {
    const r = estimateThermal({ P_W: 1, thetaJaBase: 60, Tambient: 25, copperAreaSqIn: 0, thermalVias: 0, TjMaxAbs: 125 });
    within(r.thetaJaEff, 60, 1e-9);
    within(r.Tj, 85, 1e-9);
    within(r.margin, 40, 1e-9);
  });

  it('1 in² copper alone reduces theta_eff to ~0.7×', () => {
    const r = estimateThermal({ P_W: 1, thetaJaBase: 60, Tambient: 25, copperAreaSqIn: 1, thermalVias: 0, TjMaxAbs: 125 });
    expect(r.thetaJaEff / 60).toBeLessThan(0.75);
    expect(r.thetaJaEff / 60).toBeGreaterThan(0.65);
  });

  it('vias reduce theta_eff further', () => {
    const noVias = estimateThermal({ P_W: 1, thetaJaBase: 60, Tambient: 25, copperAreaSqIn: 1, thermalVias: 0, TjMaxAbs: 125 });
    const tenVias = estimateThermal({ P_W: 1, thetaJaBase: 60, Tambient: 25, copperAreaSqIn: 1, thermalVias: 10, TjMaxAbs: 125 });
    expect(tenVias.thetaJaEff).toBeLessThan(noVias.thetaJaEff);
  });

  it('derate factor: P > safe → derate < 1', () => {
    const r = estimateThermal({ P_W: 5, thetaJaBase: 60, Tambient: 25, copperAreaSqIn: 0, thermalVias: 0, TjMaxAbs: 125 });
    // safe P with no enhancement = (125-25)/60 = 1.667 W. Asked for 5 W → derate < 1.
    expect(r.derate).toBeLessThan(1);
    expect(r.derate).toBeGreaterThan(0.3);
  });
});

describe('Buck · designSnubber', () => {
  it('100 MHz ringing on 50 pF parasitic → ~50 nH parasitic L', () => {
    const r = designSnubber({ fRingMHz: 100, CparPF: 50, Vin: 12, fswKHz: 500 });
    // L = 1/(omega² C). omega = 2π·1e8 ≈ 6.28e8. omega² ≈ 3.95e17. C = 5e-11 F.
    // L = 1 / (3.95e17 × 5e-11) = 1 / 1.97e7 = 50.7 nH
    within(r.LparNH, 50.7, 2);
    // Csnub = 2 × Cpar = 100 pF
    within(r.CsnubPF, 100, 0.01);
    // Rsnub = sqrt(L/C) = sqrt(50.7e-9 / 50e-12) = sqrt(1014) ≈ 31.8 Ω
    within(r.RsnubOhm, 31.8, 0.5);
  });

  it('Pr scales with V_in² and f_sw', () => {
    const a = designSnubber({ fRingMHz: 100, CparPF: 50, Vin: 12, fswKHz: 500 });
    const b = designSnubber({ fRingMHz: 100, CparPF: 50, Vin: 24, fswKHz: 500 });
    within(b.PrW / a.PrW, 4, 1e-6);  // 2x V → 4x P
  });
});

describe('EMI · ferriteImpedance', () => {
  it('peaks near f_peak frequency', () => {
    const spec = { ZmaxOhm: 600, fPeakMHz: 100, L_nH: 1000, C_pF: 1, Rdc_mohm: 50 };
    const at100M = ferriteImpedance(spec, 100e6).Z_mag;
    const at1M   = ferriteImpedance(spec, 1e6).Z_mag;
    expect(at100M).toBeGreaterThan(at1M);
  });

  it('R-part dominates at f_peak (resistive regime)', () => {
    const spec = { ZmaxOhm: 600, fPeakMHz: 100, L_nH: 1000, C_pF: 1, Rdc_mohm: 50 };
    const z = ferriteImpedance(spec, 100e6);
    expect(Math.abs(z.R)).toBeGreaterThan(Math.abs(z.X));
  });
});
