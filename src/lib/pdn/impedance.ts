export type Complex = { re: number; im: number };

export type Cap = {
  C: number;    // Farads
  ESL: number;  // Henries
  ESR: number;  // Ohms
};

export function magnitude(z: Complex): number {
  return Math.hypot(z.re, z.im);
}

function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

function cInv(a: Complex): Complex {
  const d = a.re * a.re + a.im * a.im;
  if (d === 0) return { re: Infinity, im: 0 };
  return { re: a.re / d, im: -a.im / d };
}

/** Z(f) = ESR + jωL + 1/(jωC) = ESR + j(ωL − 1/(ωC)) */
export function capImpedance(cap: Cap, freqHz: number): Complex {
  const w = 2 * Math.PI * freqHz;
  const im = w * cap.ESL - 1 / (w * cap.C);
  return { re: cap.ESR, im };
}

/** 1/Ztotal = Σ 1/Zi */
export function parallelImpedance(zs: Complex[]): Complex {
  if (zs.length === 0) return { re: Infinity, im: 0 };
  let sum: Complex = { re: 0, im: 0 };
  for (const z of zs) sum = cAdd(sum, cInv(z));
  return cInv(sum);
}
