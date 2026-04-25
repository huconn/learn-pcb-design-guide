/**
 * IPC-2221 trace current capacity.
 *   I = k · ΔT^0.44 · A^0.725
 * where A is cross-section in mil², k = 0.048 (external) or 0.024 (internal).
 *
 * 1 oz copper ≈ 1.378 mil thick. (35 µm).
 */

export const COPPER_OZ_MIL = 1.378;

export function copperThicknessMil(weightOz: number): number {
  return weightOz * COPPER_OZ_MIL;
}

/** Required width (mil) for given current and temperature rise. */
export function traceWidthForCurrent(
  currentA: number,
  tempRiseC: number,
  copperOz: number,
  external: boolean = true,
): { widthMil: number; areaSqMil: number; thicknessMil: number } {
  const k = external ? 0.048 : 0.024;
  const t = copperThicknessMil(copperOz);
  const exp = 1 / 0.725;
  const A = Math.pow(currentA / (k * Math.pow(tempRiseC, 0.44)), exp);
  const widthMil = A / t;
  return { widthMil, areaSqMil: A, thicknessMil: t };
}

/** Inverse: max safe current (A) for a given trace width. */
export function maxCurrentForTrace(
  widthMil: number,
  copperOz: number,
  tempRiseC: number,
  external: boolean = true,
): number {
  const k = external ? 0.048 : 0.024;
  const t = copperThicknessMil(copperOz);
  const A = widthMil * t;
  return k * Math.pow(tempRiseC, 0.44) * Math.pow(A, 0.725);
}

export const MM_PER_MIL = 0.0254;
export const milToMm = (mil: number) => mil * MM_PER_MIL;
export const mmToMil = (mm: number) => mm / MM_PER_MIL;
