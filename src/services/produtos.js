import { supabase } from '../lib/supabase'

const BUCKET = 'produtos'

export async function listarProdutos({ categoriaId, somenteAtivos = false } = {}) {
  let query = supabase
    .from('produtos')
    .select('*, categoria:categorias(nome)')
    .order('ordem')
    .order('nome')

  if (categoriaId) query = query.eq('categoria_id', categoriaId)
  if (somenteAtivos) query = query.eq('ativo', true)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function salvarProduto({ id, ...campos }) {
  const query = id
    ? supabase.from('produtos').update(campos).eq('id', id)
    : supabase.from('produtos').insert(campos)

  const { error } = await query
  if (error) throw error
}

export async function excluirProduto(produto) {
  const { error } = await supabase.from('produtos').delete().eq('id', produto.id)
  if (error) throw error
  await removerImagem(produto.imagem_url)
}

// pasta: '' para fotos de produto, 'site' para logo/foto de destaque
export async function enviarImagem(arquivo, pasta = '') {
  const extensao = arquivo.name.split('.').pop()
  const caminho = `${pasta ? `${pasta}/` : ''}${crypto.randomUUID()}.${extensao}`

  const { error } = await supabase.storage.from(BUCKET).upload(caminho, arquivo)
  if (error) throw error

  return supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl
}

export async function removerImagem(url) {
  const marcador = `/${BUCKET}/`
  if (!url?.includes(marcador)) return
  const caminho = url.split(marcador).pop()
  await supabase.storage.from(BUCKET).remove([caminho])
}
