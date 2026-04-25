<script lang="ts">
  import Slider from './shared/Slider.svelte';

  // Buck converter loss model — simplified
  let Vin = 12;
  let Vout = 3.3;
  let Iout = 1.0;
  let fsw_kHz = 500;        // switching freq
  let RdsHsMohm = 30;       // high-side FET on resistance
  let RdsLsMohm = 20;       // low-side FET on resistance
  let LdcrMohm = 50;        // inductor DCR
  let Coss_pF = 200;        // FET output cap (switching loss)

  $: D = Vout / Vin;        // duty cycle
  $: Pout = Vout * Iout;
  $: tSw = 1 / (fsw_kHz * 1000);

  // Conduction loss (simplified — RMS = Iout for low ripple)
  $: PcondHs = (RdsHsMohm / 1000) * Iout * Iout * D;
  $: PcondLs = (RdsLsMohm / 1000) * Iout * Iout * (1 - D);
  $: Pcond_L = (LdcrMohm / 1000) * Iout * Iout;
  $: Pcond = PcondHs + PcondLs + Pcond_L;

  // Switching loss (very simplified): 0.5 * Vin * Iout * (tRise+tFall) * fsw + 0.5 * Coss * Vin² * fsw
  $: tTransNs = 20;
  $: PswEdge = 0.5 * Vin * Iout * (tTransNs * 1e-9) * (fsw_kHz * 1000);
  $: PswCoss = 0.5 * (Coss_pF * 1e-12) * Vin * Vin * (fsw_kHz * 1000);
  $: Psw = PswEdge + PswCoss;

  // Gate drive (very rough): assume Qg = 5 nC each FET
  $: Pgate = 2 * 5e-9 * Vin * (fsw_kHz * 1000);

  $: Ploss = Pcond + Psw + Pgate;
  $: Pin = Pout + Ploss;
  $: efficiency = Pout / Pin;

  function fmtP(p: number) {
    if (p >= 1) return `${p.toFixed(2)} W`;
    if (p >= 1e-3) return `${(p * 1000).toFixed(0)} mW`;
    return `${(p * 1e6).toFixed(0)} μW`;
  }

  $: tier = (() => {
    if (efficiency >= 0.92) return { label: '우수', color: 'emerald' };
    if (efficiency >= 0.85) return { label: '양호', color: 'sky' };
    if (efficiency >= 0.75) return { label: '보통', color: 'amber' };
    return                        { label: '저효율', color: 'rose' };
  })();
  const tone: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    sky:     'bg-sky-50 border-sky-200 text-sky-800',
    amber:   'bg-amber-50 border-amber-200 text-amber-800',
    rose:    'bg-rose-50 border-rose-200 text-rose-800',
  };

  // Loss breakdown bar widths (normalized)
  $: maxLoss = Math.max(Pcond, Psw, Pgate, 0.001);
  $: barCond = (Pcond / Ploss) * 100;
  $: barSw   = (Psw / Ploss) * 100;
  $: barGate = (Pgate / Ploss) * 100;
</script>

<div class="not-prose grid gap-4 lg:grid-cols-[1fr_1.2fr]">
  <div class="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div>
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Operating Point</div>
    </div>
    <Slider id="vin"  label="V_in"   bind:value={Vin}     min={3.3} max={48}  step={0.1} format={(v) => `${v.toFixed(1)} V`} />
    <Slider id="vout" label="V_out"  bind:value={Vout}    min={0.6} max={20}  step={0.05} format={(v) => `${v.toFixed(2)} V`} />
    <Slider id="iout" label="I_out"  bind:value={Iout}    min={0.05} max={20} step={0.05} format={(v) => `${v.toFixed(2)} A`} />
    <Slider id="fsw"  label="f_sw"   bind:value={fsw_kHz} min={100}  max={3000} step={50} format={(v) => `${v.toFixed(0)} kHz`} />

    <div class="pt-3 border-t border-slate-100 space-y-2">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Component Specs</div>
      <Slider id="rh" label="R_DS HS-FET" bind:value={RdsHsMohm} min={5}  max={200} step={1}  format={(v) => `${v} mΩ`} />
      <Slider id="rl" label="R_DS LS-FET" bind:value={RdsLsMohm} min={5}  max={200} step={1}  format={(v) => `${v} mΩ`} />
      <Slider id="ld" label="L DCR"        bind:value={LdcrMohm}  min={5}  max={300} step={1}  format={(v) => `${v} mΩ`} />
      <Slider id="cs" label="C_oss FET"   bind:value={Coss_pF}   min={50} max={2000} step={10} format={(v) => `${v} pF`} />
    </div>
  </div>

  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Efficiency</div>
      <div class="font-mono text-[10px] text-slate-500">D = V_out / V_in = {(D * 100).toFixed(1)}%</div>
    </div>
    <div class="text-4xl font-semibold font-mono text-indigo-700">
      {(efficiency * 100).toFixed(1)} <span class="text-2xl text-indigo-600">%</span>
    </div>

    <div class={'rounded-md border p-2 ' + tone[tier.color]}>
      <div class="font-mono text-[10px] tracking-widest uppercase">{tier.label}</div>
    </div>

    <div class="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-sm">
      <div>
        <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">P_in</div>
        <div class="font-mono text-slate-900">{fmtP(Pin)}</div>
      </div>
      <div>
        <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">P_out</div>
        <div class="font-mono text-slate-900">{fmtP(Pout)}</div>
      </div>
      <div>
        <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">P_loss</div>
        <div class="font-mono text-rose-700">{fmtP(Ploss)}</div>
      </div>
    </div>

    <div class="pt-3 border-t border-slate-200">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase mb-2">손실 비중</div>
      <div class="flex h-6 rounded overflow-hidden border border-slate-200">
        <div class="bg-rose-400" style={`width: ${barCond}%`} title="Conduction"></div>
        <div class="bg-sky-400" style={`width: ${barSw}%`} title="Switching"></div>
        <div class="bg-amber-400" style={`width: ${barGate}%`} title="Gate"></div>
      </div>
      <div class="mt-1 grid grid-cols-3 gap-2 text-[11px] font-mono">
        <div><span class="inline-block w-2 h-2 bg-rose-400 rounded"></span> conduction <span class="text-slate-500">{fmtP(Pcond)}</span></div>
        <div><span class="inline-block w-2 h-2 bg-sky-400 rounded"></span> switching <span class="text-slate-500">{fmtP(Psw)}</span></div>
        <div><span class="inline-block w-2 h-2 bg-amber-400 rounded"></span> gate <span class="text-slate-500">{fmtP(Pgate)}</span></div>
      </div>
    </div>

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      <b>주의</b> — 1차 손실만 포함. 코어 손실, AC 권선, EMI 필터, 컨트롤러 quiescent, 부트스트랩 cap, 데드타임 손실은 별도.
      실 효율은 데이터시트 그래프나 평가보드에서 확인.
    </div>
  </div>
</div>
