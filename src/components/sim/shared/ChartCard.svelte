<script lang="ts">
  export let title: string = '';
  export let aria: string = '';
</script>

<div class="rounded-lg border border-slate-200 bg-slate-50 p-4" aria-label={aria || title}>
  {#if title}
    <div class="mb-2 flex items-baseline justify-between">
      <span class="font-mono text-[10px] tracking-widest text-slate-500">{title}</span>
    </div>
  {/if}
  <div>
    <slot />
  </div>
</div>
