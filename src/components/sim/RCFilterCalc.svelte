<script lang="ts">
  import Slider from './shared/Slider.svelte';

  // RC high-pass for AC coupling
  let Rohm = 50000;     // 50 kΩ default (CMOS input)
  let CnF = 100;        // 100 nF default

  $: Cf = CnF * 1e-9;
  $: tau = Rohm * Cf;          // s
  $: fc = 1 / (2 * Math.PI * tau);  // Hz

  // For a square-wave with period T_signal, droop estimate (simple): exp(-T/2 / tau)
  // Visual: how much drop after half-period, given an arbitrary signal frequency
  let fSignal = 1000; // Hz

  $: T = 1 / fSignal;
  $: droopRatio = 1 - Math.exp(-(T / 2) / tau);   // fraction of step that decays in half period
  $: droopPct = droopRatio * 100;

  function fmtR(r: number) {
    if (r >= 1e6) return `${(r / 1e6).toFixed(2)} MΩ`;
    if (r >= 1e3) return `${(r / 1e3).toFixed(1)} kΩ`;
    return `${r.toFixed(0)} Ω`;
  }
  function fmtF(f: number) {
    if (f >= 1e6) return `${(f / 1e6).toFixed(2)} MHz`;
    if (f >= 1e3) return `${(f / 1e3).toFixed(2)} kHz`;
    return `${f.toFixed(1)} Hz`;
  }
  function fmtTau(t: number) {
    if (t >= 1) return `${t.toFixed(3)} s`;
    if (t >= 1e-3) return `${(t * 1e3).toFixed(2)} ms`;
    if (t >= 1e-6) return `${(t * 1e6).toFixed(2)} μs`;
    return `${(t * 1e9).toFixed(0)} ns`;
  }

  // Bode plot scale
  $: fmin = 0.001 * fc;
  $: fmax = 1000 * fc;
  function xScale(f: number, fmn: number, fmx: number) {
    return 30 + (Math.log10(f / fmn) / Math.log10(fmx / fmn)) * 360;
  }
  function yScale(db: number) {
    return 110 - (db + 60) / 60 * 80;
  }
  $: bodePoints = (() => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const f = fmin * Math.pow(fmax / fmin, i / 200);
      const ratio = (f / fc) / Math.sqrt(1 + Math.pow(f / fc, 2));
      const db = 20 * Math.log10(ratio);
      pts.push(`${xScale(f, fmin, fmax).toFixed(1)},${yScale(Math.max(db, -60)).toFixed(1)}`);
    }
    return pts.join(' ');
  })();
  $: fcX = xScale(fc, fmin, fmax);
  $: fSigX = xScale(fSignal, fmin, fmax);

  // Verdict
  $: verdict = (() => {
    if (fSignal < fc * 0.3)   return { label: '신호 차단됨', color: 'rose',    note: 'fc 보다 신호 주파수가 낮아 거의 통과 못함' };
    if (fSignal < fc * 3)     return { label: '경계',         color: 'amber',   note: '감쇠 발생 — fc 를 더 낮추거나 cap 키우기' };
    if (droopPct > 10)        return { label: 'droop 큼',     color: 'amber',   note: '긴 펄스에서 droop > 10% — cap 키우기' };
    return                          { label: '안전',          color: 'emerald', note: 'AC 신호 깨끗하게 통과 · droop 최소' };
  })();
  const tone: Record<string, string> = {
    rose:    'bg-rose-50 border-rose-200 text-rose-800',
    amber:   'bg-amber-50 border-amber-200 text-amber-800',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  };
</script>

<div class="not-prose grid gap-4 lg:grid-cols-[1fr_1.2fr]">
  <div class="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div>
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">RC High-Pass (AC Coupling)</div>
      <div class="mt-1 text-sm text-slate-600">신호 → C → R → GND. R 은 다음 단의 입력 임피던스(또는 풀다운).</div>
    </div>
    <Slider id="r" label="R (다음 단 임피던스)" bind:value={Rohm} min={100}    max={5e6}  step={100} format={fmtR} />
    <Slider id="c" label="C (커플링 캡)"        bind:value={CnF}  min={0.1}    max={47000} step={1}  format={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)} μF` : `${v.toFixed(1)} nF`} />
    <Slider id="fs" label="신호 주파수"          bind:value={fSignal} min={1}   max={1e8}  step={1}   format={fmtF} />

    <div class="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
      <div>τ = R·C = <span class="font-mono text-slate-800">{fmtTau(tau)}</span></div>
      <div>−3 dB cutoff f<sub>c</sub> = <span class="font-mono text-slate-800">{fmtF(fc)}</span></div>
    </div>
  </div>

  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">−3 dB cutoff</div>
      <div class="font-mono text-[10px] text-slate-500">f<sub>c</sub> = 1 / (2π · R · C)</div>
    </div>
    <div class="text-4xl font-semibold font-mono text-indigo-700">
      {fmtF(fc)}
    </div>

    <div class={'rounded-md border p-3 ' + tone[verdict.color]}>
      <div class="font-mono text-[10px] tracking-widest uppercase">판정 · {verdict.label}</div>
      <div class="mt-0.5 text-sm">{verdict.note}</div>
    </div>

    <div class="pt-3 border-t border-slate-200">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase mb-1">사각파 droop (반주기당)</div>
      <div class="font-mono text-2xl text-slate-900">{droopPct.toFixed(1)}%</div>
      <div class="font-mono text-[11px] text-slate-500 mt-1">
        signal T = {fmtTau(T)} · 절반 = {fmtTau(T/2)} · 1−exp(−T/2τ)
      </div>
    </div>

    <!-- Frequency response visualization (log-log Bode sketch) -->
    <svg viewBox="0 0 400 130" class="w-full mt-2 rounded border border-slate-200 bg-white">
      <text x="10" y="14" font-size="9" fill="#64748b" font-family="ui-monospace, monospace">|H(f)| · log-log Bode</text>

      <line x1="30" y1="30"  x2="390" y2="30"  stroke="#e2e8f0" />
      <line x1="30" y1="70"  x2="390" y2="70"  stroke="#cbd5e1" />
      <line x1="30" y1="110" x2="390" y2="110" stroke="#e2e8f0" />
      <text x="2" y="33"  font-size="8" fill="#94a3b8" font-family="ui-monospace, monospace">0 dB</text>
      <text x="2" y="73"  font-size="8" fill="#94a3b8" font-family="ui-monospace, monospace">−30</text>
      <text x="2" y="113" font-size="8" fill="#94a3b8" font-family="ui-monospace, monospace">−60</text>

      <polyline points={bodePoints} fill="none" stroke="#4f46e5" stroke-width="1.8" />

      <line x1={fcX} y1={30} x2={fcX} y2={110} stroke="#10b981" stroke-width="0.8" stroke-dasharray="2 2" />
      <text x={fcX + 3} y="42" font-size="9" fill="#047857" font-family="ui-monospace, monospace">f_c</text>

      <line x1={fSigX} y1={30} x2={fSigX} y2={110} stroke="#f43f5e" stroke-width="0.8" stroke-dasharray="2 2" />
      <text x={fSigX + 3} y="56" font-size="9" fill="#b91c1c" font-family="ui-monospace, monospace">f_signal</text>
    </svg>

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      <b>설계 규칙</b> — f<sub>c</sub> 를 신호의 가장 낮은 주파수보다 <b>10 배 이상 낮게</b>. 사각파라면 가장 긴 "1 또는 0" 시간 동안의 droop 도 함께 점검.
    </div>
  </div>
</div>
