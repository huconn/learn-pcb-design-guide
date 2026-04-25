/**
 * Educational time-domain crosstalk model — NEXT (near-end) and FEXT (far-end)
 * for two parallel microstrip lines with mutual coupling Kb (backward) and
 * Kf (forward). The aggressor drives a step with rise time tRise; coupled
 * length is L; line one-way delay is Td.
 *
 * For a step input V_s(t):
 *   NEXT  ≈ Kb · V_s(t)              (saturates at Kb·V over coupling region)
 *           but NEXT(t) returns to 0 after t = tRise + 2·Td (ends when
 *           aggressor settles AND last reflected coupling returns).
 *   FEXT  ≈ -Kf · L · dV/dt(t - Td)  (proportional to derivative; appears
 *           as a pulse at the far end with width = tRise).
 *
 * Note — this is a *model* for visualization, not an EM solver; it captures
 * the right shape and length scaling but is not quantitatively exact.
 */

export type CtParams = {
  Vs: number;       // aggressor swing (V)
  tRise: number;    // aggressor rise time (s)
  Td: number;       // one-way prop delay over coupled length (s)
  Kb: number;       // backward coupling coefficient (0..0.5 typical)
  Kf: number;       // forward coupling coefficient (1/m typical)  here lumped: Kf*L is dimensionless
  tMax: number;
  dt: number;
};

export type CtResult = {
  t: Float64Array;
  vAggressor: Float64Array;
  vNext: Float64Array;
  vFext: Float64Array;
  nextPeak: number;
  fextPeak: number;
};

function rampStep(t: number, t0: number, tRise: number): number {
  if (tRise <= 0) return t < t0 ? 0 : 1;
  if (t < t0) return 0;
  if (t >= t0 + tRise) return 1;
  return (t - t0) / tRise;
}

function rampStepDeriv(t: number, t0: number, tRise: number): number {
  if (tRise <= 0) return 0;
  if (t < t0 || t >= t0 + tRise) return 0;
  return 1 / tRise;
}

export function simulateCrosstalk(p: CtParams): CtResult {
  const n = Math.max(2, Math.floor(p.tMax / p.dt) + 1);
  const t = new Float64Array(n);
  const va = new Float64Array(n);
  const vn = new Float64Array(n);
  const vf = new Float64Array(n);

  let nextMax = 0, fextMax = 0;

  for (let i = 0; i < n; i++) {
    const ti = i * p.dt;
    t[i] = ti;
    va[i] = p.Vs * rampStep(ti, 0, p.tRise);

    // NEXT: saturates at Kb*Vs over a window 0..(tRise + 2Td) (smooth approximation)
    // Use Kb * Vs * (rampStep(t,0,tRise) - rampStep(t, 2*Td, tRise))
    const nextVal = p.Kb * p.Vs * (rampStep(ti, 0, p.tRise) - rampStep(ti, 2 * p.Td, p.tRise));
    vn[i] = nextVal;
    if (Math.abs(nextVal) > Math.abs(nextMax)) nextMax = nextVal;

    // FEXT: proportional to dV/dt at (t - Td); negative-going pulse for typical microstrip
    const dvdt = p.Vs * rampStepDeriv(ti - p.Td, 0, p.tRise);
    const fextVal = -p.Kf * dvdt * p.tRise;  // Kf*tRise gives a dimensionless scale × dV
    // Actually: FEXT amplitude scales with L; we fold L into Kf upstream.
    // For pulse shape, amplitude ≈ -Kf * L * Vs / tRise * tRise = -Kf*L*Vs is wrong.
    // Use simpler: V_FEXT(t) = -Kf_eff * dV/dt(t-Td) * tRise, peaked at -Kf_eff*Vs.
    // Above already accomplishes this (since dvdt = Vs/tRise during ramp).
    vf[i] = fextVal;
    if (Math.abs(fextVal) > Math.abs(fextMax)) fextMax = fextVal;
  }

  return { t, vAggressor: va, vNext: vn, vFext: vf, nextPeak: nextMax, fextPeak: fextMax };
}
