<script setup>
import {
  computed,
  ref,
  watch,
} from 'vue'

import { getAccounts } from '../../services/accountService'
import { getCategories } from '../../services/categoryService'
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../../services/transactionService'

import {
  useDataRefresh,
} from '../../composables/useDataRefresh'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },

  defaultType: {
    type: String,
    default: 'expense',
  },

  transaction: {
    type: Object,
    default: null,
  },
})

const {
  markDataChanged,
} = useDataRefresh()

const editing = computed(() => {
  return !!props.transaction
})

const emit = defineEmits([
  'close',
  'created',
  'deleted',
])


const type = ref('expense')
const initializing = ref(false)
const amount = ref('')
const categoryId = ref('')
const accountId = ref('')
const deleting = ref(false)

const accountDropdownOpen = ref(false)
const categoryDropdownOpen = ref(false)

const fromAccountId = ref('')
const toAccountId = ref('')

const transactionDate = ref('')
const transactionTime = ref('')

const paid = ref(true)
const notes = ref('')

const accounts = ref([])
const categories = ref([])

const loading = ref(false)
const saving = ref(false)

const errorMessage = ref('')




const filteredCategories = computed(() => {
  return categories.value.filter(
    (category) => category.type === type.value
  )
})


const availableToAccounts = computed(() => {
  return accounts.value.filter(
    (account) => account.id !== fromAccountId.value
  )
})

const selectedAccount = computed(() => {
  return accounts.value.find(
    (account) => account.id === accountId.value
  )
})

const selectedCategory = computed(() => {
  return filteredCategories.value.find(
    (category) => category.id === categoryId.value
  )
})

async function handleDelete() {
  if (!props.transaction) {
    return
  }

  const confirmed = window.confirm(
    'Delete this transaction? This will also reverse its effect on your account balance.'
  )

  if (!confirmed) {
    return
  }

  deleting.value = true
  errorMessage.value = ''

  try {
    await deleteTransaction(
      props.transaction.id
    )
markDataChanged()

    emit('deleted')
    emit('close')
  } catch (error) {
    console.error(error)

    errorMessage.value =
      error.message ||
      'Could not delete transaction.'
  } finally {
    deleting.value = false
  }
}

function getLocalDate() {
  const now = new Date()

  const year = now.getFullYear()

  const month = String(
    now.getMonth() + 1
  ).padStart(2, '0')

  const day = String(
    now.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}


function getLocalTime() {
  const now = new Date()

  const hours = String(
    now.getHours()
  ).padStart(2, '0')

  const minutes = String(
    now.getMinutes()
  ).padStart(2, '0')

  return `${hours}:${minutes}`
}


function resetForm() {
  const transaction = props.transaction

  if (transaction) {
    type.value =
      transaction.transaction_type

    amount.value =
      String(transaction.amount)

    categoryId.value =
      transaction.category_id || ''

    accountId.value =
      transaction.account_id || ''

    fromAccountId.value =
      transaction.from_account_id || ''

    toAccountId.value =
      transaction.to_account_id || ''

    transactionDate.value =
      transaction.transaction_date

    transactionTime.value =
      transaction.transaction_time
        ?.slice(0, 5) || getLocalTime()

    paid.value =
      transaction.paid ?? true

    notes.value =
      transaction.notes || ''

    errorMessage.value = ''

    return
  }

  


  type.value =
    props.defaultType || 'expense'

  amount.value = ''
  categoryId.value = ''
  accountId.value = ''

  fromAccountId.value = ''
  toAccountId.value = ''

  transactionDate.value =
    getLocalDate()

  transactionTime.value =
    getLocalTime()

  paid.value = true
  notes.value = ''

  errorMessage.value = ''
}

async function loadOptions() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [
      accountData,
      categoryData,
    ] = await Promise.all([
      getAccounts(),
      getCategories(),
    ])

    accounts.value = accountData
    categories.value = categoryData

    if (
      !accountId.value &&
      accountData.length
    ) {
      accountId.value =
        accountData[0].id
    }

    if (
      !fromAccountId.value &&
      accountData.length
    ) {
      fromAccountId.value =
        accountData[0].id
    }

    if (
    !toAccountId.value &&
    accountData.length > 1
    ) {
    const destination =
        accountData.find(
        (account) =>
            account.id !== fromAccountId.value
        )

    toAccountId.value =
        destination?.id || ''
    }
  } catch (error) {
    console.error(error)

    errorMessage.value =
      error.message ||
      'Could not load accounts and categories.'
  } finally {
    loading.value = false
  }
}


