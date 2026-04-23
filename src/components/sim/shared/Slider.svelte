<script lang="ts">
  export let label: string;
  export let value: number;
  export let min: number;
  export let max: number;
  export let step: number = 1;
  export let format: (v: number) => string = (v) => String(v);
  export let id: string;
</script>

<label class="block" for={id}>
  <div class="flex items-baseline justify-between">
    <span class="text-sm text-slate-700">{label}</span>
    <span class="font-mono text-sm text-slate-900">{format(value)}</span>
  </div>
  <input
    {id}
    type="range"
    {min}
    {max}
    {step}
    bind:value
    class="mt-1 w-full accent-sky-600"
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={value}
    aria-label={label}
  />
</label>
