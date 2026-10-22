<script setup>
import {
  computed,
  onActivated,
  ref,
} from 'vue'

import {
  useDataRefresh,
} from '../composables/useDataRefresh'

import {
  getTransactionsForMonth,
} from '../services/transactionService'


const loading = ref(true)
const errorMessage = ref('')

const transactions = ref([])

const {
  dataVersion,
} = useDataRefresh()

let lastSeenVersion = -1

const now = new Date()

const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1)


const monthLabel = computed(() => {
  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'long',
      year: 'numeric',
    }
  ).format(
    new Date(
      selectedYear.value,
      selectedMonth.value - 1,
      1
    )
  )
})


const groupedTransactions = computed(() => {
  const groups = {}

  for (const transaction of transactions.value) {
    const date = transaction.transaction_date

    if (!groups[date]) {
      groups[date] = []
    }

    groups[date].push(transaction)
  }

  return Object.entries(groups)
    .sort(
      ([dateA], [dateB]) =>
        new Date(dateB) - new Date(dateA)
    )
})


function formatCurrency(amount) {
  return new Intl.NumberFormat(
    'en-PH',
    {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }
  ).format(
    Number(amount ?? 0)
  )
}


function getDayNumber(date) {
  return new Date(
    `${date}T00:00:00`
  ).getDate()
}


function getWeekday(date) {
  return new Intl.DateTimeFormat(
    'en-US',
    {
      weekday: 'long',
    }
  ).format(
    new Date(
      `${date}T00:00:00`
    )
  )
}


function getTransactionTitle(transaction) {
  if (transaction.transaction_type === 'transfer') {
    return 'Transfer'
  }

  return (
    transaction.category?.name ||
    transaction.transaction_type
  )
}


function getTransactionIcon(transaction) {
  if (transaction.transaction_type === 'transfer') {
    return '↔'
  }

  return (
    transaction.category?.icon ||
    '•'
  )
}


function getTransactionSubtitle(transaction) {
  if (transaction.transaction_type === 'transfer') {
    return `${
      transaction.from_account?.name || ''
    } → ${
      transaction.to_account?.name || ''
    }`
  }

  return transaction.account?.name || ''
}


function getAmountClass(transaction) {
  if (transaction.transaction_type === 'income') {
    return 'income'
  }

  if (transaction.transaction_type === 'expense') {
    return 'expense'
  }

  return 'transfer'
}


function getAmountPrefix(transaction) {
  if (transaction.transaction_type === 'income') {
    return '+'
  }

  if (transaction.transaction_type === 'expense') {
    return '-'
  }

  return ''
}


async function loadTransactions() {
  loading.value = true
  errorMessage.value = ''

  try {
    transactions.value =
      await getTransactionsForMonth(
        selectedYear.value,
        selectedMonth.value
      )
  } catch (error) {
    console.error(error)

    errorMessage.value =
      error.message ||
      'Could not load transactions.'
  } finally {
    loading.value = false
  }
}


function previousMonth() {
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12
    selectedYear.value -= 1
  } else {
    selectedMonth.value -= 1
  }

  loadTransactions()
}


function nextMonth() {
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1
    selectedYear.value += 1
  } else {
    selectedMonth.value += 1
  }

  loadTransactions()
}


onActivated(async () => {
  if (lastSeenVersion === dataVersion.value) {
    return
  }

  await loadTransactions()

  lastSeenVersion = dataVersion.value
})
</script>


<template>
  <section class="tracker-page">

    <!-- MONTH -->

    <header class="month-header">
      <button
        class="month-button"
        type="button"
        @click="previousMonth"
      >
        ‹
      </button>

      <h1>
        {{ monthLabel }}
      </h1>

      <button
        class="month-button"
        type="button"
        @click="nextMonth"
      >
        ›
      </button>
    </header>


    <!-- TITLE -->

    <header class="page-heading">
      <h1>
        Transactions
      </h1>

      <p>
        Your daily activity for this month.
      </p>
    </header>


    <!-- LOADING -->

    <div
      v-if="loading"
      class="empty-state"
    >
      Loading transactions...
    </div>


    <!-- ERROR -->

    <div
      v-else-if="errorMessage"
      class="empty-state"
    >
      {{ errorMessage }}

      <button
        class="secondary-button manage-retry-button"
        type="button"
        @click="loadTransactions"
      >
        Try Again
      </button>
    </div>


    <!-- EMPTY -->

    <div
      v-else-if="!transactions.length"
      class="empty-state"
    >
      No transactions for this month.
    </div>


    <!-- TRANSACTIONS -->

    <div v-else>
      <section
        v-for="[date, dayTransactions] in groupedTransactions"
        :key="date"
        class="day-group"
      >
        <header class="day-heading">
          <strong>
            {{ getDayNumber(date) }}
          </strong>

          <span>
            {{ getWeekday(date) }}
          </span>
        </header>


        <div class="daily-transaction-list">
          <article
            v-for="transaction in dayTransactions"
            :key="transaction.id"
            class="transaction-row"
          >
            <div class="transaction-left">
              <div class="transaction-icon">
                {{ getTransactionIcon(transaction) }}
              </div>

              <div class="transaction-info">
                <span class="transaction-name">
                  {{ getTransactionTitle(transaction) }}
                </span>

                <span class="transaction-note">
                  {{ getTransactionSubtitle(transaction) }}
                </span>

                <span
                  v-if="transaction.notes"
                  class="transaction-extra-note"
                >
                  {{ transaction.notes }}
                </span>
              </div>
            </div>


            <div class="transaction-right">
              <span
                class="transaction-amount"
                :class="getAmountClass(transaction)"
              >
                {{ getAmountPrefix(transaction) }}
                {{ formatCurrency(transaction.amount) }}
              </span>

              <span
                v-if="
                  transaction.transaction_type !== 'transfer' &&
                  !transaction.paid
                "
                class="pending-badge"
              >
                Pending
              </span>
            </div>
          </article>
        </div>
      </section>
    </div>

  </section>
</template>