<script setup>
import { RouterView } from 'vue-router'
import BottomNav from '../components/navigation/BottomNav.vue'
</script>

<template>
  <div class="app-shell">
    <main class="page-content">
      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <BottomNav />
  </div>
</template>