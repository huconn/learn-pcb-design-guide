/**
 * IPC-2141 closed-form approximations for surface microstrip impedance.
 *
 * Single-ended:
 *   Z₀ = (87 / √(εr + 1.41)) · ln(5.98·h / (0.8·w + t))
 *   valid roughly for 0.1 < w/h < 2.0, εr in [2..16], t/h small.
 *
 * Differential (edge-coupled):
 *   Z_diff = 2 · Z₀ · (1 − 0.48 · exp(−0.96 · s / h))
 *   where s is edge-to-edge spacing.
 *
 * Inputs share units (mil or mm — only ratios matter).
 */

export function microstripZ0(
  w: number,
  h: number,
  t: number,
  er: number,
): number {
  const denom = 0.8 * w + t;
  if (denom <= 0 || h <= 0) return NaN;
  return (87 / Math.sqrt(er + 1.41)) * Math.log((5.98 * h) / denom);
}

export function diffPairZ(
  w: number,
  s: number,
  h: number,
  t: number,
  er: number,
): { Z0: number; Zdiff: number } {
  const Z0 = microstripZ0(w, h, t, er);
  const Zdiff = 2 * Z0 * (1 - 0.48 * Math.exp((-0.96 * s) / h));
  return { Z0, Zdiff };
}

/**
 * Solve for trace width given a target Z0 — simple bisection over a sane range.
 * Useful for "I want 50 Ω, what width?" lookups.
 */
export function widthForZ0(
  targetZ0: number,
  h: number,
  t: number,
  er: number,
  wMinMil = 1,
  wMaxMil = 200,
): number {
  let lo = wMinMil, hi = wMaxMil;
  // Z0 decreases monotonically with w (wider trace = lower Z)
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const z = microstripZ0(mid, h, t, er);
    if (z > targetZ0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
