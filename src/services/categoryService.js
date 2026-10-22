import { supabase } from '../lib/supabase'


export async function getCategories({
  includeArchived = false,
} = {}) {
  let query = supabase
    .from('categories')
    .select('*')
    .order('type', {
      ascending: true,
    })
    .order('name', {
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


export async function createCategory({
  name,
  icon,
  type,
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
    .from('categories')
    .insert({
      user_id: user.id,
      name,
      icon,
      type,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}


export async function renameCategory(
  categoryId,
  name
) {
  const {
    data,
    error,
  } = await supabase
    .from('categories')
    .update({
      name,
    })
    .eq('id', categoryId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}


export async function archiveCategory(
  categoryId
) {
  const {
    error,
  } = await supabase
    .from('categories')
    .update({
      archived: true,
      archived_at: new Date().toISOString(),
    })
    .eq('id', categoryId)

  if (error) {
    throw error
  }
}


export async function restoreCategory(
  categoryId
) {
  const {
    error,
  } = await supabase
    .from('categories')
    .update({
      archived: false,
      archived_at: null,
    })
    .eq('id', categoryId)

  if (error) {
    throw error
  }
}


export async function deleteCategory(
  categoryId
) {
  const {
    error,
  } = await supabase.rpc(
    'delete_category_if_unused',
    {
      p_category_id: categoryId,
    }
  )

  if (error) {
    throw error
  }
}