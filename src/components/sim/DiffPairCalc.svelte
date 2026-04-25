<script lang="ts">
  import Slider from './shared/Slider.svelte';
  import { diffPairZ } from '../../lib/pcb/microstrip';

  let wMil = 7;       // each trace width
  let sMil = 7;       // edge-to-edge spacing
  let hMil = 6;       // dielectric height
  let copperOz = 1;
  let er = 4.2;

  $: tMil = copperOz * 1.378;
  $: r = diffPairZ(wMil, sMil, hMil, tMil, er);

  type Target = { name: string; Z: number; tol: number; color: string };
  const targets: Target[] = [
    { name: 'PCIe',    Z: 85,  tol: 10, color: '#7c3aed' },
    { name: 'USB diff', Z: 90,  tol: 10, color: '#0ea5e9' },
    { name: 'GbE / HDMI / DDR', Z: 100, tol: 10, color: '#10b981' },
  ];

  function pickTarget(z: number) {
    // bisection: hold w, h, t, er; vary s to hit target Z_diff
    let lo = 1, hi = 80;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      const z2 = diffPairZ(wMil, mid, hMil, tMil, er).Zdiff;
      if (z2 < z) lo = mid; else hi = mid;
    }
    sMil = (lo + hi) / 2;
  }

  // SVG visualization
  const W_canvas = 480;
  const H_canvas = 200;
  $: pxPerMil = Math.min((W_canvas - 80) / Math.max(2 * wMil + sMil + 80, 80), 7);
  $: traceWpx = wMil * pxPerMil;
  $: spacingPx = sMil * pxPerMil;
  $: dielHpx = hMil * pxPerMil;
  $: traceTpx = Math.max(2, tMil * pxPerMil);
  $: cx = W_canvas / 2;
  $: planeY = 165;
  $: traceY = planeY - dielHpx - traceTpx;
  $: leftX = cx - spacingPx / 2 - traceWpx;
  $: rightX = cx + spacingPx / 2;
</script>

