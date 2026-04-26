/**
 * Junction temperature estimator — simplified educational model.
 *
 * T_j = T_a + θ_JA_eff · P
 *
 * where θ_JA_eff is reduced from the datasheet θ_JA by board enhancements:
 *
 *   θ_JA_eff = θ_JA_base / (1 + 0.45·√A_sqin + 0.05·N_via)
 *
 * - A_sqin: connected copper-pour area in inch²
 * - N_via: number of thermal vias under the IC pad
 *
 * Calibrated so:
 *   1 in² of pour, 0 vias → ≈ 0.7× of base θ_JA
 *   2 in² + 8 vias       → ≈ 0.5× of base θ_JA
 *   No pour, no vias     → 1.0× (datasheet value)
 *
 * The model is intentionally simple — for real boards consult the
 * IC's thermal data table (e.g. JESD51) and a 3D thermal sim.
 */

export type ThermalInputs = {
  P_W: number;          // dissipated power (W)
  thetaJaBase: number;  // datasheet θ_JA (°C/W)
  Tambient: number;     // ambient temperature (°C)
  copperAreaSqIn: number;
  thermalVias: number;
  TjMaxAbs: number;     // absolute max junction temp (°C, often 125 or 150)
};

export type ThermalResult = {
  thetaJaEff: number;
  Tj: number;
  margin: number;       // °C below TjMaxAbs (negative = exceeds)
  derate: number;       // 0..1, fraction of P_W safe
};

export function estimateThermal(p: ThermalInputs): ThermalResult {
  const factor = 1 + 0.45 * Math.sqrt(Math.max(0, p.copperAreaSqIn)) + 0.05 * Math.max(0, p.thermalVias);
  const thetaJaEff = p.thetaJaBase / factor;
  const Tj = p.Tambient + thetaJaEff * p.P_W;
  const margin = p.TjMaxAbs - Tj;
  const safeP = thetaJaEff > 0 ? (p.TjMaxAbs - p.Tambient) / thetaJaEff : 0;
  const derate = p.P_W > 0 ? Math.min(1, safeP / p.P_W) : 1;
  return { thetaJaEff, Tj, margin, derate };
}
