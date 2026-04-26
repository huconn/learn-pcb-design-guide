/**
 * High-current MOSFET conduction-loss + thermal feedback iterator.
 *
 * MOSFET R_DS(on) increases roughly linearly with junction temperature:
 *   R_DS(on, T) = R_DS(on, 25) · (1 + α · (T_j − 25))
 *
 * α typical values:
 *   - Low-V (≤30 V) Si MOSFETs: α ≈ 0.4 ~ 0.6 %/°C
 *   - 80–150 V Si MOSFETs:      α ≈ 0.5 ~ 0.8 %/°C
 *   - 600 V super-junction:     α ≈ 0.6 ~ 0.9 %/°C
 *   - GaN HEMTs:                α ≈ 0.2 ~ 0.4 %/°C (much flatter)
 *
 * Power dissipation P = I² · R, then T_j = T_a + θ_JA · P.
 * Because R rises with T_j, this is iterative — and unstable if the
 * thermal design is too weak (positive feedback can lead to thermal
 * runaway).
 */

export type BmsMosfetParams = {
  current: number;        // continuous current through path (A)
  rds25_mohm: number;     // R_DS(on) at 25°C, single FET (mΩ)
  alphaPctPerC: number;   // %/°C (0.5 typical)
  numParallel: number;    // FETs in parallel (1, 2, 3 ...)
  numSeries: number;      // FETs in series in the conduction path
                          //   (back-to-back BMS = 2; single switch = 1)
  thetaJA: number;        // effective θ_JA per FET (°C/W) — already includes
                          //   PCB thermal enhancement
  Tambient: number;       // °C
  TjMaxAbs: number;       // absolute max T_j (°C) — datasheet
};

export type BmsMosfetResult = {
  Tj: number;             // converged junction temp per FET
  Pper: number;           // dissipation per FET (W)
  Ptotal: number;         // total dissipation in the conduction path (W)
  Rper_mohm: number;      // converged R per FET (mΩ)
  Rpath_mohm: number;     // total path R (mΩ) = numSeries · Rper / numParallel
  Vdrop_mV: number;       // total path voltage drop
  margin: number;         // T_j_max − T_j (°C)
  converged: boolean;
  runaway: boolean;       // true if model diverges (always check thermal design)
};

export function rdsAtTemp(rds25_mohm: number, tempC: number, alphaPctPerC = 0.5): number {
  return rds25_mohm * (1 + (alphaPctPerC / 100) * (tempC - 25));
}

export function solveMosfetThermal(p: BmsMosfetParams): BmsMosfetResult {
  let Tj = p.Tambient;
  let Rper = p.rds25_mohm;
  let Pper = 0;
  let converged = false;
  for (let i = 0; i < 60; i++) {
    Rper = rdsAtTemp(p.rds25_mohm, Tj, p.alphaPctPerC);
    // Each parallel branch sees current/numParallel
    const Iper = p.current / Math.max(1, p.numParallel);
    Pper = Iper * Iper * (Rper / 1000);
    const newTj = p.Tambient + p.thetaJA * Pper;
    if (Math.abs(newTj - Tj) < 0.05) { Tj = newTj; converged = true; break; }
    if (newTj > 500) { Tj = newTj; break; } // runaway
    Tj = newTj;
  }
  const runaway = !converged && Tj > 200;
  const Ptotal = Pper * p.numParallel * p.numSeries;
  const Rpath_mohm = (Rper * p.numSeries) / Math.max(1, p.numParallel);
  return {
    Tj,
    Pper,
    Ptotal,
    Rper_mohm: Rper,
    Rpath_mohm,
    Vdrop_mV: p.current * Rpath_mohm,
    margin: p.TjMaxAbs - Tj,
    converged,
    runaway,
  };
}
