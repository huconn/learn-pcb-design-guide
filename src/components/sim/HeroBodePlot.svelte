<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { echarts, type ECharts } from '../../lib/echarts/setup';
  import { capImpedance, parallelImpedance, magnitude, type Complex } from '../../lib/pdn/impedance';
  import { CAP_100NF, CAP_10UF, CAP_100UF_BULK } from '../../lib/pdn/presets';

  let chartEl: HTMLDivElement;
  let chart: ECharts | null = null;

  function vrmImpedance(freq: number): Complex {
    const Rvrm = 0.02, Lvrm = 500e-9;
    return { re: Rvrm, im: 2 * Math.PI * freq * Lvrm };
  }

  function build() {
    const freqs: number[] = [];
    for (let e = 1; e <= 9; e += 0.03) freqs.push(Math.pow(10, e));
    const total: number[] = [];
    const single: number[] = [];
    for (const f of freqs) {
      const bulk = capImpedance(CAP_100UF_BULK, f);
      const mid = capImpedance(CAP_10UF, f);
      const hf = parallelImpedance(Array(4).fill(capImpedance(CAP_100NF, f)));
      const vrm = vrmImpedance(f);
      total.push(magnitude(parallelImpedance([bulk, mid, hf, vrm])));
      single.push(magnitude(parallelImpedance([hf, vrm])));
    }
    return { freqs, total, single };
  }

  onMount(() => {
    const { freqs, total, single } = build();
    chart = echarts.init(chartEl);
    chart.setOption({
      animation: true,
      animationDuration: 1200,
      grid: { top: 20, bottom: 36, left: 52, right: 16 },
      xAxis: {
        type: 'log', min: 10, max: 1e9,
        name: 'frequency', nameLocation: 'middle', nameGap: 24,
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'log', name: '|Z| (Ω)',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
      },
      tooltip: { show: false },
      series: [
        {
          name: 'single',
          type: 'line', showSymbol: false,
          data: freqs.map((f, i) => [f, single[i]]),
          lineStyle: { color: '#f43f5e', width: 1.5, type: 'dashed' },
        },
        {
          name: 'recommended',
          type: 'line', showSymbol: false,
          data: freqs.map((f, i) => [f, total[i]]),
          lineStyle: { color: '#4f46e5', width: 2.5 },
          markLine: {
            symbol: 'none',
            data: [{ yAxis: 0.05, lineStyle: { color: '#059669', type: 'solid', width: 1.2 }, label: { color: '#059669', fontSize: 10, formatter: 'target 50 mΩ' } }],
          },
        },
      ],
    });
    const ro = new ResizeObserver(() => chart?.resize());
    ro.observe(chartEl);
    return () => ro.disconnect();
  });

  onDestroy(() => chart?.dispose());
</script>

<div bind:this={chartEl} class="h-full min-h-[220px] w-full"></div>
