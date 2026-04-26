<script lang="ts">
  import Slider from './shared/Slider.svelte';
  import { FAB_TIERS, evaluateFit, type Design } from '../../lib/dfm/fabClasses';

  // Inputs — what the user's design REQUIRES
  let traceMil = 5;
  let spacingMil = 5;
  let drillMm = 0.3;
  let annularMil = 5;

  $: design = { trace: traceMil, spacing: spacingMil, drill: drillMm, annularRing: annularMil } as Design;
  $: results = FAB_TIERS.map((t) => evaluateFit(design, t));
  $: cheapestFit = results.find((r) => r.fits);

  function preset(name: 'arduino' | 'usb-hub' | 'ble-soc' | 'ddr') {
    if (name === 'arduino')   { traceMil = 10; spacingMil = 10; drillMm = 0.4; annularMil = 6; }
    if (name === 'usb-hub')   { traceMil = 5;  spacingMil = 5;  drillMm = 0.3; annularMil = 5; }
    if (name === 'ble-soc')   { traceMil = 4;  spacingMil = 4;  drillMm = 0.25;annularMil = 4; }
    if (name === 'ddr')       { traceMil = 3;  spacingMil = 3;  drillMm = 0.2; annularMil = 3; }
  }
</script>

<div class="not-prose grid gap-4 lg:grid-cols-[1fr_1.4fr]">
  <div class="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div>
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Your Design</div>
      <div class="mt-1 text-sm text-slate-600">디자인이 <b>요구하는 최소값</b> 을 입력하세요.</div>
    </div>

    <Slider id="tw" label="최소 트레이스 폭"   bind:value={traceMil}   min={2}   max={20} step={0.5} format={(v) => `${v.toFixed(1)} mil`} />
    <Slider id="ts" label="최소 트레이스 간격" bind:value={spacingMil} min={2}   max={20} step={0.5} format={(v) => `${v.toFixed(1)} mil`} />
    <Slider id="dr" label="최소 드릴 직경"     bind:value={drillMm}    min={0.1} max={1.0} step={0.05} format={(v) => `${v.toFixed(2)} mm`} />
    <Slider id="ar" label="최소 annular ring"  bind:value={annularMil} min={1}   max={10} step={0.5} format={(v) => `${v.toFixed(1)} mil`} />

    <div class="pt-3 border-t border-slate-100">
      <div class="text-[12px] text-slate-500 mb-2">프리셋</div>
      <div class="flex flex-wrap gap-1.5 text-sm">
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('arduino')}>Arduino 급</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('usb-hub')}>USB 허브</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('ble-soc')}>BLE SoC</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50" on:click={() => preset('ddr')}>DDR4 보드</button>
      </div>
    </div>
  </div>

  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Fab Compatibility</div>
      {#if cheapestFit}
        <div class="font-mono text-[10px] text-emerald-700">최저 비용: <b>{cheapestFit.tier.costFactor}</b></div>
      {:else}
        <div class="font-mono text-[10px] text-rose-700">호환되는 tier 없음 — 디자인 다시 검토</div>
      {/if}
    </div>

    <ul class="space-y-2">
      {#each results as r}
        <li class={'rounded-md border p-3 ' + (r.fits
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-slate-100 border-slate-200 opacity-60')}>
          <div class="flex items-baseline justify-between gap-3">
            <div>
              <div class="font-medium text-slate-900">{r.tier.name}</div>
              <div class="font-mono text-[11px] text-slate-500 mt-0.5">{r.tier.vendor} · {r.tier.costFactor}</div>
            </div>
            <div class={'font-mono text-[11px] tracking-widest uppercase ' + (r.fits ? 'text-emerald-700' : 'text-rose-700')}>
              {r.fits ? '✓ 적합' : '✗ 불가'}
            </div>
          </div>
          {#if !r.fits}
            <div class="mt-2 font-mono text-[11px] text-rose-700 space-y-0.5">
              {#each r.fails as f}<div>• {f}</div>{/each}
            </div>
          {/if}
        </li>
      {/each}
    </ul>

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      <b>실무 팁</b>:
      <ul class="list-disc pl-5 mt-1 space-y-0.5">
        <li>가능하면 <b>Economy tier</b> 안에서 설계 — 비용 최저, 양산 안정</li>
        <li>BGA 가 있다면 Precision tier 가 거의 필수 (BGA pitch 0.5 mm → 트레이스 4 mil 이하)</li>
        <li>Tier 가 올라갈수록 NRE / 시간 / 단가 모두 상승 — 먼저 prototype 만 advanced 로 찍고 양산은 economy 시도해보기</li>
        <li>같은 tier 라도 fab 마다 차이 — 견적 단계에서 capability sheet PDF 다운받아 직접 비교</li>
      </ul>
    </div>
  </div>
</div>
