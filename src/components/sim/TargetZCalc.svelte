<script lang="ts">
  import Slider from './shared/Slider.svelte';

  // PDN target impedance derivation + freq band budget
  let Vrail = 3.3;
  let ripplePct = 3;       // % of rail
  let dItransA = 2.0;       // peak transient current
  let fmaxMHz = 100;        // highest frequency where target Z must hold

  $: dV = Vrail * ripplePct / 100;
  $: Ztarget = dV / dItransA;     // Ω

  // Plane capacitance from area and spacing — educational
  let planeAreaCm2 = 50;
  let planeSpacingMil = 4;       // distance between Vcc and GND planes
  const er = 4.2;
  const e0 = 8.854e-12;
  $: planeAreaM2 = planeAreaCm2 * 1e-4;
  $: planeSpacingM = planeSpacingMil * 0.0254e-3;
  $: Cplane = er * e0 * planeAreaM2 / planeSpacingM;
  $: CplaneNF = Cplane * 1e9;

  // Approximate frequency where plane capacitance dominates
  $: fPlane = 1 / (2 * Math.PI * Ztarget * Cplane);

  function fmtZ(z: number) {
    if (z >= 1) return `${z.toFixed(2)} Ω`;
    return `${(z * 1000).toFixed(1)} mΩ`;
  }
  function fmtF(f: number) {
    if (f >= 1e6) return `${(f / 1e6).toFixed(1)} MHz`;
    if (f >= 1e3) return `${(f / 1e3).toFixed(0)} kHz`;
    return `${f.toFixed(0)} Hz`;
  }

  $: tier = (() => {
    if (Ztarget >= 0.05)  return { label: '여유',     color: 'emerald', note: '일반적 디지털 IC 안전' };
    if (Ztarget >= 0.02)  return { label: '권장',     color: 'sky',     note: 'MCU/FPGA 표준 설계 영역' };
    if (Ztarget >= 0.005) return { label: '엄격',     color: 'amber',   note: '고속 SoC · 정밀 PDN 설계 필요' };
    return                       { label: '극단',     color: 'rose',    note: '온패키지 cap / 온칩 cap 필수' };
  })();

  const tone: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    sky:     'bg-sky-50 border-sky-200 text-sky-800',
    amber:   'bg-amber-50 border-amber-200 text-amber-800',
    rose:    'bg-rose-50 border-rose-200 text-rose-800',
  };
</script>

<div class="not-prose grid gap-4 lg:grid-cols-[1fr_1.2fr]">
  <div class="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div>
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Power Rail</div>
    </div>
    <Slider id="vr" label="V_rail"             bind:value={Vrail}      min={0.6} max={12}  step={0.1} format={(v) => `${v.toFixed(1)} V`} />
    <Slider id="rp" label="허용 ripple"          bind:value={ripplePct}  min={0.5} max={10}  step={0.1} format={(v) => `${v.toFixed(1)} %`} />
    <Slider id="di" label="과도 전류 ΔI"         bind:value={dItransA}   min={0.05} max={20} step={0.05} format={(v) => `${v.toFixed(2)} A`} />
    <Slider id="fm" label="최대 관심 주파수"      bind:value={fmaxMHz}    min={1} max={1000} step={1}    format={(v) => `${v.toFixed(0)} MHz`} />

    <div class="pt-3 border-t border-slate-100 space-y-2">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Plane Capacitance</div>
      <Slider id="pa" label="Vcc/GND plane 면적" bind:value={planeAreaCm2}   min={5}  max={500} step={5}    format={(v) => `${v.toFixed(0)} cm²`} />
      <Slider id="ps" label="plane 간 거리"      bind:value={planeSpacingMil} min={1}  max={20}  step={0.5} format={(v) => `${v.toFixed(1)} mil`} />
    </div>
  </div>

  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Target Z</div>
      <div class="font-mono text-[10px] text-slate-500">Z_t = ΔV / ΔI</div>
    </div>

    <div class="text-4xl font-semibold font-mono text-indigo-700">
      {fmtZ(Ztarget)}
    </div>
    <div class="text-[12px] font-mono text-slate-500">
      ΔV = {Vrail.toFixed(2)} × {ripplePct.toFixed(1)}% = {(dV * 1000).toFixed(0)} mV
    </div>

    <div class={'rounded-md border p-3 ' + tone[tier.color]}>
      <div class="font-mono text-[10px] tracking-widest uppercase">설계 난이도 · {tier.label}</div>
      <div class="mt-0.5 text-sm">{tier.note}</div>
    </div>

    <div class="pt-3 border-t border-slate-200">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase mb-1">Plane 캐패시턴스 (Vcc ↔ GND)</div>
      <div class="font-mono text-2xl text-slate-900">{CplaneNF >= 1 ? CplaneNF.toFixed(1) + ' nF' : (CplaneNF * 1000).toFixed(0) + ' pF'}</div>
      <div class="text-[11px] font-mono text-slate-500">
        ε_r·ε₀·A/d · plane 만으로 {fmtF(fPlane)} 까지 Z_t 이하 보장
      </div>
    </div>

    <div class="pt-3 border-t border-slate-200">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase mb-1">전 주파수 budget — 누가 담당</div>
      <ul class="text-[12px] space-y-1 mt-1">
        <li><span class="font-mono text-slate-500">DC ~ kHz</span> · VRM 자체 (PSRR · feedback)</li>
        <li><span class="font-mono text-slate-500">~ 100 kHz</span> · Bulk cap (47/100/220 μF)</li>
        <li><span class="font-mono text-slate-500">~ 10 MHz</span> · MLCC 1~22 μF</li>
        <li><span class="font-mono text-slate-500">~ 100 MHz</span> · MLCC 100 nF × 다수 (IC 핀 옆)</li>
        <li><span class="font-mono text-slate-500">{`>${(fPlane / 1e6).toFixed(0)} MHz`}</span> · Vcc/GND <b>plane 자체</b> (위 계산값)</li>
        <li><span class="font-mono text-slate-500">&gt; 500 MHz</span> · 패키지 cap · 온칩 cap</li>
      </ul>
    </div>

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      각 주파수 대역마다 다른 부품이 담당 — <a href="/decoupling-capacitor/basics#hierarchical" class="text-indigo-600 underline decoration-indigo-200 hover:decoration-indigo-600">계층 디커플링</a> 의 핵심.
    </div>
  </div>
</div>