<div class="not-prose grid gap-4 lg:grid-cols-[1fr_1.2fr]">
  <div class="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div>
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Geometry</div>
      <div class="mt-1 text-sm text-slate-600">차동 페어 (edge-coupled microstrip).</div>
    </div>
    <Slider id="dw" label="W · 각 트레이스 폭" bind:value={wMil} min={2}   max={30}  step={0.5} format={(v) => `${v.toFixed(1)} mil`} />
    <Slider id="ds" label="S · 페어 간격"      bind:value={sMil} min={2}   max={50}  step={0.5} format={(v) => `${v.toFixed(1)} mil`} />
    <Slider id="dh" label="H · 유전체 두께"   bind:value={hMil} min={2}   max={30}  step={0.5} format={(v) => `${v.toFixed(1)} mil`} />
    <Slider id="der" label="ε_r"             bind:value={er}    min={2.5} max={10.5} step={0.1} format={(v) => v.toFixed(1)} />

    <div>
      <div class="text-[12px] text-slate-500 mb-1">동박</div>
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
      <div class="text-[12px] text-slate-500 mb-2">인터페이스 타겟으로 페어 간격 자동 조정</div>
      <div class="flex flex-wrap gap-1.5 text-sm">
        {#each targets as t}
          <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => pickTarget(t.Z)}>
            {t.name} <span class="font-mono text-[11px] text-slate-500">({t.Z} Ω)</span>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Differential Z<sub>diff</sub></div>
      <div class="font-mono text-[10px] text-slate-500">IPC-2141</div>
    </div>

    <div class="text-4xl font-semibold font-mono text-indigo-700">
      {isFinite(r.Zdiff) ? r.Zdiff.toFixed(1) : '—'} <span class="text-2xl text-indigo-600">Ω</span>
      <span class="text-base text-slate-500 font-normal ml-2">(single-ended Z₀ = {r.Z0.toFixed(1)} Ω)</span>
    </div>

    <!-- Target band visualization -->
    <div class="rounded-md border border-slate-200 bg-white p-3">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase mb-2">인터페이스 적합도</div>
      {#each targets as t}
        {@const lo = t.Z * (1 - t.tol / 100)}
        {@const hi = t.Z * (1 + t.tol / 100)}
        {@const ok = r.Zdiff >= lo && r.Zdiff <= hi}
        <div class="mb-1.5 last:mb-0">
          <div class="flex justify-between text-[12px]">
            <span class="font-medium" style={`color: ${t.color}`}>{t.name}</span>
            <span class="font-mono text-slate-500">{t.Z} Ω ± {t.tol}%</span>
            <span class={'font-mono ' + (ok ? 'text-emerald-700' : 'text-slate-400')}>{ok ? '✓ 적합' : '—'}</span>
          </div>
          <div class="mt-0.5 h-1.5 bg-slate-200 rounded-full relative">
            <div class="absolute h-full rounded-full opacity-30" style={`background: ${t.color}; left: ${Math.max(0, (lo - 50) / 100 * 100)}%; width: ${Math.min(100, (hi - lo) / 100 * 100)}%;`}></div>
            <div class="absolute h-full w-1 bg-indigo-700 rounded-full" style={`left: ${Math.max(0, Math.min(99, (r.Zdiff - 50) / 100 * 100))}%;`}></div>
          </div>
        </div>
      {/each}
      <div class="mt-1 flex justify-between text-[10px] font-mono text-slate-400">
        <span>50</span><span>75</span><span>100</span><span>125</span><span>150</span>
      </div>
    </div>

    <div class="rounded-md border border-slate-200 bg-white overflow-hidden">
      <svg viewBox={`0 0 ${W_canvas} ${H_canvas}`} class="w-full" role="img" aria-label="Differential pair 단면 시각화">
        <rect width={W_canvas} height={H_canvas} fill="#fff" />
        <text x="10" y="14" font-size="9" fill="#64748b" font-family="ui-monospace, monospace">live cross-section</text>

        <rect x="20" y="20" width={W_canvas - 40} height={planeY - 20} fill="#f8fafc" />
        <rect x="20" y={planeY - dielHpx} width={W_canvas - 40} height={dielHpx} fill="#fef3c7" stroke="#fcd34d" />
        <rect x="20" y={planeY} width={W_canvas - 40} height="14" fill="#94a3b8" />

        <rect x={leftX}  y={traceY} width={traceWpx} height={traceTpx} fill="#f59e0b" stroke="#b45309" />
        <rect x={rightX} y={traceY} width={traceWpx} height={traceTpx} fill="#f59e0b" stroke="#b45309" />

        <text x={leftX + traceWpx / 2}  y={traceY - 4} text-anchor="middle" font-size="9" fill="#92400e" font-family="ui-monospace, monospace">+</text>
        <text x={rightX + traceWpx / 2} y={traceY - 4} text-anchor="middle" font-size="9" fill="#92400e" font-family="ui-monospace, monospace">−</text>

        <line x1={leftX + traceWpx} y1={traceY + traceTpx + 6} x2={rightX} y2={traceY + traceTpx + 6} stroke="#10b981" stroke-width="1.2" />
        <text x={cx} y={traceY + traceTpx + 18} text-anchor="middle" font-size="9" fill="#047857" font-family="ui-monospace, monospace">S = {sMil.toFixed(1)} mil</text>

        <text x={W_canvas - 80} y={planeY - dielHpx / 2 + 4} font-size="9" fill="#b91c1c" font-family="ui-monospace, monospace">H = {hMil.toFixed(1)}</text>
        <text x={W_canvas - 80} y={planeY + 11} font-size="9" fill="#fff" font-family="ui-monospace, monospace">GND</text>
      </svg>
    </div>

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      페어를 가깝게 둘수록 ① 차동 임피던스가 낮아지고 ② 외부 노이즈에 강해집니다(common-mode 거부).
      단, 두 트레이스 사이에 via fence 나 다른 신호가 끼면 무용지물.
    </div>
  </div>
</div>
