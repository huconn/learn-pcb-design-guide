<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as echarts from 'echarts';
  import ChartCard from './shared/ChartCard.svelte';
  import Slider from './shared/Slider.svelte';
  import { capImpedance, parallelImpedance, magnitude, type Cap, type Complex } from '../../lib/pdn/impedance';
  import { CAP_100NF, CAP_10UF, CAP_100UF_BULK } from '../../lib/pdn/presets';

  let chartEl: HTMLDivElement;
  let chart: echarts.ECharts | null = null;

  let onBulk = true, onMid = true, onHf = true;
  let nMid = 1, nHf = 4;
  let Ztarget = 0.05;

  // Per-cap ESR/ESL tuning overrides
  let bulkESR = CAP_100UF_BULK.ESR;
  let bulkESL = CAP_100UF_BULK.ESL;
  let midESR  = CAP_10UF.ESR;
  let midESL  = CAP_10UF.ESL;
  let hfESR   = CAP_100NF.ESR;
  let hfESL   = CAP_100NF.ESL;

  function reset() {
    onBulk = true; onMid = true; onHf = true;
    nMid = 1; nHf = 4;
    Ztarget = 0.05;
    bulkESR = CAP_100UF_BULK.ESR; bulkESL = CAP_100UF_BULK.ESL;
    midESR  = CAP_10UF.ESR;       midESL  = CAP_10UF.ESL;
    hfESR   = CAP_100NF.ESR;      hfESL   = CAP_100NF.ESL;
  }

  function vrmImpedance(freq: number): Complex {
    const Rvrm = 0.02, Lvrm = 500e-9;
    return { re: Rvrm, im: 2 * Math.PI * freq * Lvrm };
  }

  function buildCurves() {
    const freqs: number[] = [];
    for (let e = 1; e <= 9; e += 0.02) freqs.push(Math.pow(10, e));

    const bulkCap: Cap = { C: CAP_100UF_BULK.C, ESL: bulkESL, ESR: bulkESR };
    const midCap:  Cap = { C: CAP_10UF.C,       ESL: midESL,  ESR: midESR };
    const hfCap:   Cap = { C: CAP_100NF.C,      ESL: hfESL,   ESR: hfESR };

    const bulkLine: number[] = [];
    const midLine: number[] = [];
    const hfLine: number[] = [];
    const totalLine: number[] = [];
    const vrmLine: number[] = [];

    for (const f of freqs) {
      const zs: Complex[] = [];
      const bulkZ = capImpedance(bulkCap, f);
      const midZ = parallelImpedance(Array(Math.max(nMid, 1)).fill(capImpedance(midCap, f)));
      const hfZ = parallelImpedance(Array(Math.max(nHf, 1)).fill(capImpedance(hfCap, f)));
      const vrmZ = vrmImpedance(f);

      if (onBulk) zs.push(bulkZ);
      if (onMid && nMid > 0) zs.push(midZ);
      if (onHf && nHf > 0) zs.push(hfZ);
      zs.push(vrmZ);

      bulkLine.push(magnitude(bulkZ));
      midLine.push(magnitude(midZ));
      hfLine.push(magnitude(hfZ));
      vrmLine.push(magnitude(vrmZ));
      totalLine.push(magnitude(parallelImpedance(zs)));
    }
    return { freqs, bulkLine, midLine, hfLine, vrmLine, totalLine };
  }

  function findPeaks(freqs: number[], mags: number[]) {
    const peaks: { f: number; z: number }[] = [];
    for (let i = 2; i < mags.length - 2; i++) {
      if (mags[i] > mags[i - 1] && mags[i] > mags[i + 1] && mags[i] > mags[i - 2] && mags[i] > mags[i + 2]) {
        if (mags[i] > Ztarget * 0.8) peaks.push({ f: freqs[i], z: mags[i] });
      }
    }
    peaks.sort((a, b) => b.z - a.z);
    return peaks.slice(0, 2);
  }

  function updateChart() {
    if (!chart) return;
    const { freqs, bulkLine, midLine, hfLine, vrmLine, totalLine } = buildCurves();
    const peaks = findPeaks(freqs, totalLine);

    chart.setOption({
      animation: false,
      grid: { top: 30, bottom: 56, left: 58, right: 20 },
      xAxis: {
        type: 'log',
        name: 'frequency (Hz)',
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: { color: '#64748b' },
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
        min: 10,
        max: 1e9,
      },
      yAxis: {
        type: 'log',
        name: '|Z| (Ω)',
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
        valueFormatter: (v: any) => `${(v * 1000).toFixed(2)} mΩ`,
      },
      series: [
        { name: 'Bulk 100μF', type: 'line', showSymbol: false, lineStyle: { color: '#059669', type: 'dashed', width: 1 }, data: freqs.map((f, i) => [f, bulkLine[i]]) },
        { name: `10μF × ${nMid}`, type: 'line', showSymbol: false, lineStyle: { color: '#8b5cf6', type: 'dashed', width: 1 }, data: freqs.map((f, i) => [f, midLine[i]]) },
        { name: `100nF × ${nHf}`, type: 'line', showSymbol: false, lineStyle: { color: '#0ea5e9', type: 'dashed', width: 1 }, data: freqs.map((f, i) => [f, hfLine[i]]) },
        { name: 'VRM', type: 'line', showSymbol: false, lineStyle: { color: '#94a3b8', type: 'dashed', width: 1 }, data: freqs.map((f, i) => [f, vrmLine[i]]) },
        {
          name: 'Total (합성)',
          type: 'line',
          showSymbol: false,
          lineStyle: { color: '#4f46e5', width: 2.5 },
          data: freqs.map((f, i) => [f, totalLine[i]]),
          markLine: {
            symbol: 'none',
            data: [{ yAxis: Ztarget, lineStyle: { color: '#059669', type: 'solid', width: 1.5 }, label: { color: '#059669', formatter: `타겟 ${(Ztarget * 1000).toFixed(0)} mΩ` } }],
          },
          markPoint: {
            symbol: 'pin',
            symbolSize: 40,
            itemStyle: { color: '#f43f5e' },
            label: { color: '#fff', fontSize: 10, formatter: ({ data }: any) => `${data.coord[1] * 1000 >= 1 ? (data.coord[1] * 1000).toFixed(0) + 'm' : (data.coord[1] * 1e6).toFixed(0) + 'μ'}Ω` },
            data: peaks.map((p) => ({ coord: [p.f, p.z], name: 'anti-resonance' })),
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

  $: if (chart) updateChart();
  $: [onBulk, onMid, onHf, nMid, nHf, Ztarget, bulkESR, bulkESL, midESR, midESL, hfESR, hfESL];

  onDestroy(() => chart?.dispose());

  function fmtESR(v: number) { return `${(v * 1000).toFixed(1)} mΩ`; }
  function fmtESL(v: number) { return `${(v * 1e9).toFixed(2)} nH`; }
</script>

<div class="not-prose space-y-4">
  <!-- Row 1: group toggles + target Z -->
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-lg border border-slate-200 bg-white p-4">
    <label class="flex items-center gap-2">
      <input type="checkbox" class="accent-emerald-600" bind:checked={onBulk} />
      <span class="text-sm">Bulk 100 μF</span>
    </label>
    <div class="flex items-center gap-2">
      <label class="flex items-center gap-2">
        <input type="checkbox" class="accent-violet-600" bind:checked={onMid} />
        <span class="text-sm">10 μF ×</span>
      </label>
      <input type="number" min="0" max="8" step="1" class="w-16 rounded border-slate-300" bind:value={nMid} aria-label="10 μF cap count" />
    </div>
    <div class="flex items-center gap-2">
      <label class="flex items-center gap-2">
        <input type="checkbox" class="accent-sky-600" bind:checked={onHf} />
        <span class="text-sm">100 nF ×</span>
      </label>
      <input type="number" min="0" max="16" step="1" class="w-16 rounded border-slate-300" bind:value={nHf} aria-label="100 nF cap count" />
    </div>
    <Slider id="ztarget" label="타겟 임피던스" bind:value={Ztarget} min={0.01} max={0.5} step={0.005} format={(v) => `${(v * 1000).toFixed(0)} mΩ`} />
  </div>

  <!-- Row 2: ESR/ESL tuning -->
  <details class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
    <summary class="cursor-pointer select-none font-medium text-slate-700 hover:text-slate-900 list-none flex items-center justify-between">
      <span class="flex items-center gap-2">
        <span class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Advanced</span>
        <span>ESR · ESL 튜닝</span>
      </span>
      <span class="text-slate-400 text-sm">▼</span>
    </summary>
    <div class="mt-3 flex justify-end">
      <button type="button" class="font-mono text-[11px] text-slate-500 hover:text-slate-900 underline" on:click={reset}>reset</button>
    </div>
    <div class="mt-2 grid gap-4 sm:grid-cols-3">
      <div class="space-y-2">
        <div class="font-mono text-[10px] tracking-widest text-emerald-700 uppercase">Bulk 100μF</div>
        <Slider id="bulk-esr" label="ESR"  bind:value={bulkESR} min={0.001} max={0.05}  step={0.001}  format={fmtESR} />
        <Slider id="bulk-esl" label="ESL"  bind:value={bulkESL} min={0.5e-9} max={10e-9} step={0.1e-9} format={fmtESL} />
      </div>
      <div class="space-y-2">
        <div class="font-mono text-[10px] tracking-widest text-violet-700 uppercase">10 μF</div>
        <Slider id="mid-esr" label="ESR"  bind:value={midESR}  min={0.001} max={0.05}  step={0.001}  format={fmtESR} />
        <Slider id="mid-esl" label="ESL"  bind:value={midESL}  min={0.2e-9} max={5e-9}  step={0.1e-9} format={fmtESL} />
      </div>
      <div class="space-y-2">
        <div class="font-mono text-[10px] tracking-widest text-sky-700 uppercase">100 nF</div>
        <Slider id="hf-esr" label="ESR"  bind:value={hfESR}   min={0.001} max={0.05}  step={0.001}  format={fmtESR} />
        <Slider id="hf-esl" label="ESL"  bind:value={hfESL}   min={0.1e-9} max={3e-9}  step={0.05e-9} format={fmtESL} />
      </div>
    </div>
  </details>

  <ChartCard title="PDN |Z(f)| · Bode plot · markers = anti-resonance" aria="PDN 임피던스 주파수 응답">
    <div bind:this={chartEl} class="h-[420px] w-full"></div>
  </ChartCard>
</div>
