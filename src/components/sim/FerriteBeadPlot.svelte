<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { echarts, type ECharts } from '../../lib/echarts/setup';
  import Slider from './shared/Slider.svelte';
  import ChartCard from './shared/ChartCard.svelte';
  import { ferriteSweep } from '../../lib/emi/ferrite';

  let chartEl: HTMLDivElement;
  let chart: ECharts | null = null;

  // Inputs (typical bead specs from Murata BLM series)
  let ZmaxOhm = 600;     // peak |Z|
  let fPeakMHz = 100;    // peak frequency
  let L_nH = 1000;       // inductance (lower freq)
  let C_pF = 1.5;        // parasitic shunt cap
  let Rdc_mohm = 50;     // DC resistance

  $: spec = { ZmaxOhm, fPeakMHz, L_nH, C_pF, Rdc_mohm };
  $: sweep = ferriteSweep(spec, 1e6, 1e9, 200);

  function updateChart() {
    if (!chart) return;
    const fs = Array.from(sweep.freqs);
    const z = fs.map((f, i) => [f, sweep.zMag[i]]);
    const r = fs.map((f, i) => [f, sweep.r[i]]);
    const x = fs.map((f, i) => [f, Math.abs(sweep.x[i])]);

    chart.setOption({
      animation: false,
      grid: { top: 28, bottom: 46, left: 60, right: 16 },
      xAxis: {
        type: 'log', name: 'Frequency (Hz)', nameLocation: 'middle', nameGap: 28,
        nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#cbd5e1' } }, splitLine: { lineStyle: { color: '#e2e8f0' } },
        min: 1e6, max: 1e9,
      },
      yAxis: {
        type: 'log', name: '|Z| (Ω)', nameTextStyle: { color: '#64748b' },
        axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
      },
      legend: { textStyle: { color: '#475569' }, top: 0 },
      tooltip: {
        trigger: 'axis', backgroundColor: '#fff', borderColor: '#e2e8f0',
        textStyle: { color: '#0f172a' },
        valueFormatter: (v: any) => `${Number(v).toFixed(1)} Ω`,
      },
      series: [
        { name: '|Z|',        type: 'line', showSymbol: false, lineStyle: { color: '#4f46e5', width: 2.5 }, data: z },
        { name: 'R (저항부)', type: 'line', showSymbol: false, lineStyle: { color: '#dc2626', width: 1.4, type: 'dashed' }, data: r },
        { name: '|X| (반응)', type: 'line', showSymbol: false, lineStyle: { color: '#0ea5e9', width: 1.4, type: 'dashed' }, data: x },
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
  $: if (chart && spec) updateChart();
  onDestroy(() => chart?.dispose());

  function preset(name: string) {
    if (name === 'BLM18BB') { ZmaxOhm = 600;  fPeakMHz = 100; L_nH = 1000; C_pF = 1.5; Rdc_mohm = 50; }
    if (name === 'BLM21PG') { ZmaxOhm = 1000; fPeakMHz = 100; L_nH = 1500; C_pF = 1.0; Rdc_mohm = 30; }
    if (name === 'BLM15HD') { ZmaxOhm = 220;  fPeakMHz = 100; L_nH = 350;  C_pF = 2.0; Rdc_mohm = 20; }
    if (name === 'wide')    { ZmaxOhm = 470;  fPeakMHz = 1000; L_nH = 80;   C_pF = 0.5; Rdc_mohm = 30; }
  }

  // Effectiveness summary
  $: zAt100 = sweep.zMag[Math.floor(sweep.freqs.length * Math.log10(100e6 / 1e6) / Math.log10(1e9 / 1e6))];
</script>

<div class="not-prose space-y-4">
  <div class="grid gap-3 lg:grid-cols-3 rounded-lg border border-slate-200 bg-white p-4">
    <div class="space-y-2">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Bead Spec</div>
      <Slider id="zm" label="Z_max"        bind:value={ZmaxOhm}   min={50}   max={3000} step={10}  format={(v) => `${v.toFixed(0)} Ω`} />
      <Slider id="fp" label="f_peak"       bind:value={fPeakMHz}  min={10}   max={2000} step={10}  format={(v) => `${v.toFixed(0)} MHz`} />
    </div>
    <div class="space-y-2">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Reactance / DC</div>
      <Slider id="ln" label="L (저주파)"   bind:value={L_nH}      min={50}   max={3000} step={10}  format={(v) => `${v.toFixed(0)} nH`} />
      <Slider id="cp" label="C (기생)"     bind:value={C_pF}      min={0.2}  max={5}    step={0.1} format={(v) => `${v.toFixed(1)} pF`} />
      <Slider id="rd" label="R_dc"         bind:value={Rdc_mohm}  min={5}    max={500}  step={5}   format={(v) => `${v.toFixed(0)} mΩ`} />
    </div>
    <div class="space-y-2">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">프리셋 (Murata 계열)</div>
      <div class="flex flex-wrap gap-1.5 text-sm">
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('BLM18BB')}>BLM18BB · 600Ω</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('BLM21PG')}>BLM21PG · 1kΩ</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('BLM15HD')}>BLM15HD · 220Ω</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('wide')}>광대역 (1 GHz)</button>
      </div>
      <div class="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
        @ 100 MHz: |Z| = <span class="text-slate-800">{zAt100?.toFixed(0)} Ω</span>
      </div>
    </div>
  </div>

  <ChartCard title="|Z(f)| · R · X — 페라이트 비드 임피던스" aria="Ferrite bead impedance vs frequency">
    <div bind:this={chartEl} class="h-[320px] w-full"></div>
  </ChartCard>

  <div class="text-[12px] text-slate-600 leading-relaxed">
    <b>해석</b>: <span class="font-mono text-rose-700">R (저항부)</span> 가 <span class="font-mono text-sky-700">|X| (반응부)</span> 보다 큰 영역이 <b>실제 잡음을 흡수</b> 하는 구간 (열로 손실). 반응부가 큰 영역에서는 잡음이 반사되어 시스템에 머무름. 페라이트 비드는 <b>R 이 큰 주파수 영역</b> 에서만 효과적.
  </div>
</div>
