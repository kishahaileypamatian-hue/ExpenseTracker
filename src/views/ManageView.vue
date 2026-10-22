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
  archiveAccount,
  deleteAccount,
  getAccounts,
  renameAccount,
  restoreAccount,
} from '../services/accountService'

import {
  archiveCategory,
  deleteCategory,
  getCategories,
  renameCategory,
  restoreCategory,
} from '../services/categoryService'

import CreateNewModal from '../components/manage/CreateNewModal.vue'
import TransactionModal from '../components/transactions/TransactionModal.vue'


const {
  dataVersion,
  markDataChanged,
} = useDataRefresh()

let lastSeenVersion = -1

const createModalOpen = ref(false)
const transferModalOpen = ref(false)
const archiveModalOpen = ref(false)
const archiveTab = ref('accounts')

const accounts = ref([])
const categories = ref([])

const loading = ref(false)
const errorMessage = ref('')

const editingAccounts = ref(false)
const editingCategories = ref(false)

const deletingId = ref(null)

async function handleCreated() {
  createModalOpen.value = false

  markDataChanged()

  await loadData()

  lastSeenVersion = dataVersion.value
}


const activeAccounts = computed(() => {
  return accounts.value.filter(
    (account) => !account.archived
  )
})

const archivedAccounts = computed(() => {
  return accounts.value.filter(
    (account) => account.archived
  )
})


const activeExpenseCategories = computed(() => {
  return categories.value.filter(
    (category) =>
      category.type === 'expense' &&
      !category.archived
  )
})

const activeIncomeCategories = computed(() => {
  return categories.value.filter(
    (category) =>
      category.type === 'income' &&
      !category.archived
  )
})

const archivedCategories = computed(() => {
  return categories.value.filter(
    (category) => category.archived
  )
})

async function handleRenameAccount(account) {
  const name = window.prompt(
    'New account name:',
    account.name
  )

  if (!name?.trim()) {
    return
  }

  try {
    await renameAccount(
      account.id,
      name.trim()
    )

    markDataChanged()

await loadData()

lastSeenVersion = dataVersion.value
  } catch (error) {
    alert(
      error.message ||
      'Could not rename account.'
    )
  }
}


async function handleRenameCategory(category) {
  const name = window.prompt(
    'New category name:',
    category.name
  )

  if (!name?.trim()) {
    return
  }

  try {
    await renameCategory(
      category.id,
      name.trim()
    )

markDataChanged()

await loadData()

lastSeenVersion = dataVersion.value
  } catch (error) {
    alert(
      error.message ||
      'Could not rename category.'
    )
  }
}
async function handleArchiveAccount(account) {
  const confirmed = window.confirm(
    `Archive "${account.name}"? It will disappear from new transactions but remain in your transaction history.`
  )

  if (!confirmed) {
    return
  }

  try {
    await archiveAccount(account.id)
    markDataChanged()

await loadData()

lastSeenVersion = dataVersion.value
  } catch (error) {
    alert(
      error.message ||
      'Could not archive account.'
    )
  }
}


async function handleArchiveCategory(category) {
  const confirmed = window.confirm(
    `Archive "${category.name}"? Existing transactions will keep this category.`
  )

  if (!confirmed) {
    return
  }

  try {
    await archiveCategory(category.id)
  markDataChanged()

await loadData()

lastSeenVersion = dataVersion.value
  } catch (error) {
    alert(
      error.message ||
      'Could not archive category.'
    )
  }
}

async function handleRestoreAccount(account) {
  try {
    await restoreAccount(account.id)
    markDataChanged()

await loadData()

lastSeenVersion = dataVersion.value
  } catch (error) {
    alert(
      error.message ||
      'Could not restore account.'
    )
  }
}


async function handleRestoreCategory(category) {
  try {
    await restoreCategory(category.id)
    markDataChanged()

await loadData()

lastSeenVersion = dataVersion.value
  } catch (error) {
    alert(
      error.message ||
      'Could not restore category.'
    )
  }
}




function formatCurrency(amount) {
  return new Intl.NumberFormat(
    'en-PH',
    {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }
  ).format(Number(amount ?? 0))
}

async function loadData() {
  loading.value = true
  errorMessage.value = ''

  try {
   const [
  accountData,
  categoryData,
] = await Promise.all([
  getAccounts({
    includeArchived: true,
  }),

  getCategories({
    includeArchived: true,
  }),
])

    accounts.value = accountData
    categories.value = categoryData
  } catch (error) {
    console.error(error)

    errorMessage.value =
      error.message ||
      'Could not load your accounts and categories.'
  } finally {
    loading.value = false
  }
}
async function handleTransactionCreated() {
  markDataChanged()

  await loadData()

  lastSeenVersion = dataVersion.value
}

