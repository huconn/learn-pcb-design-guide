export type SimParams = {
  Vtarget: number;
  Rvrm: number;
  Lvrm: number;
  Ctotal: number;
  ESRtotal: number;
  loadCurrent: (t: number) => number;
  dt: number;
  tMax: number;
};

export type SimResult = {
  t: Float64Array;
  V: Float64Array;
  Ivrm: Float64Array;
  Iload: Float64Array;
};

/** state = [V, Ivrm]; returns [dV, dIvrm] */
function derivs(
  state: [number, number],
  t: number,
  p: SimParams
): [number, number] {
  const [V, Ivrm] = state;
  const Iload = p.loadCurrent(t);
  const dV = (Ivrm - Iload) / p.Ctotal;
  const dIvrm = (p.Vtarget - V - p.Rvrm * Ivrm) / p.Lvrm;
  return [dV, dIvrm];
}

export function simulateTimeDomain(p: SimParams): SimResult {
  const n = Math.floor(p.tMax / p.dt) + 1;
  const t = new Float64Array(n);
  const V = new Float64Array(n);
  const Ivrm = new Float64Array(n);
  const Iload = new Float64Array(n);

  let state: [number, number] = [p.Vtarget, 0];
  for (let i = 0; i < n; i++) {
    const ti = i * p.dt;
    t[i] = ti;
    V[i] = state[0];
    Ivrm[i] = state[1];
    Iload[i] = p.loadCurrent(ti);

    const k1 = derivs(state, ti, p);
    const s2: [number, number] = [state[0] + (p.dt / 2) * k1[0], state[1] + (p.dt / 2) * k1[1]];
    const k2 = derivs(s2, ti + p.dt / 2, p);
    const s3: [number, number] = [state[0] + (p.dt / 2) * k2[0], state[1] + (p.dt / 2) * k2[1]];
    const k3 = derivs(s3, ti + p.dt / 2, p);
    const s4: [number, number] = [state[0] + p.dt * k3[0], state[1] + p.dt * k3[1]];
    const k4 = derivs(s4, ti + p.dt, p);

    state = [
      state[0] + (p.dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
      state[1] + (p.dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    ];
  }
  return { t, V, Ivrm, Iload };
}
