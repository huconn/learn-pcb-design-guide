/**
 * Lossless transmission line — lattice (bounce) diagram math.
 * Source (Zs) drives a line of characteristic impedance Z0, one-way delay Td,
 * terminated in ZL. A step Vs is applied at t=0. We compute the voltage at the
 * source end and load end over time, accounting for multiple reflections.
 */

export type LineParams = {
  Vs: number;      // source voltage step (V)
  Zs: number;      // source impedance (Ω)
  Z0: number;      // line characteristic impedance (Ω)
  ZL: number;      // load impedance (Ω). Use Infinity for open, 0 for short.
  Td: number;      // one-way propagation delay (s)
  tRise: number;   // driver rise time (s) — for smoothing the edges
  tMax: number;    // total simulation time (s)
  dt: number;      // sample step (s)
};

export type LineResult = {
  t: Float64Array;     // time array (s)
  vSource: Float64Array; // voltage at source end (V)
  vLoad: Float64Array;   // voltage at load end (V)
  gammaS: number;      // source reflection coefficient
  gammaL: number;      // load reflection coefficient
  vFirstStep: number;  // initial launched voltage = Vs * Z0/(Zs+Z0)
};

/** Reflection coefficient; handles ZL=Infinity (open) and ZL=0 (short). */
export function gamma(Zterm: number, Z0: number): number {
  if (!isFinite(Zterm)) return 1;            // open
  if (Zterm === 0) return -1;                // short
  return (Zterm - Z0) / (Zterm + Z0);
}

/** Smoothed unit step: 0 below t0, ramps linearly to 1 over tRise, then stays. */
function rampedStep(t: number, t0: number, tRise: number): number {
  if (tRise <= 0) return t < t0 ? 0 : 1;
  if (t < t0) return 0;
  if (t >= t0 + tRise) return 1;
  return (t - t0) / tRise;
}

/**
 * Compute voltage at source and load ends vs time, summing contributions from
 * successive reflected waves. We build the wave history as a list of
 * (arrivalTime, amplitude, end) events where 'end' = 'S' or 'L'.
 *
 * Forward waves travel source -> load; backward waves travel load -> source.
 * At the load end, voltage seen at any instant = sum of (incident + reflected)
 * arriving there; equivalently, V_L(t) = sum over forward waves of
 *   amp * (1 + gammaL) * step(t - arrival_at_L)
 * Similarly at the source.
 */
export function simulateReflections(p: LineParams): LineResult {
  const gS = gamma(p.Zs, p.Z0);
  const gL = gamma(p.ZL, p.Z0);
  const v0 = p.Vs * p.Z0 / (p.Zs + p.Z0); // first launched forward wave amplitude

  // Enumerate forward and backward waves until amplitude negligible or launch
  // time exceeds tMax. Each wave bounces and generates one child wave.
  type Wave = { dir: 'fwd' | 'bwd'; amp: number; tLaunch: number };
  const waves: Wave[] = [{ dir: 'fwd', amp: v0, tLaunch: 0 }];
  const eps = Math.max(Math.abs(v0) * 1e-4, 1e-9);
  let safety = 400;
  let i = 0;
  while (i < waves.length && safety-- > 0) {
    const w = waves[i++];
    if (w.tLaunch > p.tMax) continue;
    if (w.dir === 'fwd') {
      const childAmp = w.amp * gL;
      if (Math.abs(childAmp) >= eps) {
        waves.push({ dir: 'bwd', amp: childAmp, tLaunch: w.tLaunch + p.Td });
      }
    } else {
      const childAmp = w.amp * gS;
      if (Math.abs(childAmp) >= eps) {
        waves.push({ dir: 'fwd', amp: childAmp, tLaunch: w.tLaunch + p.Td });
      }
    }
  }

  const n = Math.max(1, Math.floor(p.tMax / p.dt) + 1);
  const t = new Float64Array(n);
  const vS = new Float64Array(n);
  const vL = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const ti = i * p.dt;
    t[i] = ti;
    let sS = 0;
    let sL = 0;
    for (const w of waves) {
      const amp = w.amp;
      if (w.dir === 'fwd') {
        // Source end sees this wave at its launch time (it just left source)
        sS += amp * rampedStep(ti, w.tLaunch, p.tRise);
        // Load end sees this wave arriving at tLaunch + Td, multiplied by (1 + gammaL)
        sL += amp * (1 + gL) * rampedStep(ti, w.tLaunch + p.Td, p.tRise);
      } else {
        // Backward wave arrives at source at (tLaunch + Td). Contribute its own
        // amplitude only — the resulting reflected forward wave (gS*amp) is
        // enumerated as its own entry in the waves[] list, so it adds
        // separately and the two together produce the (1+gS) superposition.
        sS += amp * rampedStep(ti, w.tLaunch + p.Td, p.tRise);
        // At the load end, this backward wave was *just launched* at tLaunch
        // but it was already counted above as the reflection of the corresponding
        // forward wave via (1+gammaL). Do not double-count.
      }
    }
    vS[i] = sS;
    vL[i] = sL;
  }

  return { t, vSource: vS, vLoad: vL, gammaS: gS, gammaL: gL, vFirstStep: v0 };
}
