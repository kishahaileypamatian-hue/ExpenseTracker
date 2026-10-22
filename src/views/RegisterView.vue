<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()

const {
  signUp,
} = useAuth()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const errorMessage = ref('')
const successMessage = ref('')
const submitting = ref(false)

async function handleRegister() {
  errorMessage.value = ''
  successMessage.value = ''

  const normalizedUsername =
    username.value.trim().toLowerCase()

  if (
    !/^[a-z0-9_]{3,20}$/.test(
      normalizedUsername
    )
  ) {
    errorMessage.value =
      'Username must be 3–20 characters and contain only letters, numbers, and underscores.'

    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value =
      'Passwords do not match.'

    return
  }

  if (password.value.length < 6) {
    errorMessage.value =
      'Password must contain at least 6 characters.'

    return
  }

  submitting.value = true

  try {
    const data = await signUp(
      email.value,
      password.value,
      normalizedUsername
    )

    if (data.session) {
      router.push({
        name: 'home',
      })

      return
    }

    successMessage.value =
      'Account created. Check your email to confirm your account.'
  } catch (error) {
    const message =
      error?.message || ''

    if (
      message.toLowerCase().includes('username') ||
      message.toLowerCase().includes('duplicate') ||
      message.toLowerCase().includes('unique')
    ) {
      errorMessage.value =
        'That username is already taken.'
    } else {
      errorMessage.value =
        message ||
        'Could not create your account.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <div class="auth-heading">
        <h1>Create account</h1>

        <p>
          Create your personal expense tracker.
        </p>
      </div>

      <form
        class="auth-form"
        @submit.prevent="handleRegister"
      >
        <label>
          Username

          <input
            v-model="username"
            type="text"
            placeholder="Choose a username"
            autocomplete="username"
            minlength="3"
            maxlength="20"
            required
          />
        </label>

        <label>
          Email

          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </label>

        <label>
          Password

          <input
            v-model="password"
            type="password"
            placeholder="Create a password"
            autocomplete="new-password"
            required
          />
        </label>

        <label>
          Confirm password

          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Repeat your password"
            autocomplete="new-password"
            required
          />
        </label>

        <p
          v-if="errorMessage"
          class="form-error"
        >
          {{ errorMessage }}
        </p>

        <p
          v-if="successMessage"
          class="form-success"
        >
          {{ successMessage }}
        </p>

        <button
          class="primary-button"
          type="submit"
          :disabled="submitting"
        >
          {{
            submitting
              ? 'Creating...'
              : 'Create account'
          }}
        </button>
      </form>

      <p class="auth-footer">
        Already have an account?

        <RouterLink to="/login">
          Log in
        </RouterLink>
      </p>
    </section>
  </main>
</template>