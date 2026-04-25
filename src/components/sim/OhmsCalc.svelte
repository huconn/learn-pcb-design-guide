<script lang="ts">
  import Slider from './shared/Slider.svelte';

  // Voltage divider calculator
  let Vin = 5;
  let R1 = 10000;
  let R2 = 10000;

  $: Vout = Vin * R2 / (R1 + R2);
  $: I = Vin / (R1 + R2);
  $: Pr1 = I * I * R1;
  $: Pr2 = I * I * R2;

  function fmtR(r: number) {
    if (r >= 1e6) return `${(r / 1e6).toFixed(2)} MΩ`;
    if (r >= 1e3) return `${(r / 1e3).toFixed(2)} kΩ`;
    return `${r.toFixed(0)} Ω`;
  }
  function fmtP(p: number) {
    if (p >= 1) return `${p.toFixed(2)} W`;
    if (p >= 1e-3) return `${(p * 1e3).toFixed(2)} mW`;
    return `${(p * 1e6).toFixed(1)} μW`;
  }
</script>

<div class="not-prose grid gap-4 lg:grid-cols-[1fr_1.2fr]">
  <div class="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div>
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Voltage Divider</div>
      <div class="mt-1 text-sm text-slate-600">Vin → R1 → (Vout) → R2 → GND</div>
    </div>
    <Slider id="vin" label="Vin"  bind:value={Vin} min={0.1} max={50}     step={0.1} format={(v) => `${v.toFixed(1)} V`} />
    <Slider id="r1"  label="R1"   bind:value={R1}  min={10}  max={1e6}    step={10}  format={fmtR} />
    <Slider id="r2"  label="R2"   bind:value={R2}  min={10}  max={1e6}    step={10}  format={fmtR} />
  </div>

  <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
    <div class="flex items-baseline justify-between">
      <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Result</div>
      <div class="font-mono text-[10px] text-slate-500">Vout = Vin · R2 / (R1+R2)</div>
    </div>
    <div class="text-4xl font-semibold font-mono text-indigo-700">
      {Vout.toFixed(3)} <span class="text-2xl text-indigo-600">V</span>
    </div>

    <div class="grid grid-cols-3 gap-2 text-sm pt-3 border-t border-slate-200">
      <div>
        <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Current</div>
        <div class="font-mono text-slate-900">{I < 1e-3 ? `${(I * 1e6).toFixed(1)} μA` : I < 1 ? `${(I * 1e3).toFixed(2)} mA` : `${I.toFixed(3)} A`}</div>
      </div>
      <div>
        <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">P · R1</div>
        <div class="font-mono text-slate-900">{fmtP(Pr1)}</div>
      </div>
      <div>
        <div class="font-mono text-[10px] tracking-widest text-slate-500 uppercase">P · R2</div>
        <div class="font-mono text-slate-900">{fmtP(Pr2)}</div>
      </div>
    </div>

    <svg viewBox="0 0 400 130" class="w-full mt-2">
      <rect width="400" height="130" fill="#fff" stroke="#e2e8f0" />
      <!-- Vin -->
      <text x="20" y="30" font-size="10" font-family="ui-monospace, monospace" fill="#0f172a">Vin = {Vin.toFixed(1)} V</text>
      <line x1="20" y1="40" x2="20" y2="115" stroke="#0f172a" stroke-width="1.4" />
      <!-- R1 -->
      <line x1="20" y1="115" x2="100" y2="115" stroke="#0f172a" stroke-width="1.4" />
      <rect x="100" y="105" width="60" height="20" fill="#fde68a" stroke="#92400e" />
      <text x="115" y="119" font-size="10" font-family="ui-monospace, monospace" fill="#92400e">R1</text>
      <line x1="160" y1="115" x2="220" y2="115" stroke="#0f172a" stroke-width="1.4" />
      <!-- Vout tap -->
      <circle cx="220" cy="115" r="3" fill="#4f46e5" />
      <text x="226" y="100" font-size="10" font-family="ui-monospace, monospace" fill="#4f46e5">Vout = {Vout.toFixed(3)} V</text>
      <!-- R2 -->
      <line x1="220" y1="115" x2="280" y2="115" stroke="#0f172a" stroke-width="1.4" />
      <rect x="280" y="105" width="60" height="20" fill="#fde68a" stroke="#92400e" />
      <text x="295" y="119" font-size="10" font-family="ui-monospace, monospace" fill="#92400e">R2</text>
      <line x1="340" y1="115" x2="380" y2="115" stroke="#0f172a" stroke-width="1.4" />
      <!-- GND -->
      <line x1="380" y1="105" x2="380" y2="125" stroke="#0f172a" stroke-width="1.4" />
      <line x1="372" y1="125" x2="388" y2="125" stroke="#0f172a" stroke-width="1.4" />
      <line x1="375" y1="129" x2="385" y2="129" stroke="#0f172a" stroke-width="1.2" />
      <line x1="378" y1="133" x2="382" y2="133" stroke="#0f172a" stroke-width="1" />
    </svg>

    <div class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
      <b>주의</b> — Vout 에 부하가 걸리면(다음 단의 입력 임피던스가 R2 와 비슷하면) 분압이 무너집니다. 부하 임피던스 ≫ R2 일 때만 위 식이 성립.
    </div>
  </div>
</div>
