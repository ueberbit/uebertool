<docs lang="ts">
/**
 * Tailwind utilities inside the shadow DOM of a Vue custom element.
 *
 * @element demo-tailwind-card
 *
 * @attr {string} title - Card title.
 * @slot - Card body.
 */
</docs>

<script setup lang="ts">
defineProps<{
  title?: string
}>()

const count = ref(0)
</script>

<template>
  <div class="rounded-xl bg-indigo-600 p-6 text-white shadow-lg">
    <div class="flex items-center justify-between gap-4">
      <h2 class="m-0 text-xl font-bold">
        {{ title ?? 'Tailwind in shadow DOM' }}
      </h2>
      <!-- Local "*.ce.vue" components are auto-imported, no import statement. -->
      <DemoBadge label="nested component" />
    </div>
    <p class="mt-3 text-indigo-100">
      <slot />
    </p>
    <button class="mt-4 cursor-pointer rounded-md bg-white px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-50" @click="count++">
      Clicked {{ count }} times
    </button>
  </div>
</template>
