<script setup>
import {
  computed,
  onActivated,
  ref,
} from 'vue'

import {
  useDataRefresh,
} from '../composables/useDataRefresh'

import TransactionModal from '../components/transactions/TransactionModal.vue'

import {
  getAllAccounts,
  getTransactionsForMonth,
} from '../services/transactionService'


const {
  dataVersion,
} = useDataRefresh()

let lastSeenVersion = -1
const editingTransaction = ref(null)
const transactionModalOpen = ref(false)

const loading = ref(true)
const errorMessage = ref('')

const accounts = ref([])
const transactions = ref([])


const now = new Date()

const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1)


function openTransactionEditor(transaction) {
  editingTransaction.value = transaction
  transactionModalOpen.value = true
  
}


function closeTransactionModal() {
  transactionModalOpen.value = false
  editingTransaction.value = null
}
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


const incomeTransactions = computed(() => {
  return transactions.value.filter(
    (transaction) =>
      transaction.transaction_type === 'income'
  )
})


const expenseTransactions = computed(() => {
  return transactions.value.filter(
    (transaction) =>
      transaction.transaction_type === 'expense'
  )
})


const savingsTransfers = computed(() => {
  const savingsAccountIds =
    accounts.value
      .filter(
        (account) =>
          account.account_type === 'savings'
      )
      .map(
        (account) => account.id
      )

  return transactions.value.filter(
    (transaction) =>
      transaction.transaction_type === 'transfer' &&
      savingsAccountIds.includes(
        transaction.to_account_id
      )
  )
})

const incomeCategoryTotals = computed(() => {
  const totals = {}

  for (const transaction of transactions.value) {
    if (
      transaction.transaction_type !== 'income' ||
      !transaction.paid
    ) {
      continue
    }

    const name =
      transaction.category?.name || 'Other Income'

    const icon =
      transaction.category?.icon || '+'

    if (!totals[name]) {
      totals[name] = {
        name,
        icon,
        amount: 0,
      }
    }

    totals[name].amount +=
      Number(transaction.amount || 0)
  }

  return Object.values(totals)
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
})


const expenseCategoryTotals = computed(() => {
  const totals = {}

  for (const transaction of transactions.value) {
    if (
      transaction.transaction_type !== 'expense' ||
      !transaction.paid
    ) {
      continue
    }

    const name =
      transaction.category?.name || 'Other'

    const icon =
      transaction.category?.icon || '•'

    if (!totals[name]) {
      totals[name] = {
        name,
        icon,
        amount: 0,
      }
    }

    totals[name].amount +=
      Number(transaction.amount || 0)
  }

  return Object.values(totals)
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
})


const savingsAccountTotals = computed(() => {
  const totals = {}

  for (const transaction of savingsTransfers.value) {
    const account =
      transaction.to_account

    if (!account) {
      continue
    }

    if (!totals[account.id]) {
      totals[account.id] = {
        id: account.id,
        name: account.name,
        amount: 0,
      }
    }

    totals[account.id].amount +=
      Number(transaction.amount || 0)
  }

  return Object.values(totals)
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
})

const totalIncome = computed(() => {
  return incomeTransactions.value
    .filter(
      (transaction) =>
        transaction.paid
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    )
})


const totalExpenses = computed(() => {
  return expenseTransactions.value
    .filter(
      (transaction) =>
        transaction.paid
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    )
})


const totalBalance = computed(() => {
  return accounts.value.reduce(
    (total, account) =>
      total + Number(account.balance || 0),
    0
  )
})


const savingsBalance = computed(() => {
  return accounts.value
    .filter(
      (account) =>
        account.account_type === 'savings'
    )
    .reduce(
      (total, account) =>
        total + Number(account.balance || 0),
      0
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


async function loadHomeData() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [
      accountData,
      transactionData,
    ] = await Promise.all([
      getAllAccounts(),

      getTransactionsForMonth(
        selectedYear.value,
        selectedMonth.value
      ),
    ])

    accounts.value = accountData
    transactions.value = transactionData
  } catch (error) {
    console.error(error)

    errorMessage.value =
      error.message ||
      'Could not load your tracker.'
  } finally {
    loading.value = false
  }
}


async function handleTransactionCreated() {
  transactionModalOpen.value = false
  editingTransaction.value = null

  await loadHomeData()
}


function previousMonth() {
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12
    selectedYear.value -= 1
  } else {
    selectedMonth.value -= 1
  }

  loadHomeData()
}


