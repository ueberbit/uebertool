<script setup lang="ts">
const text = 'I\'m a Vue custom element! (visible)'
</script>

<template>
  <button class="bg-orange-800 btn">
    {{ text }}
  </button>
</template>

<style>
@import './button.css';
</style>
