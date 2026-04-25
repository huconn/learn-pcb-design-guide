<script lang="ts">
  import Slider from './shared/Slider.svelte';
  import { microstripZ0, widthForZ0 } from '../../lib/pcb/microstrip';

  let wMil = 10;       // trace width (mil)
  let hMil = 6;        // dielectric thickness (mil)
  let copperOz = 1;    // 1 oz = 1.4 mil
  let er = 4.2;        // FR4 typical

  $: tMil = copperOz * 1.378;
  $: Z0 = microstripZ0(wMil, hMil, tMil, er);

  const targets = [
    { v: 50,  label: '50 Ω' },
    { v: 75,  label: '75 Ω' },
    { v: 90,  label: '90 Ω (USB diff/2)' },
  ];

  function jumpTo(target: number) {
    wMil = Math.max(2, Math.min(80, widthForZ0(target, hMil, tMil, er)));
  }

  $: tier = (() => {
    if (Math.abs(Z0 - 50) < 5)  return { label: '~50 Ω', color: 'indigo' };
    if (Math.abs(Z0 - 75) < 5)  return { label: '~75 Ω', color: 'sky' };
    if (Math.abs(Z0 - 100) < 8) return { label: '~100 Ω', color: 'emerald' };
    return                            { label: 'custom', color: 'slate' };
  })();
  const tone: Record<string, string> = {
    indigo:  'bg-indigo-50 border-indigo-200 text-indigo-800',
    sky:     'bg-sky-50 border-sky-200 text-sky-800',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    slate:   'bg-slate-50 border-slate-200 text-slate-700',
  };

  // SVG live cross-section
  const W_canvas = 480;
  const H_canvas = 200;
  $: pxPerMil = Math.min((W_canvas - 80) / Math.max(wMil + 60, 60), 6);
  $: traceWpx = wMil * pxPerMil;
  $: dielHpx  = hMil * pxPerMil;
  $: traceTpx = Math.max(2, tMil * pxPerMil);
  $: cx = W_canvas / 2;
  $: planeY = 165;
  $: traceY = planeY - dielHpx - traceTpx;
</script>

<div class="not-prose grid gap-4 lg:grid-cols-[1fr_1.2fr]">
  <div class="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div>
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Geometry</div>
      <div class="mt-1 text-sm text-slate-600">단일 트레이스 (single-ended) 마이크로스트립.</div>
    </div>
    <Slider id="w"  label="W · 트레이스 폭"   bind:value={wMil} min={2}   max={60}  step={0.5}  format={(v) => `${v.toFixed(1)} mil (${(v*0.0254).toFixed(2)} mm)`} />
    <Slider id="h"  label="H · 유전체 두께"    bind:value={hMil} min={2}   max={30}  step={0.5}  format={(v) => `${v.toFixed(1)} mil (${(v*0.0254).toFixed(2)} mm)`} />
    <Slider id="er" label="ε_r · 유전율"      bind:value={er}   min={2.5} max={10.5} step={0.1} format={(v) => v.toFixed(1)} />

    <div>
      <div class="text-[12px] text-slate-500 mb-1">동박 무게 (copper weight)</div>
      <div class="flex gap-2 text-sm">
        {#each [0.5, 1, 2] as oz}
          <button type="button"
            class={'flex-1 rounded-md border px-2.5 py-1.5 ' + (copperOz === oz
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
            on:click={() => (copperOz = oz)}>{oz} oz</button>
        {/each}
      </div>
    </div>

    <div class="pt-3 border-t border-slate-100">
      <div class="text-[12px] text-slate-500 mb-2">타겟 임피던스로 자동 폭 설정</div>
      <div class="flex flex-wrap gap-1.5 text-sm">
        {#each targets as t}
          <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => jumpTo(t.v)}>{t.label}</button>
        {/each}
      </div>
    </div>
  </div>

  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Single-ended Z₀</div>
      <div class="font-mono text-[10px] text-slate-500">IPC-2141</div>
    </div>

    <div class="text-4xl font-semibold font-mono text-indigo-700">
      {isFinite(Z0) ? Z0.toFixed(1) : '—'} <span class="text-2xl text-indigo-600">Ω</span>
    </div>

    <div class={'rounded-md border p-2 ' + tone[tier.color]}>
      <div class="font-mono text-[10px] tracking-widest uppercase">분류 · {tier.label}</div>
    </div>

    <div class="rounded-md border border-slate-200 bg-white overflow-hidden">
      <svg viewBox={`0 0 ${W_canvas} ${H_canvas}`} class="w-full" role="img" aria-label="Microstrip 단면 라이브 시각화">
        <rect width={W_canvas} height={H_canvas} fill="#fff" />
        <text x="10" y="14" font-size="9" fill="#64748b" font-family="ui-monospace, monospace">live cross-section</text>

        <!-- air -->
        <rect x="20" y="20" width={W_canvas - 40} height={planeY - 20} fill="#f8fafc" />
        <!-- dielectric -->
        <rect x="20" y={planeY - dielHpx} width={W_canvas - 40} height={dielHpx} fill="#fef3c7" stroke="#fcd34d" />
        <!-- plane -->
        <rect x="20" y={planeY} width={W_canvas - 40} height="14" fill="#94a3b8" />

        <!-- trace -->
        <rect x={cx - traceWpx / 2} y={traceY} width={traceWpx} height={traceTpx} fill="#f59e0b" stroke="#b45309" />

        <!-- annotations -->
        <text x={cx - traceWpx / 2} y={traceY - 4} font-size="9" fill="#92400e" font-family="ui-monospace, monospace">W = {wMil.toFixed(1)} mil</text>
        <text x={W_canvas - 80} y={planeY - dielHpx / 2 + 4} font-size="9" fill="#b91c1c" font-family="ui-monospace, monospace">H = {hMil.toFixed(1)}</text>
        <text x={W_canvas - 80} y={planeY + 11} font-size="9" fill="#fff" font-family="ui-monospace, monospace">GND</text>
        <text x="22"  y={planeY - dielHpx / 2 + 4} font-size="9" fill="#92400e" font-family="ui-monospace, monospace">ε_r = {er.toFixed(1)}</text>
      </svg>
    </div>

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      유효 범위 — w/h ∈ [0.1, 2]. 매우 좁거나 매우 넓은 트레이스는 closed-form 오차 ±10% 이상.
      실제 fab 임피던스 컨트롤은 ±10% (FR4) 가 일반적.
    </div>
  </div>
</div>
