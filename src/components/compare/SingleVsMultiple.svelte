<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { echarts, type ECharts } from '../../lib/echarts/setup';
  import { capImpedance, parallelImpedance, magnitude, type Complex } from '../../lib/pdn/impedance';
  import { CAP_100NF, CAP_10UF, CAP_100UF_BULK } from '../../lib/pdn/presets';

  let leftEl: HTMLDivElement;
  let rightEl: HTMLDivElement;
  let leftChart: ECharts | null = null;
  let rightChart: ECharts | null = null;

  function vrm(f: number): Complex {
    return { re: 0.02, im: 2 * Math.PI * f * 500e-9 };
  }

  function axisConfig(name: string, log = true) {
    return {
      type: log ? 'log' : 'value',
      name,
      nameTextStyle: { color: '#64748b', fontSize: 10 },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
    };
  }

  function buildSingle() {
    const freqs: number[] = [];
    for (let e = 1; e <= 9; e += 0.03) freqs.push(Math.pow(10, e));
    const total = freqs.map((f) => magnitude(parallelImpedance([capImpedance(CAP_100NF, f), vrm(f)])));
    return { freqs, total };
  }
  function buildMulti() {
    const freqs: number[] = [];
    for (let e = 1; e <= 9; e += 0.03) freqs.push(Math.pow(10, e));
    const total = freqs.map((f) => magnitude(parallelImpedance([
      capImpedance(CAP_100UF_BULK, f),
      capImpedance(CAP_10UF, f),
      parallelImpedance(Array(4).fill(capImpedance(CAP_100NF, f))),
      vrm(f),
    ])));
    return { freqs, total };
  }

  function chartOption(freqs: number[], total: number[], color: string) {
    return {
      animation: true,
      grid: { top: 20, bottom: 40, left: 52, right: 14 },
      xAxis: { ...axisConfig('freq (Hz)'), min: 10, max: 1e9, nameGap: 22 },
      yAxis: axisConfig('|Z| (Ω)'),
      tooltip: { trigger: 'axis', backgroundColor: '#ffffff', borderColor: '#e2e8f0', textStyle: { color: '#0f172a' }, valueFormatter: (v: any) => `${(v * 1000).toFixed(1)} mΩ` },
      series: [{
        type: 'line', showSymbol: false, data: freqs.map((f, i) => [f, total[i]]),
        lineStyle: { color, width: 2.2 },
        markLine: {
          symbol: 'none',
          data: [{ yAxis: 0.05, lineStyle: { color: '#059669', type: 'solid', width: 1.2 }, label: { color: '#059669', fontSize: 10, formatter: 'target 50 mΩ' } }],
        },
      }],
    };
  }

  onMount(() => {
    const s = buildSingle();
    const m = buildMulti();
    leftChart = echarts.init(leftEl);
    rightChart = echarts.init(rightEl);
    leftChart.setOption(chartOption(s.freqs, s.total, '#f43f5e'));
    rightChart.setOption(chartOption(m.freqs, m.total, '#4f46e5'));
    const ro = new ResizeObserver(() => { leftChart?.resize(); rightChart?.resize(); });
    ro.observe(leftEl); ro.observe(rightEl);
    return () => ro.disconnect();
  });

  onDestroy(() => { leftChart?.dispose(); rightChart?.dispose(); });
</script>

<div class="not-prose grid gap-4 lg:grid-cols-2">
  <div class="rounded-lg border border-rose-200 bg-rose-50/30 p-4">
    <div class="mb-2 flex items-baseline justify-between">
      <span class="font-mono text-[10px] tracking-widest text-rose-700">SINGLE CAPACITOR</span>
      <span class="font-mono text-[10px] text-rose-700">100 nF × 1</span>
    </div>
    <div bind:this={leftEl} class="h-[220px] w-full"></div>
    <p class="mt-3 text-sm text-slate-700">한 값만 쓰면 SRF 근처에서는 낮지만 그 밖에선 타겟 위로 솟음. 저주파·고주파 모두 커버 불가.</p>
  </div>
  <div class="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
    <div class="mb-2 flex items-baseline justify-between">
      <span class="font-mono text-[10px] tracking-widest text-indigo-700">MULTIPLE CAPACITORS</span>
      <span class="font-mono text-[10px] text-indigo-600">100μF + 10μF + 100nF×4</span>
    </div>
    <div bind:this={rightEl} class="h-[220px] w-full"></div>
    <p class="mt-3 text-sm text-slate-700">여러 값을 섞으면 전 주파수에서 임피던스가 고르게 낮아짐. 타겟선 아래 유지.</p>
  </div>
</div>
