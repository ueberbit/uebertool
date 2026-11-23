<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<template>
  <span class="badge">{{ label }}</span>
</template>

<style>
/* Styles of nested components are adopted into the parent's shadow root. */
.badge {
  border-radius: 9999px;
  background: #fde68a;
  color: #78350f;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
}
</style>