function closeModal() {
  emit('close')
}


async function handleSave() {
  errorMessage.value = ''

  if (
    !amount.value ||
    Number(amount.value) <= 0
  ) {
    errorMessage.value =
      'Enter an amount greater than zero.'

    return
  }


  if (
    type.value !== 'transfer' &&
    !categoryId.value
  ) {
    errorMessage.value =
      'Select a category.'

    return
  }


  if (
    type.value !== 'transfer' &&
    !accountId.value
  ) {
    errorMessage.value =
      'Select an account.'

    return
  }


  if (type.value === 'transfer') {
    if (
      !fromAccountId.value ||
      !toAccountId.value
    ) {
      errorMessage.value =
        'Select both accounts.'

      return
    }

    if (
      fromAccountId.value ===
      toAccountId.value
    ) {
      errorMessage.value =
        'Choose different accounts.'

      return
    }
  }


  saving.value = true

  try {
    const transactionData = {
  type: type.value,
  amount: amount.value,

  categoryId:
    type.value === 'transfer'
      ? null
      : categoryId.value,

  accountId:
    type.value === 'transfer'
      ? null
      : accountId.value,

  fromAccountId:
    type.value === 'transfer'
      ? fromAccountId.value
      : null,

  toAccountId:
    type.value === 'transfer'
      ? toAccountId.value
      : null,

  date: transactionDate.value,
  time: transactionTime.value,

  paid:
    type.value === 'transfer'
      ? true
      : paid.value,

  notes: notes.value,
}


if (editing.value) {
  await updateTransaction({
    id: props.transaction.id,
    ...transactionData,
  })
} else {
  await createTransaction(
    transactionData
  )
}

markDataChanged()

emit('created')

resetForm()

emit('close')
  } catch (error) {
    console.error(error)

    errorMessage.value =
      error.message ||
      'Could not save transaction.'
  } finally {
    saving.value = false
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return
    }

    initializing.value = true

    try {
      await loadOptions()
      resetForm()
    } finally {
      initializing.value = false
    }
  }
)


watch(type, () => {
  if (initializing.value) {
    return
  }

  categoryId.value = ''
  errorMessage.value = ''
})


watch(fromAccountId, () => {
  if (
    fromAccountId.value ===
    toAccountId.value
  ) {
    const replacement =
      accounts.value.find(
        (account) =>
          account.id !==
          fromAccountId.value
      )

    toAccountId.value =
      replacement?.id || ''
  }
})
</script>


