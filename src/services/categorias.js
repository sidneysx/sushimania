import { supabase } from '../lib/supabase'

export async function listarCategorias({ somenteAtivas = false } = {}) {
  let query = supabase.from('categorias').select('*').order('ordem').order('nome')
  if (somenteAtivas) query = query.eq('ativo', true)

  const { data, error } = await query
  if (error) throw error
  return data
}

// "Porções hots" -> "porcoes-hots"
const gerarSlug = (nome) =>
  nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export async function salvarCategoria({ id, ...campos }) {
  campos.slug = gerarSlug(campos.nome)

  const query = id
    ? supabase.from('categorias').update(campos).eq('id', id)
    : supabase.from('categorias').insert(campos)

  const { error } = await query
  if (error) throw error
}

export async function excluirCategoria(id) {
  const { error } = await supabase.from('categorias').delete().eq('id', id)
  if (error?.code === '23503') {
    throw new Error('Esta categoria possui produtos. Remova ou mova os produtos antes.')
  }
  if (error) throw error
}
