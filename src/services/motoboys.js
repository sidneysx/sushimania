import { supabase } from '../lib/supabase'
import { falhar } from './conta'

// Conta do entregador é separada da conta de cliente: mesmo celular, e-mail interno diferente.
// Assim o login de cliente não entra em /entregador e o de entregador não vira cliente na loja.
const DOMINIO = 'motoboy.sushimania.app'
export const emailDoMotoboy = (telefone) => `${telefone}@${DOMINIO}`
export const ehContaMotoboy = (email = '') => email.endsWith(`@${DOMINIO}`)

// ---------- Painel (admin) ----------

export async function listarMotoboys() {
  const { data, error } = await supabase.from('motoboys').select('*').order('nome')
  if (error) throw error
  return data
}

// Autorizar a solicitação (ou liberar de novo quem foi bloqueado)
export async function autorizarMotoboy(id) {
  const { error } = await supabase.from('motoboys').update({ ativo: true, aprovado_em: new Date().toISOString() }).eq('user_id', id)
  if (error) throw error
}

export async function alterarMotoboy(id, campos) {
  const { error } = await supabase.from('motoboys').update(campos).eq('user_id', id)
  if (error) throw error
}

// Motoboy fixo recebe todo pedido novo do site (null = nenhum)
export async function definirMotoboyFixo(id) {
  const { error } = await supabase.rpc('definir_motoboy_fixo', { p_motoboy: id })
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

export async function entrarMotoboy({ telefone, senha }) {
  const { error } = await supabase.auth.signInWithPassword({ email: emailDoMotoboy(telefone), password: senha })
  if (error) falhar(error)
}

// Cadastro do motoboy: cria a conta de entregador e já envia a solicitação.
// Fica pendente até a loja autorizar em Painel > Motoboys.
export async function cadastrarMotoboy({ nome, telefone, senha }) {
  const { data, error } = await supabase.auth.signUp({ email: emailDoMotoboy(telefone), password: senha, options: { data: { nome } } })
  if (error) falhar(error)
  if (!data.session) throw new Error('Cadastro criado, mas ainda não liberado. Fale com a loja.')
  await solicitarAcessoMotoboy({ id: data.user.id, nome, telefone })
}

// Conta de entregador sem solicitação (ex.: foi recusado) pede de novo
export async function solicitarAcessoMotoboy({ id, nome, telefone }) {
  const { error } = await supabase.from('motoboys').insert({ user_id: id, nome, telefone })
  if (error?.code === '23505') throw new Error('Este celular já tem um cadastro de entregador.')
  if (error) throw error
}

// null = ainda não pediu acesso; senão a linha dele (pendente, ativo ou bloqueado)
export async function meuCadastroMotoboy() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
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

export const situacaoMotoboy = (m) => (m.ativo ? 'ativo' : m.aprovado_em ? 'bloqueado' : 'pendente')
