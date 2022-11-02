<script setup lang="ts">
const text = `I'm a Vue custom element! (lazy)`
</script>

<template>
  <button class="bg-orange-500 btn">{{ text }}</button>
</template>

<style >
@import './button.css';
</style>
