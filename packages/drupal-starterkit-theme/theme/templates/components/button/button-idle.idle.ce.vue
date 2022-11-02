<script setup lang="ts">
const text = `I'm a Vue custom element! (idle)`
</script>

<template>
  <button class="bg-blue-900 btn">{{ text }}</button>
</template>

<style >
@import './button.css';
</style>
