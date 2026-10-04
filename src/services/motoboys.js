import { supabase } from '../lib/supabase'
import { emailDoTelefone, falhar } from './conta'

// ---------- Painel (admin) ----------

export async function listarMotoboys() {
  const { data, error } = await supabase.from('motoboys').select('*').order('nome')
  if (error) throw error
  return data
}

// A conta precisa existir antes: o motoboy cria a senha em /entregador
export async function adicionarMotoboy({ nome, telefone }) {
  const { error } = await supabase.rpc('adicionar_motoboy', { p_nome: nome, p_telefone: telefone })
  if (error) throw error
}

export async function alterarMotoboy(id, campos) {
  const { error } = await supabase.from('motoboys').update(campos).eq('user_id', id)
  if (error) throw error
}

export async function removerMotoboy(id) {
  const { error } = await supabase.from('motoboys').delete().eq('user_id', id)
  if (error) throw error
}

export async function atribuirMotoboy(pedidoId, motoboyId) {
  const { error } = await supabase.from('pedidos').update({ motoboy_id: motoboyId }).eq('id', pedidoId)
  if (error) throw error
}

// ---------- App do motoboy (/entregador) ----------

// Primeiro acesso: cria só a conta (sem cadastro de cliente); a loja libera depois
export async function criarAcessoMotoboy({ telefone, senha }) {
  const { data, error } = await supabase.auth.signUp({ email: emailDoTelefone(telefone), password: senha })
  if (error) falhar(error)
  if (!data.session) throw new Error('Acesso criado, mas ainda não liberado. Fale com a loja.')
}

export async function meuCadastroMotoboy() {
  const { data: ativo } = await supabase.rpc('is_motoboy')
  if (ativo !== true) return null
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('motoboys').select('*').eq('user_id', user.id).maybeSingle()
  if (error) throw error
  return data
}

// Pedidos do motoboy criados no dia (00:00 até 23:59 no horário do aparelho)
export async function meusPedidosDoDia(motoboyId, dia) {
  const inicio = new Date(dia)
  inicio.setHours(0, 0, 0, 0)
  const fim = new Date(inicio)
  fim.setDate(fim.getDate() + 1)
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('motoboy_id', motoboyId)
    .gte('criado_em', inicio.toISOString())
    .lt('criado_em', fim.toISOString())
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data.map((p) => ({
    ...p,
    subtotal: Number(p.subtotal),
    total: Number(p.total),
    taxa_entrega: p.taxa_entrega === null ? null : Number(p.taxa_entrega),
  }))
}

export async function marcarStatusMotoboy(pedidoId, status) {
  const { error } = await supabase.rpc('motoboy_status', { p_pedido: pedidoId, p_status: status })
  if (error) throw error
}
