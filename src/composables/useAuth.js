import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const user = ref(null)
const loading = ref(true)
const initialized = ref(false)

let authListener = null

export function useAuth() {
  async function initializeAuth() {
    if (initialized.value) {
      return
    }

    loading.value = true

    const {
      data: { session },
    } = await supabase.auth.getSession()

    user.value = session?.user ?? null

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        user.value = session?.user ?? null
      }
    )

    authListener = subscription
    initialized.value = true
    loading.value = false
  }

  async function signIn(
    identifier,
    password
  ) {
    const value =
      identifier.trim()

    // LOGIN USING EMAIL
    if (value.includes('@')) {
      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword({
          email: value,
          password,
        })

      if (error) {
        throw error
      }

      user.value = data.user

      return data
    }

    // LOGIN USING USERNAME
    const {
      data,
      error,
    } = await supabase.functions.invoke(
      'login-with-username',
      {
        body: {
          username: value.toLowerCase(),
          password,
        },
      }
    )

    if (error) {
      throw error
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })

    if (sessionError) {
      throw sessionError
    }

    user.value =
      sessionData.user ?? null

    return sessionData
  }

  async function signUp(
    email,
    password,
    username
  ) {
    const normalizedUsername =
      username.trim().toLowerCase()

    const {
      data,
      error,
    } =
      await supabase.auth.signUp({
        email: email.trim(),
        password,

        options: {
          data: {
            username:
              normalizedUsername,
          },
        },
      })

    if (error) {
      throw error
    }

    user.value = data.user

    return data
  }

  async function signOut() {
    const {
      error,
    } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    user.value = null
  }

  function cleanupAuth() {
    authListener?.unsubscribe()
    authListener = null
    initialized.value = false
  }

  return {
    user,
    loading,
    initializeAuth,
    cleanupAuth,
    signIn,
    signUp,
    signOut,
  }
}