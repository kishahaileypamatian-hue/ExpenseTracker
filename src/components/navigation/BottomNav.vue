
<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()

const {
  signOut,
} = useAuth()

async function handleLogout() {
  try {
    await signOut()

    router.replace({
      name: 'login',
    })
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<template>
  <nav class="bottom-nav">
    <RouterLink
      class="nav-item"
      :to="{ name: 'home' }"
    >
      <span class="nav-icon">
        ⌂
      </span>

      <span>
        Home
      </span>
    </RouterLink>

    <RouterLink
      class="nav-item"
      :to="{ name: 'transactions' }"
    >
      <span class="nav-icon">
        ≡
      </span>

      <span>
        Transactions
      </span>
    </RouterLink>

    <RouterLink
      class="nav-item"
      :to="{ name: 'manage' }"
    >
      <span class="nav-icon">
        ◫
      </span>

      <span>
        Accounts & Categories
      </span>
    </RouterLink>

    <button
      class="nav-item logout-button"
      type="button"
      @click="handleLogout"
    >
      <span class="nav-icon">
        ↪
      </span>

      <span>
        Logout
      </span>
    </button>
  </nav>
</template>