<script lang="ts">
  import Slider from './shared/Slider.svelte';
  import { solveMosfetThermal } from '../../lib/bms/mosfetThermal';

  let current = 30;          // A
  let rds25_mohm = 2.5;
  let alphaPctPerC = 0.5;
  let numParallel = 1;
  let numSeries = 2;         // back-to-back default
  let thetaJA = 40;          // °C/W
  let Tambient = 40;
  let TjMaxAbs = 175;

  $: r = solveMosfetThermal({ current, rds25_mohm, alphaPctPerC, numParallel, numSeries, thetaJA, Tambient, TjMaxAbs });

  $: tier = (() => {
    if (r.runaway || r.Tj > TjMaxAbs)         return { label: '런어웨이/초과', color: 'rose',    note: '발열 > 방열. FET 추가 또는 R_DS 낮춤 / θ 줄여야 함' };
    if (r.margin < 15)                         return { label: '마진 부족',    color: 'rose',    note: '한계 거의 닿음. 안전 마진 30 °C 이상 권장' };
    if (r.margin < 40)                         return { label: '주의',         color: 'amber',   note: 'ambient 변동 / 일시 과부하 대비 마진 적음' };
    return                                            { label: '여유',         color: 'emerald', note: '안전 동작 영역' };
  })();
  const tone: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber:   'bg-amber-50 border-amber-200 text-amber-800',
    rose:    'bg-rose-50 border-rose-200 text-rose-800',
  };

  function preset(name: string) {
    if (name === 'small-bms') { current = 10; rds25_mohm = 8;  numParallel = 1; numSeries = 2; thetaJA = 60;  Tambient = 25; }
    if (name === 'ebike')     { current = 30; rds25_mohm = 2.5; numParallel = 1; numSeries = 2; thetaJA = 40;  Tambient = 40; }
    if (name === 'ev-pack')   { current = 100; rds25_mohm = 1.2; numParallel = 4; numSeries = 2; thetaJA = 25; Tambient = 50; }
    if (name === 'load-sw')   { current = 5;  rds25_mohm = 5;   numParallel = 1; numSeries = 1; thetaJA = 80;  Tambient = 40; }
  }

  function fmt(v: number, unit: string, prec = 1) { return `${v.toFixed(prec)} ${unit}`; }
</script>

<div class="not-prose grid gap-4 lg:grid-cols-[1fr_1.2fr]">
  <div class="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div>
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">동작점</div>
    </div>
    <Slider id="i"   label="I · 연속 전류"        bind:value={current}     min={0.5} max={300} step={0.5} format={(v) => fmt(v, 'A', 1)} />
    <Slider id="ta"  label="T_a · ambient"         bind:value={Tambient}    min={-20} max={85}  step={1}   format={(v) => fmt(v, '°C', 0)} />

    <div class="pt-3 border-t border-slate-100 space-y-2">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">MOSFET</div>
      <Slider id="r25" label="R_DS(on) @ 25°C"     bind:value={rds25_mohm}  min={0.2} max={50}  step={0.1} format={(v) => fmt(v, 'mΩ', 2)} />
      <Slider id="al"  label="α (R_DS 온도계수)"    bind:value={alphaPctPerC} min={0.1} max={1.5} step={0.05} format={(v) => fmt(v, '%/°C', 2)} />
      <Slider id="th"  label="θ_JA (효과적 값)"    bind:value={thetaJA}     min={5}   max={200} step={1}   format={(v) => fmt(v, '°C/W', 0)} />
      <Slider id="tjm" label="T_j max (abs)"        bind:value={TjMaxAbs}    min={125} max={175} step={5}   format={(v) => fmt(v, '°C', 0)} />
    </div>

    <div class="pt-3 border-t border-slate-100 space-y-2">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">토폴로지</div>
      <div>
        <div class="text-[12px] text-slate-500 mb-1">Series (도통 경로 안 FET 개수)</div>
        <div class="flex gap-2 text-sm">
          {#each [1, 2] as n}
            <button type="button"
              class={'flex-1 rounded-md border px-2.5 py-1.5 ' + (numSeries === n
                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
              on:click={() => (numSeries = n)}>
              {n === 1 ? '1 (단일 스위치)' : '2 (back-to-back)'}
            </button>
          {/each}
        </div>
      </div>
      <Slider id="np" label="Parallel (병렬 FET 개수)" bind:value={numParallel} min={1} max={8} step={1} format={(v) => fmt(v, '개', 0)} />
    </div>

    <div class="pt-3 border-t border-slate-100">
      <div class="text-[12px] text-slate-500 mb-2">프리셋</div>
      <div class="flex flex-wrap gap-1.5 text-sm">
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('small-bms')}>휴대 BMS</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('ebike')}>e-bike 30A</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('ev-pack')}>EV 100A</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('load-sw')}>Load switch</button>
      </div>
    </div>
  </div>

  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Junction Temperature (FET 한 개)</div>
      <div class="font-mono text-[10px] text-slate-500">iterative R_DS(T) feedback</div>
    </div>

    <div class="text-4xl font-semibold font-mono text-indigo-700">
      {r.Tj.toFixed(0)} <span class="text-2xl text-indigo-600">°C</span>
      {#if !r.converged && !r.runaway}
        <span class="text-base text-amber-600 font-normal ml-2">(미수렴)</span>
      {/if}
      {#if r.runaway}
        <span class="text-base text-rose-600 font-normal ml-2">(RUNAWAY)</span>
      {/if}
    </div>

    <div class={'rounded-md border p-3 ' + tone[tier.color]}>
      <div class="font-mono text-[10px] tracking-widest uppercase">판정 · {tier.label}</div>
      <div class="mt-0.5 text-sm">
        T_j_max 마진 = <span class="font-mono">{r.margin.toFixed(0)} °C</span>. {tier.note}
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
      <div>
        <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">P / FET</div>
        <div class="font-mono text-xl text-slate-900">{r.Pper.toFixed(2)} W</div>
      </div>
      <div>
        <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">P 총합 (경로)</div>
        <div class="font-mono text-xl text-slate-900">{r.Ptotal.toFixed(2)} W</div>
      </div>
      <div>
        <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">R_DS @ T_j</div>
        <div class="font-mono text-xl text-slate-900">{r.Rper_mohm.toFixed(2)} mΩ</div>
      </div>
      <div>
        <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">경로 IR drop</div>
        <div class="font-mono text-xl text-slate-900">{r.Vdrop_mV.toFixed(0)} mV</div>
      </div>
    </div>

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      <b>해석</b> — R_DS 가 T_j 따라 올라가면 P 도 올라가서 더 뜨거워지는 양성 피드백. 솔버가 수렴해야 안정 운전. <b>RUNAWAY</b> = 방열 부족으로 발산 → 즉시 FET 추가 / R_DS 더 낮은 부품 / θ_JA 개선.
    </div>
  </div>
</div>
