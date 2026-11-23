<docs lang="ts">
/**
 * A Vue single file component as custom element.
 *
 * @element demo-hello-vue
 *
 * @attr {string} name - Who to greet.
 *
 * @slot - Appended after the greeting.
 */
</docs>

<script setup lang="ts">
const props = defineProps<{
  name?: string
}>()
</script>

<template>
  <p>Hello, <strong>{{ props.name ?? 'Somebody' }}</strong>! (vue) <slot /></p>
</template>

<style>
p {
  color: #16a34a;
  margin: 0;
}
</style>
