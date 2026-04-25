/**
 * Educational crosstalk estimate between two parallel microstrips.
 * Uses the simplified Kc/Kl model:
 *   coupling_ratio ≈ 1 / (1 + (s/h)²)
 * where s is edge-to-edge spacing and h is dielectric height.
 * Returns 0..1 (1 = touching, 0 = infinitely far).
 *
 * This is *educational* — captures the right shape of the curve and the
 * "more h, less coupling" intuition, but real coupling depends on length,
 * rise time, and trace shape too.
 */
export function crosstalkRatio(s: number, h: number): number {
  if (h <= 0 || s < 0) return 0;
  return 1 / (1 + Math.pow(s / h, 2));
}

export function ratioToDb(ratio: number): number {
  return 20 * Math.log10(Math.max(ratio, 1e-10));
}

/**
 * 3W rule helper: returns edge-to-edge spacing for "center-to-center ≥ 3W"
 * which translates to "edge-to-edge ≥ 2W".
 */
export function threeWEdgeSpacing(traceWidth: number): number {
  return 2 * traceWidth;
}
