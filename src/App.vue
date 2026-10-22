<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuth } from './composables/useAuth'

const {
  initializeAuth,
} = useAuth()

onMounted(() => {
  initializeAuth()
})
</script>

<template>
  <RouterView />
</template>