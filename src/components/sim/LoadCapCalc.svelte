<script lang="ts">
  import Slider from './shared/Slider.svelte';

  // Inputs
  let CL_pF = 18;          // Load capacitance from crystal datasheet
  let Cstray_pF = 5;       // Estimated PCB + pin parasitic
  let symmetric = true;
  let C1_user_pF = 22;     // Used when not symmetric
  let C2_user_pF = 22;

  // Required series-combination: C1·C2/(C1+C2) = CL - Cstray
  $: Cseries_target = CL_pF - Cstray_pF;
  $: C1C2_required = (() => {
    if (symmetric) {
      const v = 2 * Cseries_target;
      return { C1: v, C2: v };
    }
    // For asymmetric, need C1 chosen → derive C2
    // 1/Cseries = 1/C1 + 1/C2 → C2 = 1 / (1/Cseries - 1/C1)
    const inv = 1 / Cseries_target - 1 / C1_user_pF;
    const C2 = inv > 0 ? 1 / inv : Infinity;
    return { C1: C1_user_pF, C2 };
  })();

  // Snap to nearest standard E12 or commonly available cap value
  const standardCaps = [1, 1.5, 2.2, 3.3, 4.7, 5.6, 6.8, 8.2, 10, 12, 15, 18, 22, 27, 33, 39, 47];
  function snap(v: number): number {
    if (!isFinite(v)) return NaN;
    let best = standardCaps[0];
    let bestDiff = Math.abs(v - best);
    for (const c of standardCaps) {
      const d = Math.abs(v - c);
      if (d < bestDiff) { bestDiff = d; best = c; }
    }
    return best;
  }
  $: snappedC1 = snap(C1C2_required.C1);
  $: snappedC2 = snap(C1C2_required.C2);

  // Compute actual CL with snapped values
  $: actualCseries = (snappedC1 * snappedC2) / (snappedC1 + snappedC2);
  $: actualCL = actualCseries + Cstray_pF;
  $: deltaPct = ((actualCL - CL_pF) / CL_pF) * 100;

  $: tier = (() => {
    const d = Math.abs(deltaPct);
    if (d < 5)  return { label: '우수',     color: 'emerald', note: '오차 < 5% — 정상 발진 + 정확한 주파수' };
    if (d < 15) return { label: '허용',     color: 'sky',     note: 'cap 값 가까움. 주파수 살짝 어긋남' };
    if (d < 30) return { label: '주의',     color: 'amber',   note: 'cap 값 다시 검토. 발진 안정성 영향 가능' };
    return                     { label: '위험',     color: 'rose',    note: '발진 불안정 / 주파수 크게 빗나감' };
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
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Crystal Datasheet</div>
      <div class="mt-1 text-sm text-slate-600">데이터시트의 load capacitance C_L 와 stray 추정.</div>
    </div>
    <Slider id="cl"  label="C_L (data sheet)"  bind:value={CL_pF}     min={4}  max={32} step={0.5} format={(v) => `${v.toFixed(1)} pF`} />
    <Slider id="cs"  label="C_stray (PCB + pin)" bind:value={Cstray_pF} min={1}  max={15} step={0.5} format={(v) => `${v.toFixed(1)} pF`} />

    <div class="pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
      <b>가이드</b> — C_L 은 crystal 데이터시트 (보통 12, 18, 또는 20 pF). C_stray 는 보통 3–7 pF — MCU 데이터시트의 XIN/XOUT pin capacitance + 짧은 PCB 트레이스 합. 정확한 값 모르면 5 pF 로 시작.
    </div>

    <div class="pt-3 border-t border-slate-100">
      <label class="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" bind:checked={symmetric} class="accent-indigo-600" />
        <span>대칭 (C1 = C2) — 권장</span>
      </label>
      {#if !symmetric}
        <div class="mt-3 space-y-2">
          <Slider id="c1u" label="C1 (강제값)" bind:value={C1_user_pF} min={5} max={68} step={0.5} format={(v) => `${v.toFixed(1)} pF`} />
        </div>
      {/if}
    </div>
  </div>

  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">계산값 → 표준 cap 값</div>
      <div class="font-mono text-[10px] text-slate-500">C_L = (C1·C2)/(C1+C2) + C_stray</div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-md border border-slate-200 bg-white p-3">
        <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">C1 권장</div>
        <div class="text-2xl font-semibold font-mono text-indigo-700 mt-1">
          {isFinite(C1C2_required.C1) ? C1C2_required.C1.toFixed(1) : '—'} <span class="text-base text-indigo-500">pF</span>
        </div>
        <div class="font-mono text-[11px] text-slate-500 mt-1">
          → 표준 <b class="text-slate-800">{snappedC1} pF</b>
        </div>
      </div>
      <div class="rounded-md border border-slate-200 bg-white p-3">
        <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">C2 권장</div>
        <div class="text-2xl font-semibold font-mono text-indigo-700 mt-1">
          {isFinite(C1C2_required.C2) ? C1C2_required.C2.toFixed(1) : '—'} <span class="text-base text-indigo-500">pF</span>
        </div>
        <div class="font-mono text-[11px] text-slate-500 mt-1">
          → 표준 <b class="text-slate-800">{snappedC2} pF</b>
        </div>
      </div>
    </div>

    <div class={'rounded-md border p-3 ' + tone[tier.color]}>
      <div class="font-mono text-[10px] tracking-widest uppercase">표준 값 적용 시 · {tier.label}</div>
      <div class="mt-1 text-sm">
        실제 C_L = <span class="font-mono">{actualCL.toFixed(2)} pF</span>
        (목표 대비 <span class="font-mono">{deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%</span>) — {tier.note}
      </div>
    </div>

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      <b>실무 팁</b>:
      <ul class="list-disc pl-5 mt-1 space-y-0.5">
        <li>C_L 가 12 pF → 보통 C1=C2=18~22 pF</li>
        <li>C_L 가 18 pF → 보통 C1=C2=22~27 pF</li>
        <li>실제 양산 보드는 ±10 ppm 의 정확도가 필요하면 측정 후 cap 미세 조정</li>
        <li>잘 발진 안 하면 → C1, C2 둘 다 약간 줄여보기 (gain 마진 확보)</li>
      </ul>
    </div>
  </div>
</div>
