<script lang="ts">
  import Slider from './shared/Slider.svelte';

  let deltaVmV = 50;  // mV
  let deltaIA = 2.0;  // A

  $: Ztarget = (deltaVmV / 1000) / deltaIA; // Ω

  type Recommendation = { tier: string; note: string; color: string; caps: string[] };

  $: recommendation = (() => {
    if (Ztarget >= 0.1)  return { tier: 'Minimal',    note: '저부하·저요구 조건. 기본 보호만.', color: 'slate',   caps: ['100 nF × 1~2'] };
    if (Ztarget >= 0.05) return { tier: 'Basic',      note: '일반적 디지털 IC 타겟.',          color: 'sky',     caps: ['100 nF × 4', '10 μF × 1'] };
    if (Ztarget >= 0.02) return { tier: 'Recommended',note: '권장 표준. MCU·FPGA 대부분.',     color: 'indigo',  caps: ['100 nF × 4~6', '10 μF × 1~2', '100 μF bulk × 1'] };
    if (Ztarget >= 0.01) return { tier: 'Aggressive', note: '고속 대전류. GPU·고속 SoC.',        color: 'violet',  caps: ['100 nF × 8', '10 μF × 2~4', '100 μF × 2'] };
    return                     { tier: 'Critical',   note: '전용 PDN 설계 필요. 온칩/패키지 cap 고려.', color: 'rose', caps: ['수십 개의 100 nF', '수 개 10 μF + bulk', '+ 온패키지 cap'] };
  })();

  const colorMap: Record<string, string> = {
    slate:  'border-slate-200 bg-slate-50 text-slate-700',
    sky:    'border-sky-200 bg-sky-50 text-sky-800',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    violet: 'border-violet-200 bg-violet-50 text-violet-800',
    rose:   'border-rose-200 bg-rose-50 text-rose-800',
  };
</script>

<div class="not-prose grid gap-4 lg:grid-cols-[1fr_1.2fr]">
  <!-- Inputs -->
  <div class="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div>
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Inputs</div>
      <div class="mt-1 text-sm text-slate-600">IC의 전원 규격에서 ΔV, ΔI 값을 입력하세요.</div>
    </div>
    <Slider id="dvmv" label="허용 리플 ΔV" bind:value={deltaVmV} min={5}  max={500} step={5}   format={(v) => `${v.toFixed(0)} mV`} />
    <Slider id="dia"  label="과도 전류 ΔI" bind:value={deltaIA}  min={0.1} max={20}  step={0.1} format={(v) => `${v.toFixed(1)} A`} />
    <div class="pt-2 border-t border-slate-100 text-xs text-slate-500">
      공식: <span class="font-mono">Z<sub>target</sub> = ΔV / ΔI</span>. 이 값이 전 주파수에서 유지돼야 IC 전원이 규격 안에 머무름.
    </div>
  </div>

  <!-- Output -->
  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Target Impedance</div>
      <div class="font-mono text-[10px] text-slate-500">log scale</div>
    </div>
    <div class="text-4xl font-semibold font-mono text-indigo-700">
      {(Ztarget * 1000).toFixed(1)} <span class="text-2xl text-indigo-600">mΩ</span>
    </div>

    <div class={"rounded-md border px-3 py-3 " + colorMap[recommendation.color]}>
      <div class="flex items-baseline gap-2">
        <span class="font-mono text-[10px] tracking-widest uppercase">Tier</span>
        <span class="font-semibold">{recommendation.tier}</span>
      </div>
      <div class="mt-1 text-xs opacity-80">{recommendation.note}</div>
      <ul class="mt-2 space-y-0.5 text-sm font-mono">
        {#each recommendation.caps as c}<li>• {c}</li>{/each}
      </ul>
    </div>

    <div class="pt-2 text-xs text-slate-500">
      이 추천은 정성적 가이드라인입니다. 실제 설계는 위 <a href="#explore-impedance" class="underline decoration-slate-300 hover:decoration-indigo-600 text-indigo-700">Explore Impedance</a>에서 Z(f)를 직접 확인하세요.
    </div>
  </div>
</div>