async function handleDeleteAccount(account) {
  const confirmed = window.confirm(
    `Permanently delete "${account.name}"?`
  )

  if (!confirmed) {
    return
  }

  deletingId.value = account.id

  try {
    await deleteAccount(account.id)
    markDataChanged()

await loadData()

lastSeenVersion = dataVersion.value
  } catch (error) {
    console.error(error)

    alert(
      error.message ||
      'This account cannot be deleted. Archive it instead.'
    )
  } finally {
    deletingId.value = null
  }
}


async function handleDeleteCategory(category) {
  const confirmed = window.confirm(
    `Permanently delete "${category.name}"?`
  )

  if (!confirmed) {
    return
  }

  deletingId.value = category.id

  try {
    await deleteCategory(category.id)
    markDataChanged()

await loadData()

lastSeenVersion = dataVersion.value
  } catch (error) {
    console.error(error)

    alert(
      error.message ||
      'This category cannot be deleted. Archive it instead.'
    )
  } finally {
    deletingId.value = null
  }
}


onActivated(async () => {
  if (lastSeenVersion === dataVersion.value) {
    return
  }

  await loadData()

  lastSeenVersion = dataVersion.value
})

</script>

<template>
  <section class="tracker-page">
    <header class="page-heading">
      <h1>
        Accounts & Categories
      </h1>

      <p>
        Manage where your money is stored and how your
        transactions are organized.
      </p>
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
        @click="loadData"
      >
        Try Again
      </button>
    </div>

    <template v-else>
      <!-- ACCOUNTS -->

      <section class="manage-section">
        <div class="section-heading-row">
          <h2 class="section-title">
            Accounts
          </h2>

          <button
            class="text-button"
            type="button"
            @click="editingAccounts = !editingAccounts"
          >
            {{ editingAccounts ? 'Done' : 'Edit' }}
          </button>
        </div>

        <div
          v-if="activeAccounts.length"
          class="account-list"
        >
<article
  v-for="account in activeAccounts"
  :key="account.id"
  class="account-card"
>
  <div class="account-info">
    <span class="account-name">
      {{ account.name }}
    </span>

    <small>
      {{ account.account_type }}
    </small>
  </div>

  <div class="manage-row-actions">
    <strong>
      {{ formatCurrency(account.balance) }}
    </strong>

    <template v-if="editingAccounts">
      <button
        class="rename-button"
        type="button"
        @click="handleRenameAccount(account)"
      >
        Rename
      </button>

      <button
        class="archive-button"
        type="button"
        @click="handleArchiveAccount(account)"
      >
        Archive
      </button>

      <button
        class="delete-button"
        type="button"
        @click="handleDeleteAccount(account)"
      >
        Delete
      </button>
    </template>
  </div>
</article>


        </div>

        <div
          v-else
          class="empty-state"
        >
          You don't have any accounts yet.
        </div>

        <button
          class="secondary-button"
          type="button"
          @click="transferModalOpen = true"
        >
          Transfer Balance
        </button>
      </section>


      <!-- CATEGORIES -->

      <section class="manage-section">
        <div class="section-heading-row">
          <h2 class="section-title">
            Categories
          </h2>

          <button
            class="text-button"
            type="button"
            @click="editingCategories = !editingCategories"
          >
            {{ editingCategories ? 'Done' : 'Edit' }}
          </button>
        </div>


        <!-- EXPENSE CATEGORIES -->

<div
  v-if="activeExpenseCategories.length"
  class="category-group"
>
  <p class="category-group-title">
    Expenses
  </p>

  <div class="category-list">
    <article
      v-for="category in activeExpenseCategories"
      :key="category.id"
      class="category-row"
    >
      <div class="category-left">
        <div class="category-icon">
          {{ category.icon || '•' }}
        </div>

        <span>
          {{ category.name }}
        </span>
      </div>

      <div
        v-if="editingCategories"
        class="category-actions"
      >
        <button
          class="rename-button"
          type="button"
          @click="handleRenameCategory(category)"
        >
          Rename
        </button>

        <button
          class="archive-button"
          type="button"
          @click="handleArchiveCategory(category)"
        >
          Archive
        </button>

        <button
          class="delete-button"
          type="button"
          @click="handleDeleteCategory(category)"
        >
          Delete
        </button>
      </div>
    </article>
  </div>
