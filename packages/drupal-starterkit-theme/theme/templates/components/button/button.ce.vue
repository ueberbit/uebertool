<script setup lang="ts">
const text = 'Im a Vue custom element!'
</script>

<template>
  <button class="bg-orange-900 btn">
    {{ text }}
  </button>
</template>

<style>
@import './button.css';
</style>
