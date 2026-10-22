<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()

const {
  signIn,
} = useAuth()

const identifier = ref('')
const password = ref('')

const errorMessage = ref('')
const submitting = ref(false)

async function handleLogin() {
  errorMessage.value = ''
  submitting.value = true

  try {
    await signIn(
      identifier.value,
      password.value
    )

    router.push({
      name: 'home',
    })
  } catch (error) {
    errorMessage.value =
      error?.message ||
      'Could not sign in.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <div class="auth-heading">
        <h1>Expense Tracker</h1>

        <p>
          Sign in to your account.
        </p>
      </div>

      <form
        class="auth-form"
        @submit.prevent="handleLogin"
      >
        <label>
          Username or email

          <input
            v-model="identifier"
            type="text"
            placeholder="Username or email"
            autocomplete="username"
            required
          />
        </label>

        <label>
          Password

          <input
            v-model="password"
            type="password"
            placeholder="Enter your password"
            autocomplete="current-password"
            required
          />
        </label>

        <p
          v-if="errorMessage"
          class="form-error"
        >
          {{ errorMessage }}
        </p>

        <button
          class="primary-button"
          type="submit"
          :disabled="submitting"
        >
          {{
            submitting
              ? 'Signing in...'
              : 'Log in'
          }}
        </button>
      </form>

      <p class="auth-footer">
        Don't have an account?

        <RouterLink to="/register">
          Create one
        </RouterLink>
      </p>
    </section>
  </main>
</template>