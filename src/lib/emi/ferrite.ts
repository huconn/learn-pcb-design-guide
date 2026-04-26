/**
 * Educational ferrite-bead impedance model.
 *
 * Real ferrite beads are characterized by Z(@100MHz), but the impedance
 * curve has 3 regimes:
 *   - Below f_X: inductive — |Z| ≈ ω·L (reactive, returns energy)
 *   - Around f_X: peak |Z| ≈ Zmax (resistive, dissipates as heat — desirable)
 *   - Above f_X: capacitive due to parasitic shunt cap, |Z| falls
 *
 * Simplified model:
 *   Z(f) = jωL  ‖  R(f)  ‖  1/(jωC)
 *   where R(f) ≈ R_dc + (Rmax - R_dc) · 1/(1 + ((f-fpeak)/Δf)²)
 *
 * For visualization we just compute |Z|, R-part, X-part vs frequency.
 *
 * Returns arrays in log frequency from 1 MHz to 1 GHz.
 */

export type FerriteSpec = {
  ZmaxOhm: number;      // peak |Z| (datasheet, e.g. 600 Ω @ 100 MHz)
  fPeakMHz: number;     // peak frequency (MHz)
  L_nH: number;         // inductance estimate (nH) — ZmaxOhm / (2π·f_peak) ≈ L if f_peak is sweet spot
  C_pF: number;         // parasitic shunt cap (pF) — typically 1-3 pF
  Rdc_mohm: number;     // DC resistance (mΩ)
};

export function ferriteImpedance(spec: FerriteSpec, freqHz: number) {
  const omega = 2 * Math.PI * freqHz;
  const L = spec.L_nH * 1e-9;
  const C = spec.C_pF * 1e-12;
  const Rdc = spec.Rdc_mohm / 1000;
  // Resistive peak — bell shape
  const fPeak = spec.fPeakMHz * 1e6;
  const bw = fPeak * 0.6;  // FWHM ~60% of peak freq
  const norm = 1 / (1 + Math.pow((freqHz - fPeak) / bw, 2));
  const R = Rdc + (spec.ZmaxOhm - Rdc) * norm;
  // Inductive arm
  const Xl = omega * L;
  // Capacitive arm
  const Xc = C > 0 ? -1 / (omega * C) : -Infinity;
  // Parallel: 1/Z_total = 1/R + 1/jXl + 1/jXc  (using Y = G + jB)
  const Y_re = 1 / R;
  const Y_im = -1 / Xl + (Xc !== -Infinity ? -1 / Xc : 0);
  const Y_mag2 = Y_re * Y_re + Y_im * Y_im;
  const Z_re =  Y_re / Y_mag2;
  const Z_im = -Y_im / Y_mag2;
  return {
    Z_mag: Math.sqrt(Z_re * Z_re + Z_im * Z_im),
    R: Z_re,
    X: Z_im,
  };
}

/** Sample log-spaced frequencies and compute |Z|, R, X. */
export function ferriteSweep(spec: FerriteSpec, fMin = 1e6, fMax = 1e9, n = 200) {
  const freqs = new Float64Array(n);
  const zMag = new Float64Array(n);
  const r = new Float64Array(n);
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const f = fMin * Math.pow(fMax / fMin, i / (n - 1));
    freqs[i] = f;
    const z = ferriteImpedance(spec, f);
    zMag[i] = z.Z_mag;
    r[i] = z.R;
    x[i] = z.X;
  }
  return { freqs, zMag, r, x };
}
