<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { echarts, type ECharts } from '../../lib/echarts/setup';
  import Slider from './shared/Slider.svelte';
  import ChartCard from './shared/ChartCard.svelte';
  import { simulateReflections, gamma } from '../../lib/si/reflection';

  let chartEl: HTMLDivElement;
  let chart: ECharts | null = null;

  // Inputs
  let Zs = 10;            // driver source impedance (Ω)
  let Z0 = 50;            // line Z0 (Ω)
  let ZLsel: 'match' | 'open' | 'short' | 'custom' = 'custom';
  let ZLcustom = 10000;   // custom load impedance (Ω)
  let lengthCm = 20;      // trace length (cm)
  let tRiseNs = 0.5;      // driver rise time (ns)

  const vProp = 1.5e8;    // m/s — ~0.5c typical for PCB FR4

  $: ZL = ZLsel === 'match' ? Z0
         : ZLsel === 'open'  ? Infinity
         : ZLsel === 'short' ? 0
         : ZLcustom;

  $: Td = (lengthCm / 100) / vProp;                // one-way delay in s
  $: tMax = Math.max(10 * Td, 20e-9);
  $: dt = Math.max(tMax / 500, 5e-12);

  $: sim = simulateReflections({
    Vs: 3.3, Zs, Z0, ZL, Td, tRise: tRiseNs * 1e-9, tMax, dt,
  });

  $: gS = gamma(Zs, Z0);
  $: gL = gamma(ZL, Z0);

  function updateChart() {
    if (!chart) return;
    const toNs = (s: number) => s * 1e9;
    const src = Array.from(sim.t).map((t, i) => [toNs(t), sim.vSource[i]]);
    const load = Array.from(sim.t).map((t, i) => [toNs(t), sim.vLoad[i]]);

    chart.setOption({
      animation: false,
      grid: { top: 30, bottom: 46, left: 56, right: 16 },
      xAxis: {
        type: 'value',
        name: 'time (ns)',
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: { color: '#64748b' },
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        name: 'V',
        nameTextStyle: { color: '#64748b' },
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
      },
      legend: { textStyle: { color: '#475569' }, top: 0 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        textStyle: { color: '#0f172a' },
        valueFormatter: (v: any) => `${Number(v).toFixed(2)} V`,
      },
      series: [
        {
          name: 'V at source',
          type: 'line', showSymbol: false,
          lineStyle: { color: '#4f46e5', width: 2 },
          data: src,
        },
        {
          name: 'V at load',
          type: 'line', showSymbol: false,
          lineStyle: { color: '#f43f5e', width: 2 },
          data: load,
          markLine: {
            symbol: 'none',
            data: [{ yAxis: 3.3, lineStyle: { color: '#059669', type: 'dashed', width: 1 }, label: { color: '#059669', formatter: 'Vs = 3.3 V' } }],
          },
        },
      ],
    });
  }

  onMount(() => {
    chart = echarts.init(chartEl);
    updateChart();
    const ro = new ResizeObserver(() => chart?.resize());
    ro.observe(chartEl);
    return () => ro.disconnect();
  });

  $: if (chart && sim) updateChart();

  onDestroy(() => chart?.dispose());

  function fmtZ(z: number) { return isFinite(z) ? `${z.toFixed(0)} Ω` : '∞ (open)'; }
  function fmtG(g: number) { return g >= 0 ? `+${g.toFixed(2)}` : g.toFixed(2); }

  $: verdict = (() => {
    const ag = Math.max(Math.abs(gS), Math.abs(gL));
    if (ag < 0.1)  return { label: '우수',   color: 'emerald', note: '반사 거의 없음 · 매칭 상태' };
    if (ag < 0.3)  return { label: '양호',   color: 'sky',     note: '경미한 반사 · 대부분 OK' };
    if (ag < 0.6)  return { label: '주의',   color: 'amber',   note: '반사 눈에 띔 · ring/overshoot 가능' };
    return                { label: '불량',   color: 'rose',    note: '강한 반사 · termination 필요' };
  })();

  const tone: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' },
    sky:     { bg: 'bg-sky-50',     border: 'border-sky-200',     text: 'text-sky-800' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800' },
    rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-800' },
  };

  $: v = tone[verdict.color];

  function presetMatch()    { Zs = 50;  ZLsel = 'match';  }
  function presetOpen()     { Zs = 10;  ZLsel = 'open';   }
  function presetShort()    { Zs = 10;  ZLsel = 'short';  }
  function presetSeries()   { Zs = 50;  ZLsel = 'open';   }  // source-series termination
  function presetCmos()     { Zs = 10;  ZLsel = 'custom'; ZLcustom = 10000; }
