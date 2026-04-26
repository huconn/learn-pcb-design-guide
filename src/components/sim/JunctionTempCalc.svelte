<script lang="ts">
  import Slider from './shared/Slider.svelte';
  import { estimateThermal } from '../../lib/thermal/junction';

  let P_W = 1.0;
  let thetaJaBase = 60;     // °C/W — typical SOIC-8
  let Tambient = 25;
  let copperAreaSqIn = 0.5;
  let thermalVias = 4;
  let TjMaxAbs = 125;

  $: r = estimateThermal({ P_W, thetaJaBase, Tambient, copperAreaSqIn, thermalVias, TjMaxAbs });

  $: tier = (() => {
    const m = r.margin;
    if (m > 30)  return { label: '여유',   color: 'emerald', note: 'junction 한계 까지 30 °C 이상 마진' };
    if (m > 10)  return { label: '주의',   color: 'amber',   note: '마진 좁음 — 큰 ambient 변동 시 위험' };
    if (m > 0)   return { label: '경계',   color: 'rose',    note: '한계에 거의 닿음 — 추가 방열 필요' };
    return                     { label: '초과',   color: 'rose',    note: '한계 초과 — 즉시 방열 강화' };
  })();
  const tone: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber:   'bg-amber-50 border-amber-200 text-amber-800',
    rose:    'bg-rose-50 border-rose-200 text-rose-800',
  };
</script>

<div class="not-prose grid gap-4 lg:grid-cols-[1fr_1.2fr]">
  <div class="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div>
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">IC + 동작점</div>
    </div>
    <Slider id="p"   label="P · 전력 손실"      bind:value={P_W}          min={0.05} max={20}  step={0.05} format={(v) => `${v.toFixed(2)} W`} />
    <Slider id="ta"  label="T_a · 주변 온도"    bind:value={Tambient}     min={-20}  max={85}  step={1}    format={(v) => `${v.toFixed(0)} °C`} />
    <Slider id="th"  label="θ_JA (데이터시트)"  bind:value={thetaJaBase}  min={10}   max={250} step={1}    format={(v) => `${v.toFixed(0)} °C/W`} />
    <Slider id="tjm" label="T_j max (abs)"      bind:value={TjMaxAbs}     min={85}   max={175} step={5}    format={(v) => `${v.toFixed(0)} °C`} />

    <div class="pt-3 border-t border-slate-100 space-y-2">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">방열 강화</div>
      <Slider id="cu" label="동박 영역 (IC pad 연결)" bind:value={copperAreaSqIn} min={0} max={4} step={0.1} format={(v) => `${v.toFixed(1)} in²`} />
      <Slider id="vi" label="방열 비아 개수"             bind:value={thermalVias}    min={0} max={32} step={1} format={(v) => `${v.toFixed(0)} 개`} />
    </div>

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      <b>흔한 패키지의 θ_JA</b>: SOIC-8 ≈ 100, SOIC-16 ≈ 80, QFN exposed pad ≈ 30~50, TO-220 ≈ 60 (방열판 없을 때) °C/W.
    </div>
  </div>

  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Junction Temperature</div>
      <div class="font-mono text-[10px] text-slate-500">T_j = T_a + θ_JA_eff · P</div>
    </div>

    <div class="text-4xl font-semibold font-mono text-indigo-700">
      {r.Tj.toFixed(0)} <span class="text-2xl text-indigo-600">°C</span>
    </div>
    <div class="text-[12px] font-mono text-slate-500">
      θ_JA_eff = {r.thetaJaEff.toFixed(1)} °C/W (데이터시트 {thetaJaBase} → −{(thetaJaBase - r.thetaJaEff).toFixed(1)})
    </div>

    <div class={'rounded-md border p-3 ' + tone[tier.color]}>
      <div class="font-mono text-[10px] tracking-widest uppercase">판정 · {tier.label}</div>
      <div class="mt-0.5 text-sm">
        T_j_max 까지 마진 = <span class="font-mono">{r.margin.toFixed(0)} °C</span>. {tier.note}
      </div>
    </div>

    <!-- Bar visualization: T_a -> T_j -> T_j_max -->
    <div class="rounded-md border border-slate-200 bg-white p-3">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase mb-2">온도 스케일</div>
      <div class="relative h-8 rounded bg-gradient-to-r from-emerald-200 via-amber-200 to-rose-300 overflow-hidden">
        <div class="absolute inset-y-0 left-0 bg-emerald-100" style={`width: ${Math.max(0, Math.min(100, (Tambient / TjMaxAbs) * 100))}%`}></div>
        <div class="absolute inset-y-0 w-0.5 bg-slate-700" style={`left: ${Math.max(0, Math.min(100, (Tambient / TjMaxAbs) * 100))}%`} title="T_a"></div>
        <div class="absolute inset-y-0 w-1 bg-indigo-700" style={`left: ${Math.max(0, Math.min(100, (r.Tj / TjMaxAbs) * 100))}%`} title="T_j"></div>
      </div>
      <div class="mt-1 flex justify-between text-[10px] font-mono text-slate-500">
        <span>0 °C</span>
        <span>T_a = {Tambient.toFixed(0)}</span>
        <span class="text-indigo-700 font-semibold">T_j = {r.Tj.toFixed(0)}</span>
        <span>T_j_max = {TjMaxAbs.toFixed(0)}</span>
      </div>
    </div>

    <div class="pt-3 border-t border-slate-200">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase mb-1">안전 P_max (현재 방열 조건에서)</div>
      <div class="font-mono text-2xl text-slate-900">{(((TjMaxAbs - Tambient) / r.thetaJaEff)).toFixed(2)} W</div>
      <div class="font-mono text-[11px] text-slate-500">현재 P_W = {P_W.toFixed(2)} W → 이용률 {(r.derate < 1 ? r.derate : 1).toFixed(0) === '1' ? '100%+' : ((P_W * r.thetaJaEff) / (TjMaxAbs - Tambient) * 100).toFixed(0) + '%'}</div>
    </div>

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      <b>주의</b> — 모델은 IPC-2152 등 표준에 비해 단순화. 실 보드의 효과적 θ_JA 는 thermal sim 또는 실측으로 확인. 위 결과는 ±20 % 정도 정확도.
    </div>
  </div>
</div>
