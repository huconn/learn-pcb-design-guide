/**
 * RC snubber design for buck converter SW node ringing.
 *
 * 측정한 ringing 주파수 f_r 와 평소 SW 노드 캐패시턴스 C_par 가 있으면:
 *   기생 인덕턴스 L_par = 1 / ((2π f_r)² · C_par)
 *
 * 일반적인 snubber 설계 룰 (Sandler / TI app note SLVA255):
 *   C_snub = 2 · C_par   (parasitic 보다 충분히 큰 cap)
 *   R_snub = √(L_par / C_par)  (matched impedance)
 *
 * Damping characteristic — R_snub 가 sqrt(L_par/C_par) 이면 critical-damping.
 * 너무 크면 over-damped (ringing 잡힘 BUT 손실 작음 / dV/dt 그대로),
 * 너무 작으면 under-damped (ringing 안 잡힘).
 *
 * Power dissipation in R_snub:
 *   P = C_snub · V_in² · f_sw
 */

export type SnubberInputs = {
  fRingMHz: number;     // measured ringing frequency
  CparPF: number;       // estimated parasitic capacitance at SW node (pF)
  Vin: number;          // input voltage (V)
  fswKHz: number;       // switching frequency (kHz)
};

export type SnubberResult = {
  LparNH: number;       // parasitic inductance (nH)
  CsnubPF: number;      // recommended snubber cap (pF)
  RsnubOhm: number;     // recommended snubber resistor (Ω)
  PrW: number;          // dissipation in R_snub (W)
};

export function designSnubber(p: SnubberInputs): SnubberResult {
  const fRing = p.fRingMHz * 1e6;
  const Cpar = p.CparPF * 1e-12;
  const omega = 2 * Math.PI * fRing;
  const Lpar = 1 / (omega * omega * Cpar);   // H
  const Csnub = 2 * Cpar;                     // F
  const Rsnub = Math.sqrt(Lpar / Cpar);       // Ω
  const fsw = p.fswKHz * 1000;
  const Pr = Csnub * p.Vin * p.Vin * fsw;     // W
  return {
    LparNH: Lpar * 1e9,
    CsnubPF: Csnub * 1e12,
    RsnubOhm: Rsnub,
    PrW: Pr,
  };
}