</script>

<div class="not-prose space-y-4">
  <div class="grid gap-3 lg:grid-cols-[1fr_1fr_1fr] rounded-lg border border-slate-200 bg-white p-4">
    <div class="space-y-2">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Driver & Line</div>
      <Slider id="zs"  label="Zs (driver)"   bind:value={Zs}       min={1}   max={200} step={1}   format={(v) => `${v.toFixed(0)} Ω`} />
      <Slider id="z0"  label="Z₀ (line)"     bind:value={Z0}       min={25}  max={120} step={1}   format={(v) => `${v.toFixed(0)} Ω`} />
      <Slider id="len" label="length"        bind:value={lengthCm} min={1}   max={100} step={0.5} format={(v) => `${v.toFixed(1)} cm`} />
      <Slider id="tr"  label="rise time"     bind:value={tRiseNs}  min={0.05} max={5}  step={0.05} format={(v) => `${v.toFixed(2)} ns`} />
    </div>

    <div class="space-y-2">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Load</div>
      <div class="flex flex-wrap gap-1.5 text-sm">
        {#each [['match','Match','Z₀'], ['open','Open','∞'], ['short','Short','0'], ['custom','Custom','—']] as [val,label,hint]}
          <button type="button"
            class={'rounded-md border px-2.5 py-1 ' + (ZLsel === val
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
            on:click={() => (ZLsel = val as any)}>
            <span class="font-medium">{label}</span>
            <span class="ml-1 font-mono text-[11px] text-slate-500">{hint}</span>
          </button>
        {/each}
      </div>
      {#if ZLsel === 'custom'}
        <Slider id="zlc" label="Z_L (custom)" bind:value={ZLcustom} min={1} max={20000} step={1} format={(v) => `${v >= 1000 ? (v/1000).toFixed(1)+' kΩ' : v.toFixed(0)+' Ω'}`} />
      {/if}
      <div class="pt-2 border-t border-slate-100 space-y-1 text-[11px] font-mono text-slate-500">
        <div>T_d (one-way) = <span class="text-slate-800">{(Td * 1e9).toFixed(2)} ns</span></div>
        <div>Z_L = <span class="text-slate-800">{fmtZ(ZL)}</span></div>
        <div>Γ_s = <span class="text-indigo-700">{fmtG(gS)}</span> · Γ_L = <span class="text-rose-700">{fmtG(gL)}</span></div>
      </div>
    </div>

    <div class="space-y-2">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Presets</div>
      <div class="flex flex-wrap gap-1.5 text-sm">
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50" on:click={presetMatch}>이상적 매칭</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50" on:click={presetCmos}>무처리 CMOS</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50" on:click={presetSeries}>Series 종단</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50" on:click={presetOpen}>최악 — open</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50" on:click={presetShort}>최악 — short</button>
      </div>
      <div class={'rounded-md border p-2 ' + v.bg + ' ' + v.border}>
        <div class={'font-mono text-[10px] tracking-widest uppercase ' + v.text}>판정 · {verdict.label}</div>
        <div class={'mt-0.5 text-xs ' + v.text}>{verdict.note}</div>
      </div>
    </div>
  </div>

  <ChartCard title="Step response at source & load" aria="반사 시간영역 파형">
    <div bind:this={chartEl} class="h-[320px] w-full"></div>
  </ChartCard>
</div>
