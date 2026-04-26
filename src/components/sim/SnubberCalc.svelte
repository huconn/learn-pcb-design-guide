<script lang="ts">
  import Slider from './shared/Slider.svelte';
  import { designSnubber } from '../../lib/buck/snubber';

  let fRingMHz = 100;
  let CparPF = 50;
  let Vin = 12;
  let fswKHz = 500;

  $: r = designSnubber({ fRingMHz, CparPF, Vin, fswKHz });

  // Snap to E12 / standard
  const stdR = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82, 100];
  const stdC = [10, 22, 33, 47, 100, 220, 470, 1000, 2200, 4700];
  function snap(v: number, list: number[]): number {
    let best = list[0]; let d = Math.abs(v - list[0]);
    for (const x of list) { const dd = Math.abs(v - x); if (dd < d) { d = dd; best = x; } }
    return best;
  }
  $: snappedR = snap(r.RsnubOhm, stdR);
  $: snappedC = snap(r.CsnubPF, stdC);

  function fmtR(v: number) { return `${v.toFixed(0)} Ω`; }
  function fmtC(v: number) { return v >= 1000 ? `${(v/1000).toFixed(1)} nF` : `${v.toFixed(0)} pF`; }
  function fmtP(p: number) { return p >= 1 ? `${p.toFixed(2)} W` : p >= 1e-3 ? `${(p*1e3).toFixed(0)} mW` : `${(p*1e6).toFixed(0)} μW`; }
</script>

<div class="not-prose grid gap-4 lg:grid-cols-[1fr_1.2fr]">
  <div class="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div>
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">측정값</div>
      <div class="mt-1 text-sm text-slate-600">스코프로 SW 노드의 ringing 주파수와 평소 SW 캡 측정.</div>
    </div>
    <Slider id="fr"  label="f_ring (스코프 측정)"   bind:value={fRingMHz} min={10}   max={500} step={1}   format={(v) => `${v.toFixed(0)} MHz`} />
    <Slider id="cp"  label="C_par (SW 노드 추정)"   bind:value={CparPF}    min={10}   max={500} step={5}   format={(v) => `${v.toFixed(0)} pF`} />
    <Slider id="vin" label="V_in"                   bind:value={Vin}       min={3}    max={48}  step={0.1} format={(v) => `${v.toFixed(1)} V`} />
    <Slider id="fsw" label="f_sw (스위칭 주파수)"   bind:value={fswKHz}    min={100}  max={3000} step={50}  format={(v) => `${v.toFixed(0)} kHz`} />

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      <b>측정 방법</b>:
      <ol class="list-decimal pl-5 mt-1 space-y-0.5">
        <li>스코프 prove (1×, GND 스프링) 로 SW 노드 직접 접촉</li>
        <li>HS-FET turn-on 직후 ringing 의 한 사이클 시간 측정 → 1/T = f_ring</li>
        <li>C_par 는 직접 측정 어려움 — 보통 50 ~ 200 pF 추정 (FET output cap + 트레이스 + 인덕터 winding)</li>
      </ol>
    </div>
  </div>

  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Snubber RC 권장값</div>
      <div class="font-mono text-[10px] text-slate-500">L_par = 1 / (ω² C_par)</div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-md border border-slate-200 bg-white p-3">
        <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">R_snub</div>
        <div class="text-3xl font-semibold font-mono text-indigo-700 mt-1">{r.RsnubOhm.toFixed(1)} <span class="text-base text-indigo-500">Ω</span></div>
        <div class="font-mono text-[11px] text-slate-500 mt-1">→ 표준 <b class="text-slate-800">{snappedR} Ω</b></div>
      </div>
      <div class="rounded-md border border-slate-200 bg-white p-3">
        <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">C_snub</div>
        <div class="text-3xl font-semibold font-mono text-indigo-700 mt-1">{fmtC(r.CsnubPF)}</div>
        <div class="font-mono text-[11px] text-slate-500 mt-1">→ 표준 <b class="text-slate-800">{fmtC(snappedC)}</b></div>
      </div>
    </div>

    <div class="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
      <div class="font-mono text-[10px] tracking-widest uppercase">전력 손실 (R_snub 발열)</div>
      <div class="mt-1 text-sm">
        <span class="font-mono">P = C_snub · V_in² · f_sw = {fmtP(r.PrW)}</span>
      </div>
      <div class="text-[11px] mt-1">
        R_snub 의 정격 power 가 이 값보다 충분히 커야 함 (예: 0805 = 0.125 W, 1206 = 0.25 W).
      </div>
    </div>

    <div class="pt-3 border-t border-slate-200 space-y-1 font-mono text-[12px] text-slate-600">
      <div>L_par (기생 인덕턴스) ≈ <span class="text-slate-900">{r.LparNH.toFixed(1)} nH</span></div>
      <div>characteristic Z = √(L/C) ≈ <span class="text-slate-900">{r.RsnubOhm.toFixed(1)} Ω</span></div>
    </div>

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      <b>설계 룰</b>:
      <ul class="list-disc pl-5 mt-1 space-y-0.5">
        <li>R 너무 작으면 ringing 안 잡힘 (under-damped)</li>
        <li>R 너무 크면 효과 미미 (over-damped) — 손실만 발생</li>
        <li>C 는 C_par 의 2~3 배가 적정. 너무 크면 전력 손실 증가</li>
        <li>snubber 는 SW 핀과 GND 사이, <b>SW 핀 1 cm 이내</b> 배치</li>
      </ul>
    </div>
  </div>
</div>
