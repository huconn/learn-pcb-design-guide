<script lang="ts">
  import Slider from './shared/Slider.svelte';
  import {
    traceWidthForCurrent,
    maxCurrentForTrace,
    milToMm,
  } from '../../lib/pcb/traceWidth';

  // Inputs
  let currentA = 1.0;
  let tempRiseC = 10;
  let copperOz = 1;
  let external = true;

  $: result = traceWidthForCurrent(currentA, tempRiseC, copperOz, external);
  $: widthMil = result.widthMil;
  $: widthMm = milToMm(widthMil);

  // Headroom: actual capacity if we use the next "round-up" width (e.g. 8/12/20 mil)
  $: snapped = (() => {
    const candidates = [4, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 70, 100, 150, 200];
    for (const w of candidates) if (w >= widthMil) return w;
    return candidates[candidates.length - 1];
  })();
  $: snappedI = maxCurrentForTrace(snapped, copperOz, tempRiseC, external);

  $: tier = (() => {
    if (currentA < 0.5) return { label: '소신호',  color: 'sky' };
    if (currentA < 2)   return { label: '중부하',  color: 'indigo' };
    if (currentA < 6)   return { label: '대부하',  color: 'amber' };
    return                       { label: '전력선', color: 'rose' };
  })();
  const tone: Record<string, { bg: string; border: string; text: string }> = {
    sky:    { bg: 'bg-sky-50',    border: 'border-sky-200',    text: 'text-sky-800' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800' },
    amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800' },
    rose:   { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-800' },
  };
  $: c = tone[tier.color];
</script>

<div class="not-prose grid gap-4 lg:grid-cols-[1fr_1.2fr]">
  <div class="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div>
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Inputs</div>
      <div class="mt-1 text-sm text-slate-600">전류 · 동박 무게 · 허용 온도상승 → 최소 폭.</div>
    </div>

    <Slider id="cur"  label="흐를 전류"     bind:value={currentA}  min={0.05} max={20} step={0.05} format={(v) => `${v.toFixed(2)} A`} />
    <Slider id="dt"   label="허용 온도상승"   bind:value={tempRiseC} min={1}    max={60} step={1}    format={(v) => `+${v.toFixed(0)} °C`} />

    <div>
      <div class="text-[12px] text-slate-500 mb-1">동박 무게</div>
      <div class="flex gap-2 text-sm">
        {#each [0.5, 1, 2, 3] as oz}
          <button type="button"
            class={'flex-1 rounded-md border px-2.5 py-1.5 ' + (copperOz === oz
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
            on:click={() => (copperOz = oz)}>
            {oz} oz
          </button>
        {/each}
      </div>
    </div>

    <div>
      <div class="text-[12px] text-slate-500 mb-1">트레이스 위치</div>
      <div class="flex gap-2 text-sm">
        <button type="button"
          class={'flex-1 rounded-md border px-2.5 py-1.5 ' + (external
            ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
          on:click={() => (external = true)}>External (외층)</button>
        <button type="button"
          class={'flex-1 rounded-md border px-2.5 py-1.5 ' + (!external
            ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
          on:click={() => (external = false)}>Internal (내층)</button>
      </div>
      <div class="mt-1 text-[11px] text-slate-500">내층은 방열이 어려워 같은 폭에서도 전류 용량이 약 절반.</div>
    </div>
  </div>

  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Required Width (IPC-2221)</div>
      <div class="font-mono text-[10px] text-slate-500">I = k · ΔT⁰·⁴⁴ · A⁰·⁷²⁵</div>
    </div>

    <div class="text-4xl font-semibold font-mono text-indigo-700">
      {widthMil < 100 ? widthMil.toFixed(1) : widthMil.toFixed(0)} <span class="text-2xl text-indigo-600">mil</span>
      <span class="text-base text-slate-500 font-normal ml-2">≈ {widthMm.toFixed(2)} mm</span>
    </div>

    <div class={'rounded-md border p-3 ' + c.bg + ' ' + c.border}>
      <div class={'font-mono text-[10px] tracking-widest uppercase ' + c.text}>구분 · {tier.label}</div>
      <div class={'mt-0.5 text-sm ' + c.text}>
        디자인 시 다음 표준 폭으로 round-up 권장: <b>{snapped} mil</b> (실제 용량 {snappedI.toFixed(2)} A).
      </div>
    </div>

    <div class="pt-3 border-t border-slate-200 text-[11px] font-mono text-slate-500 space-y-1">
      <div>cross-section A = <span class="text-slate-800">{result.areaSqMil.toFixed(1)} mil²</span></div>
      <div>copper t = <span class="text-slate-800">{result.thicknessMil.toFixed(2)} mil</span> ({(result.thicknessMil * 25.4).toFixed(0)} μm)</div>
      <div>k = <span class="text-slate-800">{external ? '0.048 (external)' : '0.024 (internal)'}</span></div>
    </div>

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      <b>주의</b> — IPC-2221 은 보수적 안전 식. 최신 IPC-2152 는 동박 무게에 따라 더 정밀하게 줍니다.
      전력 라인은 <b>본드 와이어/비아/커넥터의 병목</b> 도 같이 점검하세요.
    </div>
  </div>
</div>
