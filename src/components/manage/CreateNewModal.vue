<script setup>
import {
  computed,
  ref,
} from 'vue'

import { createAccount } from '../../services/accountService'
import { createCategory } from '../../services/categoryService'


const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'close',
  'created',
])

const mode = ref('account')

const accountName = ref('')
const accountBalance = ref('')
const accountType = ref('other')

const categoryName = ref('')
const categoryIcon = ref('💜')
const categoryType = ref('expense')

const saving = ref(false)
const errorMessage = ref('')

const title = computed(() => {
  return mode.value === 'account'
    ? 'New Account'
    : 'New Category'
})

function resetForm() {
  accountName.value = ''
  accountBalance.value = ''
  accountType.value = 'other'

  categoryName.value = ''
  categoryIcon.value = '💜'
  categoryType.value = 'expense'

  errorMessage.value = ''
}

function closeModal() {
  resetForm()
  emit('close')
}

async function save() {
  errorMessage.value = ''
  saving.value = true

  try {
    if (mode.value === 'account') {
      if (!accountName.value.trim()) {
        throw new Error('Please enter an account name.')
      }

        await createAccount({
          name: accountName.value.trim(),
          balance: accountBalance.value || 0,
          accountType: accountType.value,
        })
    } else {
      if (!categoryName.value.trim()) {
        throw new Error('Please enter a category name.')
      }

      await createCategory({
        name: categoryName.value.trim(),
        icon: categoryIcon.value || '•',
        type: categoryType.value,
      })
    }

    resetForm()

    emit('created')
    emit('close')
  } catch (error) {
    errorMessage.value =
      error.message ||
      'Could not save.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal-backdrop"
      @click.self="closeModal"
    >
      <section class="modal-sheet">
        <header class="modal-header">
          <button
            class="modal-icon-button"
            type="button"
            @click="closeModal"
          >
            ×
          </button>

          <h2>
            {{ title }}
          </h2>

          <button
            class="modal-save-button"
            type="button"
            :disabled="saving"
            @click="save"
          >
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </header>

        <div class="modal-tabs">
          <button
            type="button"
            :class="{
              active: mode === 'account',
            }"
            @click="mode = 'account'"
          >
            Account
          </button>

          <button
            type="button"
            :class="{
              active: mode === 'category',
            }"
            @click="mode = 'category'"
          >
            Category
          </button>
        </div>

        <div
          v-if="mode === 'account'"
          class="modal-form"
        >
          <label>
            Account Name

            <input
              v-model="accountName"
              type="text"
              placeholder="e.g. GCash"
            />
          </label>

          <label>
            Balance

            <div class="amount-input">
              <span>₱</span>

              <input
                v-model="accountBalance"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </label>

          <label>
            Account Type

            <select v-model="accountType">
              <option value="general">
                General
              </option>

              <option value="savings">
                Savings
              </option>

              <option value="other">
                Other
              </option>
            </select>
          </label>
        </div>

        <div
          v-else
          class="modal-form"
        >
          <label>
            Icon

            <input
              v-model="categoryIcon"
              type="text"
              maxlength="4"
              placeholder="💜"
            />
          </label>

          <label>
            Category Name

            <input
              v-model="categoryName"
              type="text"
              placeholder="e.g. Coffee"
            />
          </label>

          <label>
            Type

            <select v-model="categoryType">
              <option value="expense">
                Expense
              </option>

              <option value="income">
                Income
              </option>
            </select>
          </label>
        </div>

        <p
          v-if="errorMessage"
          class="form-error"
        >
          {{ errorMessage }}
        </p>
      </section>
    </div>
  </Teleport>
</template>