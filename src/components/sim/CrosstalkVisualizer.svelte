<script lang="ts">
  import Slider from './shared/Slider.svelte';
  import { crosstalkRatio, ratioToDb } from '../../lib/pcb/crosstalk';

  let wMil = 7;     // trace width
  let sMil = 14;    // edge-to-edge between two parallel traces (default 2W)
  let hMil = 6;     // dielectric height to GND plane

  $: ratio = crosstalkRatio(sMil, hMil);
  $: dB = ratioToDb(ratio);
  $: pct = ratio * 100;

  // Verdict thresholds (educational)
  $: tier = (() => {
    if (pct < 5)   return { label: '안전',   color: 'emerald', note: '커플링 미미 — 일반 디지털 OK' };
    if (pct < 15)  return { label: '주의',   color: 'amber',   note: '경계선 — 고속이면 시뮬 권장' };
    if (pct < 35)  return { label: '위험',   color: 'rose',    note: '눈에 보일 ringing/glitch 가능' };
    return                    { label: '재앙',   color: 'rose',    note: '커플링 매우 큼 — 페어 분리 필요' };
  })();

  const tone: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber:   'bg-amber-50 border-amber-200 text-amber-800',
    rose:    'bg-rose-50 border-rose-200 text-rose-800',
  };

  // 3W rule check (center-to-center >= 3W means edge-to-edge >= 2W)
  $: meets3W = sMil >= 2 * wMil;
  $: ratioPerW = sMil / wMil;

  // SVG visualization
  const W_canvas = 480, H_canvas = 220;
  $: pxPerMil = Math.min((W_canvas - 80) / Math.max(2 * wMil + sMil + 80, 80), 7);
  $: traceWpx = wMil * pxPerMil;
  $: spacingPx = sMil * pxPerMil;
  $: dielHpx = hMil * pxPerMil;
  $: traceTpx = Math.max(2, 1.378 * pxPerMil);
  $: cx = W_canvas / 2;
  $: planeY = 175;
  $: traceY = planeY - dielHpx - traceTpx;
  $: leftX = cx - spacingPx / 2 - traceWpx;
  $: rightX = cx + spacingPx / 2;

  // Aggressor pulse (left). Show coupled victim trace amplitude visually.
  function setSpacingByRatio(r: number) {
    // ratio = 1/(1+(s/h)^2) -> s/h = sqrt(1/ratio - 1)
    const sh = Math.sqrt(1 / r - 1);
    sMil = Math.max(0.5, sh * hMil);
  }
</script>

