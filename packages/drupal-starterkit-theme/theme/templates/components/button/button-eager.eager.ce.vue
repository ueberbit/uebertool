<script setup lang="ts">
const text = `I'm a Vue custom element! (eager)`
</script>

<template>
  <button class="bg-green-900 btn">{{ text }}</button>
</template>

<style >
@import './button.css';
</style>
