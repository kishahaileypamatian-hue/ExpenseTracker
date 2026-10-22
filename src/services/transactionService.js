import { supabase } from '../lib/supabase'

export async function createTransaction({
  type,
  amount,
  categoryId = null,
  accountId = null,
  fromAccountId = null,
  toAccountId = null,
  date,
  time,
  paid = true,
  notes = '',
}) {
  const {
    data,
    error,
  } = await supabase.rpc(
    'create_transaction',
    {
      p_transaction_type: type,
      p_amount: Number(amount),

      p_category_id:
        categoryId || null,

      p_account_id:
        accountId || null,

      p_from_account_id:
        fromAccountId || null,

      p_to_account_id:
        toAccountId || null,

      p_transaction_date: date,
      p_transaction_time: time,
      p_paid: paid,
      p_notes: notes || '',
    }
  )

  if (error) {
    throw error
  }

  return data
}

export async function updateTransaction({
  id,
  type,
  amount,
  categoryId = null,
  accountId = null,
  fromAccountId = null,
  toAccountId = null,
  date,
  time,
  paid = true,
  notes = '',
}) {
  const {
    error,
  } = await supabase.rpc(
    'update_transaction',
    {
      p_transaction_id: id,
      p_transaction_type: type,
      p_amount: Number(amount),

      p_category_id:
        categoryId || null,

      p_account_id:
        accountId || null,

      p_from_account_id:
        fromAccountId || null,

      p_to_account_id:
        toAccountId || null,

      p_transaction_date: date,
      p_transaction_time: time,
      p_paid: paid,
      p_notes: notes || '',
    }
  )

  if (error) {
    throw error
  }
}

export async function deleteTransaction(transactionId) {
  const {
    error,
  } = await supabase.rpc(
    'delete_transaction',
    {
      p_transaction_id: transactionId,
    }
  )

  if (error) {
    throw error
  }
}

export async function getTransactionsForMonth(
  year,
  month
) {
  const startDate =
    `${year}-${String(month).padStart(2, '0')}-01`

  const nextMonth =
    month === 12
      ? {
          year: year + 1,
          month: 1,
        }
      : {
          year,
          month: month + 1,
        }

  const endDate =
    `${nextMonth.year}-${String(nextMonth.month).padStart(2, '0')}-01`

  const {
    data,
    error,
  } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories (
        id,
        name,
        icon,
        type
      ),
      account:accounts!transactions_account_id_fkey (
        id,
        name
      ),
      from_account:accounts!transactions_from_account_id_fkey (
        id,
        name
      ),
      to_account:accounts!transactions_to_account_id_fkey (
        id,
        name
      )
    `)
    .gte('transaction_date', startDate)
    .lt('transaction_date', endDate)
    .order('transaction_date', {
      ascending: false,
    })
    .order('transaction_time', {
      ascending: false,
    })

  if (error) {
    throw error
  }

  return data
}


export async function getAllAccounts() {
  const {
    data,
    error,
  } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', {
      ascending: true,
    })

  if (error) {
    throw error
  }

  return data
}