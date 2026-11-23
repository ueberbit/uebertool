<docs lang="ts">
/**
 * Uses auto-imported APIs only: `ref`/`computed` (vue preset),
 * `useMouse` (@vueuse/core preset) and `formatMs` (./js/utils).
 *
 * @element demo-mouse-tracker
 */
</docs>

<script setup lang="ts">
const { x, y } = useMouse()
const startedAt = ref(performance.now())
const uptime = ref(0)

useIntervalFn(() => {
  uptime.value = performance.now() - startedAt.value
}, 100)

const position = computed(() => `${x.value} × ${y.value}`)
</script>

<template>
  <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-lg border border-slate-300 p-4 font-mono text-sm">
    <dt class="text-slate-500">
      useMouse()
    </dt>
    <dd class="m-0">
      {{ position }}
    </dd>
    <dt class="text-slate-500">
      formatMs(uptime)
    </dt>
    <dd class="m-0">
      {{ formatMs(uptime) }}
    </dd>
  </dl>
</template>
