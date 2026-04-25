<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { echarts, type ECharts } from '../../lib/echarts/setup';
  import Slider from './shared/Slider.svelte';
  import ChartCard from './shared/ChartCard.svelte';
  import { simulateCrosstalk } from '../../lib/si/crosstalkTime';
  import { crosstalkRatio } from '../../lib/pcb/crosstalk';

  let chartEl: HTMLDivElement;
  let chart: ECharts | null = null;

  // Inputs
  let Vs = 3.3;
  let tRiseNs = 0.5;
  let lengthCm = 5;       // coupled length
  let sMil = 8;           // edge-to-edge
  let hMil = 6;            // dielectric height

  const vProp = 1.5e8;     // m/s (FR4 microstrip ~0.5c)

  $: Td = (lengthCm / 100) / vProp;
  // Coupling coefficients from geometry (educational scaling)
  $: ratio = crosstalkRatio(sMil, hMil);
  $: Kb = ratio * 0.25;       // backward coupling (NEXT scale) — 0..0.25
  $: Kf = ratio * 0.5;        // forward (FEXT) effective scale per coupling event
  $: tMax = Math.max(8 * (Td + tRiseNs * 1e-9), 5e-9);
  $: dt = Math.max(tMax / 600, 5e-12);

  $: sim = simulateCrosstalk({ Vs, tRise: tRiseNs * 1e-9, Td, Kb, Kf, tMax, dt });

  function updateChart() {
    if (!chart) return;
    const toNs = (s: number) => s * 1e9;
    chart.setOption({
      animation: false,
      grid: { top: 30, bottom: 46, left: 56, right: 16 },
      xAxis: {
        type: 'value', name: 'time (ns)', nameLocation: 'middle', nameGap: 28,
        nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#cbd5e1' } }, splitLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value', name: 'V', nameTextStyle: { color: '#64748b' },
        axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
      },
      legend: { textStyle: { color: '#475569' }, top: 0 },
      tooltip: {
        trigger: 'axis', backgroundColor: '#fff', borderColor: '#e2e8f0',
        textStyle: { color: '#0f172a' },
        valueFormatter: (v: any) => `${(Number(v) * 1000).toFixed(1)} mV`,
      },
      series: [
        { name: 'Aggressor (driver)', type: 'line', showSymbol: false, lineStyle: { color: '#94a3b8', width: 1.5, type: 'dashed' },
          data: Array.from(sim.t).map((t, i) => [toNs(t), sim.vAggressor[i]]) },
        { name: 'NEXT (near-end)', type: 'line', showSymbol: false, lineStyle: { color: '#dc2626', width: 2 },
          data: Array.from(sim.t).map((t, i) => [toNs(t), sim.vNext[i]]) },
        { name: 'FEXT (far-end)',  type: 'line', showSymbol: false, lineStyle: { color: '#0ea5e9', width: 2 },
          data: Array.from(sim.t).map((t, i) => [toNs(t), sim.vFext[i]]) },
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
</script>

<div class="not-prose space-y-4">
  <div class="grid gap-3 lg:grid-cols-3 rounded-lg border border-slate-200 bg-white p-4">
    <div class="space-y-2">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Aggressor</div>
      <Slider id="vs"  label="Vs"     bind:value={Vs}      min={0.5} max={5}    step={0.1}  format={(v) => `${v.toFixed(1)} V`} />
      <Slider id="tr"  label="rise time" bind:value={tRiseNs} min={0.05} max={5} step={0.05} format={(v) => `${v.toFixed(2)} ns`} />
    </div>
    <div class="space-y-2">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Coupled length</div>
      <Slider id="ln"  label="length" bind:value={lengthCm} min={0.5} max={50}  step={0.1}  format={(v) => `${v.toFixed(1)} cm`} />
      <div class="text-[11px] font-mono text-slate-500">T_d = {(Td * 1e9).toFixed(2)} ns</div>
    </div>
    <div class="space-y-2">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Geometry</div>
      <Slider id="cs" label="S edge-to-edge" bind:value={sMil} min={1}  max={50} step={0.5} format={(v) => `${v.toFixed(1)} mil`} />
      <Slider id="ch" label="H plane"        bind:value={hMil} min={2}  max={20} step={0.5} format={(v) => `${v.toFixed(1)} mil`} />
      <div class="text-[11px] font-mono text-slate-500">Kb = {Kb.toFixed(3)} · Kf = {Kf.toFixed(3)}</div>
    </div>
  </div>

  <div class="grid gap-3 sm:grid-cols-2 text-sm">
    <div class="rounded-md border border-rose-200 bg-rose-50 p-3">
      <div class="font-mono text-[10px] tracking-widest text-rose-700 uppercase">NEXT peak</div>
      <div class="text-2xl font-semibold font-mono text-rose-800 mt-1">{Math.abs(sim.nextPeak * 1000).toFixed(1)} mV</div>
      <div class="text-[11px] text-rose-700 mt-1">근단(드라이버 측) victim 에 즉시 나타남. tRise 와 2·Td 중 큰 것 동안 유지.</div>
    </div>
    <div class="rounded-md border border-sky-200 bg-sky-50 p-3">
      <div class="font-mono text-[10px] tracking-widest text-sky-700 uppercase">FEXT peak</div>
      <div class="text-2xl font-semibold font-mono text-sky-800 mt-1">{Math.abs(sim.fextPeak * 1000).toFixed(1)} mV</div>
      <div class="text-[11px] text-sky-700 mt-1">원단(수신 측) victim 에 t = T_d 부근에 펄스로. 길이에 비례 / rise time 에 반비례.</div>
    </div>
  </div>

  <ChartCard title="Aggressor · NEXT · FEXT — 시간 영역 파형" aria="Crosstalk 시간영역">
    <div bind:this={chartEl} class="h-[300px] w-full"></div>
  </ChartCard>
</div>
