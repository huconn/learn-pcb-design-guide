<script lang="ts">
  import Slider from './shared/Slider.svelte';

  // Inputs
  let traceLenMm = 30;     // mm
  let dielHMm = 0.1;       // mm — dielectric thickness (signal to plane)
  let traceWMm = 0.15;     // mm — trace width
  let diMA = 200;          // mA — switching current step
  let dtNs = 2;            // ns — transition time
  let planeConfig: 'solid' | 'slit' | 'none' = 'solid';
  let slitDetourMm = 5;    // mm — how far return must detour around slit
  let noPlaneGapMm = 3;    // mm — how far return runs via another trace if no plane

  // Effective return height (loop height) depending on config
  $: effH = planeConfig === 'solid' ? dielHMm
         : planeConfig === 'slit'   ? slitDetourMm
         : noPlaneGapMm;

  // Simple microstrip-ish loop inductance model
  // L_per_mm (nH/mm) ≈ 0.2 × (loop_height / trace_width) — educational approximation
  // Kept intentionally simple; real values within ~±30% for typical PCB geometry
  $: Lperm = 0.2 * (effH / Math.max(traceWMm, 0.01));   // nH/mm
  $: Ltotal = Lperm * traceLenMm;                        // nH

  // di/dt and bounce voltage
  $: didt = (diMA / 1000) / (dtNs * 1e-9);               // A/s
  $: VbounceV = (Ltotal * 1e-9) * didt;                  // V
  $: VbounceMv = VbounceV * 1000;                         // mV

  // Verdict
  $: verdict = (() => {
    if (VbounceMv < 20)  return { tier: '양호',   note: '3.3 V / 1.8 V 로직 안전.',     color: 'emerald' };
    if (VbounceMv < 80)  return { tier: '주의',   note: '마진 작음. 민감 회로에 영향 가능.', color: 'amber' };
    if (VbounceMv < 200) return { tier: '위험',   note: '로직 노이즈 마진 침범.',        color: 'rose' };
    return                      { tier: '재앙',   note: '설계 다시.',                 color: 'rose' };
  })();

  const colorMap: Record<string, { bg: string; border: string; text: string; bar: string }> = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', bar: 'bg-emerald-500' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   bar: 'bg-amber-500' },
    rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-800',    bar: 'bg-rose-500' },
  };

  $: c = colorMap[verdict.color];

  // Relative bar (0..100%) on a log-ish scale: 1mV -> 0, 1V -> 100
  $: barPct = Math.max(0, Math.min(100, (Math.log10(Math.max(VbounceMv, 0.5)) / Math.log10(1000)) * 100));
</script>

