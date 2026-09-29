import { supabase } from '../lib/supabase'

// Código curto do pedido, sem letras que confundem (O/0, I/1)
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const gerarCodigo = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(6)), (n) => ALFABETO[n % ALFABETO.length]).join('')

export async function registrarPedido(pedido) {
  const { error } = await supabase.from('pedidos').insert(pedido)
  if (error) throw error
}

export async function listarPedidos() {
  const { data, error } = await supabase.from('pedidos').select('*').order('criado_em', { ascending: false })
  if (error) throw error
  return data.map((p) => ({
    ...p,
    subtotal: Number(p.subtotal),
    total: Number(p.total),
    taxa_entrega: p.taxa_entrega === null ? null : Number(p.taxa_entrega),
  }))
}

export async function alterarStatusPedido(id, status) {
  const { error } = await supabase.from('pedidos').update({ status }).eq('id', id)
  if (error) throw error
}

export async function excluirPedido(id) {
  const { error } = await supabase.from('pedidos').delete().eq('id', id)
  if (error) throw error
}
