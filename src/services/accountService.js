import { supabase } from '../lib/supabase'


export async function getAccounts({
  includeArchived = false,
} = {}) {
  let query = supabase
    .from('accounts')
    .select('*')
    .order('created_at', {
      ascending: true,
    })

  if (!includeArchived) {
    query = query.eq('archived', false)
  }

  const {
    data,
    error,
  } = await query

  if (error) {
    throw error
  }

  return data
}


export async function createAccount({
  name,
  balance,
  accountType,
}) {
  const {
    data: {
      user,
    },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  const {
    data,
    error,
  } = await supabase
    .from('accounts')
    .insert({
      user_id: user.id,
      name,
      balance: Number(balance || 0),
      account_type: accountType,
      is_default: false,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}


export async function renameAccount(
  accountId,
  name
) {
  const {
    data,
    error,
  } = await supabase
    .from('accounts')
    .update({
      name,
    })
    .eq('id', accountId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}


export async function archiveAccount(
  accountId
) {
  const {
    error,
  } = await supabase
    .from('accounts')
    .update({
      archived: true,
      archived_at: new Date().toISOString(),
    })
    .eq('id', accountId)

  if (error) {
    throw error
  }
}


export async function restoreAccount(
  accountId
) {
  const {
    error,
  } = await supabase
    .from('accounts')
    .update({
      archived: false,
      archived_at: null,
    })
    .eq('id', accountId)

  if (error) {
    throw error
  }
}


export async function deleteAccount(
  accountId
) {
  const {
    error,
  } = await supabase.rpc(
    'delete_account_if_unused',
    {
      p_account_id: accountId,
    }
  )

  if (error) {
    throw error
  }
}