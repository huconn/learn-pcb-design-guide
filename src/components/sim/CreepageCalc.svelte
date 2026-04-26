<script lang="ts">
  import Slider from './shared/Slider.svelte';
  import { creepageMm, clearanceMm, type PollutionDegree, type MaterialGroup, type IsolationGrade } from '../../lib/isolation/creepage';

  let workingV = 250;
  let pollution: PollutionDegree = 2;
  let material: MaterialGroup = 'II';
  let grade: IsolationGrade = 'basic';

  $: creep = creepageMm(workingV, pollution, material, grade);
  $: clear = clearanceMm(workingV, pollution, grade);
  $: offsetPx = Math.min(360, creep * 20);
  $: secX = 34 + offsetPx;
  $: labelX = 34 + offsetPx / 2 - 30;

  function preset(name: string) {
    if (name === 'mains-eu')   { workingV = 250; pollution = 2; material = 'II';   grade = 'reinforced'; }
    if (name === 'mains-us')   { workingV = 120; pollution = 2; material = 'II';   grade = 'reinforced'; }
    if (name === 'medical')    { workingV = 250; pollution = 2; material = 'II';   grade = 'reinforced'; }
    if (name === 'industrial') { workingV = 600; pollution = 3; material = 'IIIa'; grade = 'basic'; }
    if (name === 'bms-cell')   { workingV = 60;  pollution = 2; material = 'II';   grade = 'basic'; }
    if (name === 'rs485')      { workingV = 50;  pollution = 2; material = 'II';   grade = 'basic'; }
  }
</script>

<div class="not-prose grid gap-4 lg:grid-cols-[1fr_1.2fr]">
  <div class="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div>
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">조건</div>
    </div>

    <Slider id="vw" label="Working voltage (V_RMS)" bind:value={workingV} min={20} max={1500} step={10} format={(v) => `${v.toFixed(0)} V`} />

    <div>
      <div class="text-[12px] text-slate-500 mb-1">Pollution degree</div>
      <div class="flex gap-2 text-sm">
        {#each [1, 2, 3] as p}
          <button type="button"
            class={'flex-1 rounded-md border px-2.5 py-1.5 ' + (pollution === p
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
            on:click={() => (pollution = p as PollutionDegree)}>
            PD {p}
          </button>
        {/each}
      </div>
      <div class="mt-1 text-[11px] text-slate-500">
        PD1 = 깨끗 (밀폐) · PD2 = 일반 사무 · PD3 = 산업/먼지/습기
      </div>
    </div>

    <div>
      <div class="text-[12px] text-slate-500 mb-1">PCB 재료 그룹 (CTI)</div>
      <div class="flex gap-2 text-sm">
        {#each (['I', 'II', 'IIIa', 'IIIb'] as MaterialGroup[]) as m}
          <button type="button"
            class={'flex-1 rounded-md border px-2.5 py-1.5 text-[12px] ' + (material === m
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
            on:click={() => (material = m)}>
            {m}
          </button>
        {/each}
      </div>
      <div class="mt-1 text-[11px] text-slate-500">
        FR-4 보통 II (CTI 175–249). 고급 FR-4 = I. 페놀 / CEM = IIIa~b.
      </div>
    </div>

    <div>
      <div class="text-[12px] text-slate-500 mb-1">Isolation grade</div>
      <div class="flex gap-2 text-sm">
        {#each (['functional', 'basic', 'reinforced'] as IsolationGrade[]) as g}
          <button type="button"
            class={'flex-1 rounded-md border px-2.5 py-1.5 ' + (grade === g
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
            on:click={() => (grade = g)}>
            {g}
          </button>
        {/each}
      </div>
      <div class="mt-1 text-[11px] text-slate-500">
        Functional = 신호 격리만. Basic = 1중 안전. Reinforced = 2중 안전 (medical, mains).
      </div>
    </div>

    <div class="pt-3 border-t border-slate-100">
      <div class="text-[12px] text-slate-500 mb-2">프리셋</div>
      <div class="flex flex-wrap gap-1.5 text-sm">
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('mains-eu')}>EU 230V mains</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('mains-us')}>US 120V mains</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('medical')}>의료기기</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('industrial')}>산업 600V</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('bms-cell')}>BMS cell stack</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('rs485')}>RS-485</button>
      </div>
    </div>
  </div>

  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">필요한 거리 (IEC 60664-1)</div>
      <div class="font-mono text-[10px] text-slate-500">{grade}</div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-md border border-indigo-200 bg-indigo-50 p-3">
        <div class="font-mono text-[10px] tracking-widest text-indigo-700 uppercase">Creepage</div>
        <div class="text-3xl font-semibold font-mono text-indigo-700 mt-1">{creep.toFixed(2)} <span class="text-base text-indigo-500">mm</span></div>
        <div class="text-[11px] text-indigo-700 mt-1">표면 거리 (PCB 위)</div>
      </div>
      <div class="rounded-md border border-sky-200 bg-sky-50 p-3">
        <div class="font-mono text-[10px] tracking-widest text-sky-700 uppercase">Clearance</div>
        <div class="text-3xl font-semibold font-mono text-sky-700 mt-1">{clear.toFixed(2)} <span class="text-base text-sky-500">mm</span></div>
        <div class="text-[11px] text-sky-700 mt-1">공기 갭 (직선 거리)</div>
      </div>
    </div>

    <!-- Visual scale -->
    <div class="rounded-md border border-slate-200 bg-white p-3">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase mb-2">시각화 (스케일 비교)</div>
      <svg viewBox="0 0 400 80" class="w-full">
        <rect x="0" y="0" width="400" height="80" fill="#fff" />
        <!-- 1mm grid reference -->
        {#each Array(20).fill(0) as _, i}
          <line x1={i * 20} y1="60" x2={i * 20} y2="68" stroke="#cbd5e1" stroke-width="0.5" />
          {#if i % 5 === 0}
            <text x={i * 20 + 2} y="78" font-size="8" fill="#94a3b8" font-family="ui-monospace, monospace">{i} mm</text>
          {/if}
        {/each}
        <line x1="0" y1="60" x2="400" y2="60" stroke="#cbd5e1" />
        <!-- Conductor 1 -->
        <rect x="20" y="20" width="14" height="20" fill="#fbbf24" stroke="#92400e" />
        <text x="20" y="14" font-size="8" fill="#92400e" font-family="ui-monospace, monospace">PRI</text>
        <!-- Conductor 2 — placed at creep distance from conductor 1 -->
        <rect x={secX} y="20" width="14" height="20" fill="#60a5fa" stroke="#1e40af" />
        <text x={secX} y="14" font-size="8" fill="#1e40af" font-family="ui-monospace, monospace">SEC</text>
        <!-- Creepage line -->
        <line x1="34" y1="40" x2={secX} y2="40" stroke="#4f46e5" stroke-width="2" />
        <text x={labelX} y="55" font-size="9" fill="#4f46e5" font-family="ui-monospace, monospace">creepage = {creep.toFixed(2)} mm</text>
      </svg>
    </div>

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      <b>주의</b> — 위 값은 IEC 60664-1 의 단순화 lookup. 실 인증 (UL / IEC 60601 / IEC 60950 등) 은 더 엄격할 수 있음. 의료 / mains 제품은 인증 컨설턴트와 최종 확인.
    </div>
  </div>
</div>