<div class="not-prose grid gap-4 lg:grid-cols-[1fr_1.2fr]">
  <div class="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div>
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Geometry</div>
      <div class="mt-1 text-sm text-slate-600">두 평행 트레이스 사이 커플링.</div>
    </div>
    <Slider id="cw" label="W · 트레이스 폭" bind:value={wMil} min={2} max={30} step={0.5} format={(v) => `${v.toFixed(1)} mil`} />
    <Slider id="cs" label="S · edge-to-edge 간격" bind:value={sMil} min={0.5} max={80} step={0.5} format={(v) => `${v.toFixed(1)} mil`} />
    <Slider id="ch" label="H · plane 까지" bind:value={hMil} min={2} max={30} step={0.5} format={(v) => `${v.toFixed(1)} mil`} />

    <div class="pt-3 border-t border-slate-100">
      <div class="text-[12px] text-slate-500 mb-2">바로가기</div>
      <div class="flex flex-wrap gap-1.5 text-sm">
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => (sMil = 2 * wMil)}>3W rule (s = 2W)</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => (sMil = 4 * wMil)}>5W (안전)</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => setSpacingByRatio(0.01)}>-40 dB 까지</button>
      </div>
    </div>
  </div>

  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Coupling estimate</div>
      <div class="font-mono text-[10px] text-slate-500">k ≈ 1 / (1 + (s/h)²)</div>
    </div>

    <div>
      <div class="text-4xl font-semibold font-mono text-indigo-700">
        {pct < 1 ? pct.toFixed(2) : pct.toFixed(1)}<span class="text-2xl text-indigo-600">%</span>
        <span class="text-xl text-slate-500 font-normal ml-2">({dB.toFixed(1)} dB)</span>
      </div>
      <div class="mt-1 text-[12px] font-mono text-slate-500">
        s/h = {(sMil / hMil).toFixed(2)} · s/W = {ratioPerW.toFixed(2)} · 3W rule {meets3W ? '✓' : '✗'}
      </div>
    </div>

    <div class={'rounded-md border p-3 ' + tone[tier.color]}>
      <div class="font-mono text-[10px] tracking-widest uppercase">판정 · {tier.label}</div>
      <div class="mt-0.5 text-sm">{tier.note}</div>
    </div>

    <div class="rounded-md border border-slate-200 bg-white overflow-hidden">
      <svg viewBox={`0 0 ${W_canvas} ${H_canvas}`} class="w-full" role="img" aria-label="Crosstalk 시각화">
        <rect width={W_canvas} height={H_canvas} fill="#fff" />
        <text x="10" y="14" font-size="9" fill="#64748b" font-family="ui-monospace, monospace">aggressor (왼쪽) → victim (오른쪽)</text>

        <rect x="20" y="20" width={W_canvas - 40} height={planeY - 20} fill="#f8fafc" />
        <rect x="20" y={planeY - dielHpx} width={W_canvas - 40} height={dielHpx} fill="#fef3c7" stroke="#fcd34d" />
        <rect x="20" y={planeY} width={W_canvas - 40} height="14" fill="#94a3b8" />

        <!-- aggressor (left, with pulse) -->
        <rect x={leftX}  y={traceY} width={traceWpx} height={traceTpx} fill="#dc2626" stroke="#7f1d1d" />
        <text x={leftX + traceWpx / 2} y={traceY - 4} text-anchor="middle" font-size="9" fill="#7f1d1d" font-family="ui-monospace, monospace">aggressor</text>

        <!-- victim (right) -->
        <rect x={rightX} y={traceY} width={traceWpx} height={traceTpx} fill="#0ea5e9" stroke="#075985" />
        <text x={rightX + traceWpx / 2} y={traceY - 4} text-anchor="middle" font-size="9" fill="#075985" font-family="ui-monospace, monospace">victim</text>

        <!-- coupling visual: arc with thickness proportional to coupling -->
        {#if ratio > 0.005}
          <path
            d={`M ${leftX + traceWpx + 1} ${traceY + traceTpx / 2}
                Q ${cx} ${traceY - 18 - ratio * 20}
                ${rightX - 1} ${traceY + traceTpx / 2}`}
            fill="none"
            stroke="#dc2626"
            stroke-width={Math.min(8, 1 + ratio * 16)}
            opacity="0.7"
          />
          <text x={cx} y={traceY - 24 - ratio * 14} text-anchor="middle" font-size="9" fill="#dc2626" font-family="ui-monospace, monospace">{pct < 1 ? pct.toFixed(2) : pct.toFixed(1)} % 커플</text>
        {/if}

        <!-- spacing dim -->
        <line x1={leftX + traceWpx} y1={traceY + traceTpx + 6} x2={rightX} y2={traceY + traceTpx + 6} stroke="#10b981" stroke-width="1.2" />
        <text x={cx} y={traceY + traceTpx + 18} text-anchor="middle" font-size="9" fill="#047857" font-family="ui-monospace, monospace">S = {sMil.toFixed(1)} mil</text>

        <!-- victim "spike" indicator (visual fun) -->
        {#if pct > 5}
          <line x1={rightX + traceWpx + 8} y1={traceY + traceTpx / 2} x2={rightX + traceWpx + 24} y2={traceY + traceTpx / 2 - ratio * 30} stroke="#0ea5e9" stroke-width="1.5" />
          <text x={rightX + traceWpx + 26} y={traceY + traceTpx / 2 - ratio * 30 - 2} font-size="9" fill="#075985" font-family="ui-monospace, monospace">spike!</text>
        {/if}
      </svg>
    </div>

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      <b>주의</b> — 이 식은 단순화된 정성 모델. 실 커플링은 트레이스 길이 · rise time · 끝단 임피던스에 따라 추가로 변합니다.
      "s/h" 가 의미 있는 1차 변수 — 단순히 "s/W" 가 아닙니다 (즉 plane 이 가까울수록 커플링도 줄어듭니다).
    </div>
  </div>
</div>