<div class="not-prose grid gap-4 lg:grid-cols-[1fr_1.2fr]">
  <div class="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div>
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Geometry</div>
      <div class="mt-1 text-sm text-slate-600">신호 트레이스와 return 경로 형상.</div>
    </div>
    <Slider id="tl" label="트레이스 길이"   bind:value={traceLenMm} min={5}    max={200} step={1}    format={(v) => `${v.toFixed(0)} mm`} />
    <Slider id="tw" label="트레이스 폭"     bind:value={traceWMm}   min={0.08} max={1.0} step={0.01} format={(v) => `${v.toFixed(2)} mm`} />
    <Slider id="dh" label="plane 간격 (유전체)" bind:value={dielHMm} min={0.05} max={1.5} step={0.01} format={(v) => `${v.toFixed(2)} mm`} />

    <div class="pt-3 border-t border-slate-100">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Return 구성</div>
      <div class="mt-2 flex gap-2 text-sm">
        <label class="flex-1 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 cursor-pointer hover:bg-slate-50"
               class:border-indigo-400={planeConfig === 'solid'} class:bg-indigo-50={planeConfig === 'solid'}>
          <input type="radio" bind:group={planeConfig} value="solid" class="accent-indigo-600" />
          <span>Solid plane</span>
        </label>
        <label class="flex-1 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 cursor-pointer hover:bg-slate-50"
               class:border-amber-400={planeConfig === 'slit'} class:bg-amber-50={planeConfig === 'slit'}>
          <input type="radio" bind:group={planeConfig} value="slit" class="accent-amber-600" />
          <span>Slit 경유</span>
        </label>
        <label class="flex-1 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 cursor-pointer hover:bg-slate-50"
               class:border-rose-400={planeConfig === 'none'} class:bg-rose-50={planeConfig === 'none'}>
          <input type="radio" bind:group={planeConfig} value="none" class="accent-rose-600" />
          <span>Plane 없음</span>
        </label>
      </div>
      {#if planeConfig === 'slit'}
        <div class="mt-3">
          <Slider id="slit" label="slit 우회 거리" bind:value={slitDetourMm} min={1}  max={20} step={0.5} format={(v) => `${v.toFixed(1)} mm`} />
        </div>
      {/if}
      {#if planeConfig === 'none'}
        <div class="mt-3">
          <Slider id="none" label="return 트레이스 간격" bind:value={noPlaneGapMm} min={1} max={20} step={0.5} format={(v) => `${v.toFixed(1)} mm`} />
        </div>
      {/if}
    </div>

    <div class="pt-3 border-t border-slate-100">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Switching Event</div>
      <div class="mt-2 space-y-3">
        <Slider id="di" label="전류 변동 ΔI"     bind:value={diMA}  min={10} max={2000} step={10}  format={(v) => `${v.toFixed(0)} mA`} />
        <Slider id="dt" label="상승 시간 Δt"     bind:value={dtNs}  min={0.2} max={20}  step={0.1} format={(v) => `${v.toFixed(1)} ns`} />
      </div>
    </div>
  </div>

  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-4">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Loop Inductance</div>
      <div class="font-mono text-[10px] text-slate-500">L ≈ 0.2 × (h/w) × length  nH/mm</div>
    </div>
    <div class="text-4xl font-semibold font-mono text-indigo-700">
      {Ltotal < 10 ? Ltotal.toFixed(2) : Ltotal.toFixed(1)} <span class="text-2xl text-indigo-600">nH</span>
    </div>
    <div class="font-mono text-[11px] text-slate-500">
      단위당 {Lperm.toFixed(2)} nH/mm · 루프 높이 {effH.toFixed(2)} mm
    </div>

    <div class="pt-3 border-t border-slate-200">
      <div class="flex items-baseline justify-between">
        <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">V<sub>bounce</sub> = L · di/dt</div>
        <div class="font-mono text-[10px] text-slate-500">di/dt = {(didt / 1e6).toFixed(0)} MA/s</div>
      </div>
      <div class={'mt-2 text-3xl font-semibold font-mono ' + c.text}>
        {VbounceMv < 1 ? VbounceMv.toFixed(2) : VbounceMv < 1000 ? VbounceMv.toFixed(0) : (VbounceV).toFixed(2) + ' V'}
        {#if VbounceMv < 1000}<span class="text-xl">&nbsp;mV</span>{/if}
      </div>

      <div class="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div class={'h-full ' + c.bar} style={`width: ${barPct}%`}></div>
      </div>
      <div class="mt-1 flex justify-between text-[10px] font-mono text-slate-400">
        <span>1 mV</span><span>10 mV</span><span>100 mV</span><span>1 V</span>
      </div>
    </div>

    <div class={'rounded-md border p-3 ' + c.bg + ' ' + c.border}>
      <div class={'font-mono text-[10px] tracking-widest uppercase ' + c.text}>판정 · {verdict.tier}</div>
      <div class={'mt-1 text-sm ' + c.text}>{verdict.note}</div>
    </div>

    <div class="text-[11px] text-slate-500 leading-relaxed">
      <b>주의</b> — 이 계산은 교육용 단순화 모델입니다. 실제 부분 인덕턴스는 트레이스 단면·리턴 분포·주파수에 따라 달라지며,
      정확한 값은 2D/3D EM 솔버(예: HyperLynx, SIwave)로 얻어야 합니다. 여기서는 <b>배치 변화가 만드는 자릿수 변화</b> 를 직관적으로 보는 용도.
    </div>
  </div>
</div>