function nextMonth() {
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1
    selectedYear.value += 1
  } else {
    selectedMonth.value += 1
  }

  loadHomeData()
}


onActivated(async () => {
  if (lastSeenVersion === dataVersion.value) {
    return
  }

  await loadHomeData()

  lastSeenVersion = dataVersion.value
})
</script>


<template>
  <section class="tracker-page">
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


    <div
      v-if="loading"
      class="empty-state"
    >
      Loading your tracker...
    </div>


    <div
      v-else-if="errorMessage"
      class="empty-state"
    >
      {{ errorMessage }}

      <button
        class="secondary-button manage-retry-button"
        type="button"
        @click="loadHomeData"
      >
        Try Again
      </button>
    </div>


    <template v-else>
      <!-- SUMMARY -->

      <section>
        <h2 class="section-title">
          Summary
        </h2>

        <div class="summary-grid">
          <article class="summary-card">
            <span>
              Balance
            </span>

            <strong>
              {{ formatCurrency(totalBalance) }}
            </strong>
          </article>

          <article class="summary-card">
            <span>
              Income
            </span>

            <strong>
              {{ formatCurrency(totalIncome) }}
            </strong>
          </article>

          <article class="summary-card">
            <span>
              Expenses
            </span>

            <strong>
              {{ formatCurrency(totalExpenses) }}
            </strong>
          </article>

          <article class="summary-card">
            <span>
              Savings
            </span>

            <strong>
              {{ formatCurrency(savingsBalance) }}
            </strong>
          </article>
        </div>
      </section>


      <!-- INCOME -->

        <section class="transaction-section">
          <h2 class="section-title">
            Income
          </h2>

          <div
            v-if="incomeCategoryTotals.length"
            class="home-transaction-list"
          >
            <article
              v-for="category in incomeCategoryTotals"
              :key="category.name"
              class="transaction-row"
            >
              <div class="transaction-left">
                <div class="transaction-icon">
                  {{ category.icon }}
                </div>

                <div class="transaction-info">
                  <span class="transaction-name">
                    {{ category.name }}
                  </span>
                </div>
              </div>

              <span class="transaction-amount income">
                +{{ formatCurrency(category.amount) }}
              </span>
            </article>
          </div>

          <p
            v-else
            class="empty-state"
          >
            No income yet.
          </p>
        </section>


      <!-- EXPENSES -->

      <section class="transaction-section">
        <h2 class="section-title">
          Expenses
        </h2>

        <div
          v-if="expenseCategoryTotals.length"
          class="home-transaction-list"
        >
          <article
            v-for="category in expenseCategoryTotals"
            :key="category.name"
            class="transaction-row"
          >
            <div class="transaction-left">
              <div class="transaction-icon">
                {{ category.icon }}
              </div>

              <div class="transaction-info">
                <span class="transaction-name">
                  {{ category.name }}
                </span>
              </div>
            </div>

            <span class="transaction-amount expense">
              -{{ formatCurrency(category.amount) }}
            </span>
          </article>
        </div>

        <p
          v-else
          class="empty-state"
        >
          No expenses yet.
        </p>
      </section>


      <!-- SAVINGS -->

            <section class="transaction-section">
        <h2 class="section-title">
          Savings
        </h2>

        <div
          v-if="savingsAccountTotals.length"
          class="home-transaction-list"
        >
          <article
            v-for="account in savingsAccountTotals"
            :key="account.id"
            class="transaction-row"
          >
            <div class="transaction-left">
              <div class="transaction-icon">
                ♡
              </div>

              <div class="transaction-info">
                <span class="transaction-name">
                  {{ account.name }}
                </span>
              </div>
            </div>

            <span class="transaction-amount transfer">
              +{{ formatCurrency(account.amount) }}
            </span>
          </article>
        </div>

        <p
          v-else
          class="empty-state"
        >
          No savings yet.
        </p>
      </section>
    </template>


    <!-- FLOATING ADD -->

    <button
      class="floating-add-button"
      type="button"
      aria-label="Add transaction"
      @click="
  editingTransaction = null;
  transactionModalOpen = true
"
    >
      +
    </button>


    <TransactionModal
      :open="transactionModalOpen"
      :transaction="editingTransaction"
      @close="closeTransactionModal"
      @created="handleTransactionCreated"
      @deleted="handleTransactionCreated"
    />
  </section>
</template>