<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal-backdrop"
      @click.self="closeModal"
    >
      <section class="transaction-modal">
        <!-- HEADER -->

        <header class="modal-header">
          <button
            class="modal-icon-button"
            type="button"
            @click="closeModal"
          >
            ×
          </button>

            <h2>
            {{
                editing
                ? 'Edit Transaction'
                : 'New Transaction'
            }}
            </h2>
          <button
            class="modal-save-button"
            type="button"
            :disabled="saving || loading"
            @click="handleSave"
          >
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </header>


        <!-- TYPE -->

        <div class="transaction-type-tabs">
          <button
            type="button"
            :class="{
              active: type === 'expense',
            }"
            @click="type = 'expense'"
          >
            Expense
          </button>

          <button
            type="button"
            :class="{
              active: type === 'income',
            }"
            @click="type = 'income'"
          >
            Income
          </button>

          <button
            type="button"
            :class="{
              active: type === 'transfer',
            }"
            @click="type = 'transfer'"
          >
            Transfer
          </button>
        </div>


        <div
          v-if="loading"
          class="transaction-modal-loading"
        >
          Loading...
        </div>


        <div v-else>
          <!-- AMOUNT -->

          <div class="transaction-amount-entry">
            <span>
              ₱
            </span>

            <input
              v-model="amount"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              placeholder="0.00"
            />
          </div>


          <!-- EXPENSE / INCOME -->

          <div
            v-if="type !== 'transfer'"
            class="transaction-form"
          >


          <label>
            <span>
              Category
            </span>

            <div class="soft-select">
              <button
                type="button"
                class="soft-select-trigger"
                @click="categoryDropdownOpen = !categoryDropdownOpen"
              >
                <span>
                  {{
                    selectedCategory
                      ? `${selectedCategory.icon || '•'} ${selectedCategory.name}`
                      : 'Select category'
                  }}
                </span>

                <span class="soft-select-chevron">
                  ⌄
                </span>
              </button>

              <div
                v-if="categoryDropdownOpen"
                class="soft-select-menu"
              >
                <button
                  v-for="category in filteredCategories"
                  :key="category.id"
                  type="button"
                  class="soft-select-option"
                  :class="{
                    selected: category.id === categoryId
                  }"
                  @click="
                    categoryId = category.id;
                    categoryDropdownOpen = false
                  "
                >
                  {{ category.icon || '•' }}
                  {{ category.name }}
                </button>
              </div>
            </div>
          </label>

            <label>
              <span>
                Date
              </span>

              <input
                v-model="transactionDate"
                type="date"
              />
            </label>


            <label>
              <span>
                Time
              </span>

              <input
                v-model="transactionTime"
                type="time"
              />
            </label>


           <label>
  <span>
    Account
  </span>

  <div class="soft-select">
    <button
      type="button"
      class="soft-select-trigger"
      @click="accountDropdownOpen = !accountDropdownOpen"
    >
      <span>
        {{
          selectedAccount?.name ||
          'Select account'
        }}
      </span>

      <span class="soft-select-chevron">
        ⌄
      </span>
    </button>

    <div
      v-if="accountDropdownOpen"
      class="soft-select-menu"
    >
      <button
        type="button"
        class="soft-select-option soft-select-placeholder-option"
        @click="
          accountId = '';
          accountDropdownOpen = false
        "
      >
        Select account
      </button>

      <button
        v-for="account in accounts"
        :key="account.id"
        type="button"
        class="soft-select-option"
        :class="{
          selected: account.id === accountId
        }"
        @click="
          accountId = account.id;
          accountDropdownOpen = false
        "
      >
        {{ account.name }}
      </button>
    </div>
  </div>
</label>

            <div class="transaction-toggle-row">
              <div>
                <strong>
                  {{
                    type === 'income'
                      ? 'Received'
                      : 'Paid'
                  }}
                </strong>

                <small>
                  {{
                    type === 'income'
                      ? 'Has this income been received?'
                      : 'Has this expense already been paid?'
                  }}
                </small>
              </div>

              <button
                class="toggle-switch"
                :class="{
                  active: paid,
                }"
                type="button"
                :aria-pressed="paid"
                @click="paid = !paid"
              >
                <span />
              </button>
            </div>
          </div>


          <!-- TRANSFER -->

          <div
            v-else
            class="transaction-form"
          >

          <label>
            <span>
              Date
            </span>

            <input
              v-model="transactionDate"
              type="date"
            />
          </label>

            <label>
              <span>
                Time
              </span>

              <input
                v-model="transactionTime"
                type="time"
              />
            </label>


            <label>
              <span>
                From Account
              </span>

              <select v-model="fromAccountId">
                <option
                  v-for="account in accounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.name }}
                </option>
              </select>
            </label>


            <label>
              <span>
                To Account
              </span>

              <select v-model="toAccountId">
                <option
                  value=""
                  disabled
                >
                  Select account
                </option>

                <option
                  v-for="account in availableToAccounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.name }}
                </option>
              </select>
            </label>
          </div>


          <!-- NOTES -->

          <label class="transaction-notes">
            <span>
              Notes
            </span>

            <textarea
              v-model="notes"
              rows="3"
              placeholder="Add a note..."
            />
          </label>


          <p
            v-if="errorMessage"
            class="form-error transaction-form-error"
          >
            {{ errorMessage }}
          </p>

          <p
  v-if="errorMessage"
  class="form-error transaction-form-error"
>
  {{ errorMessage }}
</p>

<button
  v-if="editing"
  class="danger-button transaction-delete-button"
  type="button"
  :disabled="deleting || saving"
  @click="handleDelete"
>
  {{ deleting ? 'Deleting...' : 'Delete Transaction' }}
</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>