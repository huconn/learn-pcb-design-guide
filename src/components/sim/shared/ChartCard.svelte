<script lang="ts">
  export let title: string = '';
  export let aria: string = '';
</script>

<div class="rounded-lg bg-slate-950 text-slate-200 p-4 shadow-sm" aria-label={aria || title}>
  {#if title}
    <div class="mb-2 font-mono text-xs tracking-widest text-slate-400">{title}</div>
  {/if}
  <div class="bg-slate-950">
    <slot />
  </div>
</div>