</div>


        <!-- INCOME CATEGORIES -->

        <div
  v-if="activeIncomeCategories.length"
  class="category-group"
>
  <p class="category-group-title">
    Income
  </p>

  <div class="category-list">
    <article
      v-for="category in activeIncomeCategories"
      :key="category.id"
      class="category-row"
    >
      <div class="category-left">
        <div class="category-icon">
          {{ category.icon || '+' }}
        </div>

        <span>
          {{ category.name }}
        </span>
      </div>

      <div
        v-if="editingCategories"
        class="category-actions"
      >
        <button
          class="rename-button"
          type="button"
          @click="handleRenameCategory(category)"
        >
          Rename
        </button>

        <button
          class="archive-button"
          type="button"
          @click="handleArchiveCategory(category)"
        >
          Archive
        </button>

        <button
          class="delete-button"
          type="button"
          @click="handleDeleteCategory(category)"
        >
          Delete
        </button>
      </div>
    </article>
  </div>
</div>

<button
  v-if="archivedAccounts.length || archivedCategories.length"
  class="archive-view-button"
  type="button"
  @click="archiveModalOpen = true"
>
  View Archive

</button>


        <div
          v-if="!categories.length"
          class="empty-state"
        >
          You don't have any categories yet.
        </div>

        <button
          class="primary-button create-new-button"
          type="button"
          @click="createModalOpen = true"
        >
          + Create New
        </button>
      </section>
    </template>

    <CreateNewModal
      :open="createModalOpen"
      @close="createModalOpen = false"
      @created="handleCreated"
    />

      <TransactionModal
        :open="transferModalOpen"
        default-type="transfer"
        @close="transferModalOpen = false"
        @created="handleTransactionCreated"
      />
     <!-- ARCHIVE MODAL -->
<Teleport to="body">
  <div
    v-if="archiveModalOpen"
    class="archive-modal-backdrop"
    @click.self="archiveModalOpen = false"
  >
    <section class="archive-modal">
      <header class="archive-modal-header">
        <div>
          <p class="archive-modal-label">
            Archive
          </p>

          <h2>
            Archived Items
          </h2>
        </div>

        <button
          class="modal-icon-button"
          type="button"
          @click="archiveModalOpen = false"
        >
          ×
        </button>
      </header>

      <div class="archive-tabs">
        <button
          type="button"
          :class="[
            'archive-tab',
            { active: archiveTab === 'accounts' }
          ]"
          @click="archiveTab = 'accounts'"
        >
          Accounts

          <span>
            {{ archivedAccounts.length }}
          </span>
        </button>

        <button
          type="button"
          :class="[
            'archive-tab',
            { active: archiveTab === 'categories' }
          ]"
          @click="archiveTab = 'categories'"
        >
          Categories

          <span>
            {{ archivedCategories.length }}
          </span>
        </button>
      </div>


      <!-- ACCOUNTS TAB -->

      <div v-if="archiveTab === 'accounts'">
        <div
          v-if="archivedAccounts.length"
          class="archive-modal-list"
        >
          <article
            v-for="account in archivedAccounts"
            :key="account.id"
            class="archive-modal-row"
          >
            <div class="archive-modal-info">
              <strong>
                {{ account.name }}
              </strong>

              <small>
                {{ account.account_type }}
                ·
                {{ formatCurrency(account.balance) }}
              </small>
            </div>

            <button
              class="restore-button"
              type="button"
              @click="handleRestoreAccount(account)"
            >
              Restore
            </button>
          </article>
        </div>

        <div
          v-else
          class="empty-state"
        >
          No archived accounts.
        </div>
      </div>


      <!-- CATEGORIES TAB -->

      <div v-else>
        <div
          v-if="archivedCategories.length"
          class="archive-modal-list"
        >
          <article
            v-for="category in archivedCategories"
            :key="category.id"
            class="archive-modal-row"
          >
            <div class="category-left">
              <div class="category-icon">
                {{ category.icon || '•' }}
              </div>

              <div class="archive-modal-info">
                <strong>
                  {{ category.name }}
                </strong>

                <small>
                  {{ category.type }}
                </small>
              </div>
            </div>

            <button
              class="restore-button"
              type="button"
              @click="handleRestoreCategory(category)"
            >
              Restore
            </button>
          </article>
        </div>

        <div
          v-else
          class="empty-state"
        >
          No archived categories.
        </div>
      </div>
    </section>
  </div>
</Teleport>

  </section>
</template>