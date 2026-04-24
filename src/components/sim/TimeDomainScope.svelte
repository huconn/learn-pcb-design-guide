<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as echarts from 'echarts';
  import Slider from './shared/Slider.svelte';
  import ChartCard from './shared/ChartCard.svelte';
  import { simulateTimeDomain } from '../../lib/pdn/timeDomain';
  import { MIX_PRESETS, LOAD_PRESETS, type NamedCap } from '../../lib/pdn/presets';

  let chartEl: HTMLDivElement;
  let chart: echarts.ECharts | null = null;

  let mixIdx = 2;
  let loadIdx = 1;
  let Vtarget = 3.3;

  $: mix = MIX_PRESETS[mixIdx].mix;
  $: loadSpec = LOAD_PRESETS[loadIdx];

  function totalFromMix(caps: { cap: NamedCap; count: number }[]) {
    let C = 0, L = Infinity, ESR = Infinity;
    for (const { cap, count } of caps) {
      C += cap.C * count;
      const Ltot = 1 / (count / cap.ESL);
      L = L === Infinity ? Ltot : 1 / (1 / L + 1 / Ltot);
      const ESRtot = cap.ESR / count;
      ESR = ESR === Infinity ? ESRtot : 1 / (1 / ESR + 1 / ESRtot);
    }
    if (caps.length === 0) return { C: 1e-12, L: 1e-6, ESR: 10 };
    return { C, L, ESR };
  }

  $: totals = totalFromMix(mix);

  $: result = simulateTimeDomain({
    Vtarget,
    Rvrm: 0.05,
    Lvrm: 500e-9,
    Ctotal: totals.C,
    ESRtotal: totals.ESR,
    loadCurrent: (t) => {
      const rise = loadSpec.rise;
      const t0 = 1e-6;
      if (t < t0) return 0;
      if (t < t0 + rise) return loadSpec.step * ((t - t0) / rise);
      return loadSpec.step;
    },
    dt: 10e-9,
    tMax: 8e-6,
  });

  $: vpp = (() => {
    const arr = Array.from(result.V);
    return (Math.max(...arr) - Math.min(...arr)) * 1000;
  })();

  function updateChart() {
    if (!chart) return;
    const tUs = Array.from(result.t).map((x) => x * 1e6);
    const V = Array.from(result.V);
    const I = Array.from(result.Iload);
    const axisColor = '#94a3b8';
    const splitColor = '#e2e8f0';
    const lineColor = '#cbd5e1';
    const nameColor = '#64748b';
    chart.setOption({
      animation: false,
      grid: [
        { top: 30, height: '45%', left: 56, right: 20 },
        { top: '62%', height: '28%', left: 56, right: 20 },
      ],
      xAxis: [
        { type: 'value', gridIndex: 0, name: '', axisLabel: { color: axisColor }, axisLine: { lineStyle: { color: lineColor } }, splitLine: { lineStyle: { color: splitColor } } },
        { type: 'value', gridIndex: 1, name: 't (μs)', nameTextStyle: { color: nameColor }, axisLabel: { color: axisColor }, axisLine: { lineStyle: { color: lineColor } }, splitLine: { lineStyle: { color: splitColor } } },
      ],
      yAxis: [
        { type: 'value', gridIndex: 0, name: 'Vdd (V)', nameTextStyle: { color: nameColor }, axisLabel: { color: axisColor }, axisLine: { lineStyle: { color: lineColor } }, splitLine: { lineStyle: { color: splitColor } }, scale: true },
        { type: 'value', gridIndex: 1, name: 'I_load (A)', nameTextStyle: { color: nameColor }, axisLabel: { color: axisColor }, axisLine: { lineStyle: { color: lineColor } }, splitLine: { lineStyle: { color: splitColor } } },
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        textStyle: { color: '#0f172a' },
      },
      series: [
        { type: 'line', xAxisIndex: 0, yAxisIndex: 0, showSymbol: false, data: tUs.map((t, i) => [t, V[i]]), lineStyle: { color: '#4f46e5', width: 1.5 } },
        { type: 'line', xAxisIndex: 1, yAxisIndex: 1, showSymbol: false, data: tUs.map((t, i) => [t, I[i]]), lineStyle: { color: '#f43f5e', width: 1.5 } },
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

  $: if (chart && result) updateChart();

  onDestroy(() => chart?.dispose());
</script>

<div class="not-prose space-y-4">
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-lg border border-slate-200 bg-white p-4">
    <label class="block">
      <span class="text-sm text-slate-700">프리셋 (cap 조합)</span>
      <select class="mt-1 w-full rounded border-slate-300" bind:value={mixIdx}>
        {#each MIX_PRESETS as p, i}
          <option value={i}>{p.name}</option>
        {/each}
      </select>
    </label>
    <label class="block">
      <span class="text-sm text-slate-700">Load step</span>
      <select class="mt-1 w-full rounded border-slate-300" bind:value={loadIdx}>
        {#each LOAD_PRESETS as p, i}
          <option value={i}>{p.name}</option>
        {/each}
      </select>
    </label>
    <Slider id="vtarget-td" label="V_target" bind:value={Vtarget} min={1.8} max={5.0} step={0.1} format={(v) => `${v.toFixed(1)} V`} />
    <div class="rounded bg-slate-50 p-2 text-sm">
      <div class="text-slate-500">현재 리플 (peak-peak)</div>
      <div class="font-mono text-lg text-indigo-700">{vpp.toFixed(1)} mV</div>
    </div>
  </div>

  <ChartCard title="Vdd · load current (time domain)" aria="Vdd 전압과 load 전류 시간영역 파형">
    <div bind:this={chartEl} class="h-[380px] w-full"></div>
  </ChartCard>
</div>
