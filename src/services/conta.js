import { supabase } from '../lib/supabase'

// Conta do cliente com celular + senha, sem SMS: o Supabase Auth trabalha com e-mail,
// então cada celular vira um e-mail interno (nunca recebe mensagem). Por isso a opção
// "Confirm email" precisa estar DESLIGADA no Supabase (Authentication > Providers > Email).
const DOMINIO = 'cliente.sushimania.app'
export const emailDoTelefone = (telefone) => `${telefone}@${DOMINIO}`

// "(99) 98123-4567" -> "99981234567" (DDD + número; tira o 55 do país se vier junto)
export const soTelefone = (texto = '') => {
  const n = texto.replace(/\D/g, '')
  return n.length > 11 && n.startsWith('55') ? n.slice(2) : n
}
export const telefoneValido = (n) => /^\d{10,11}$/.test(n)

export const mascaraTelefone = (texto = '') => {
  const n = soTelefone(texto).slice(0, 11)
  if (n.length <= 2) return n
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
}

// Mensagens do Supabase em português
function traduzir(error) {
  const m = error?.message ?? ''
  if (/already registered|already exists/i.test(m) || error?.code === '23505') return 'Este celular já tem conta. Use "Entrar".'
  if (/invalid login credentials/i.test(m)) return 'Celular ou senha incorretos.'
  if (/password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (/email not confirmed/i.test(m)) return 'Cadastro ainda não liberado. Fale com a loja pelo WhatsApp.'
  // provedor Email desligado no Supabase (Authentication > Sign In / Providers > Email)
  if (/signups? (are )?(disabled|not allowed)|logins are disabled/i.test(m)) return 'Cadastro indisponível no momento. Fale com a loja pelo WhatsApp.'
  return m || 'Algo deu errado. Tente novamente.'
}
export const falhar = (error) => {
  throw new Error(traduzir(error))
}

export async function cadastrar({ nome, telefone, senha }) {
  const { data, error } = await supabase.auth.signUp({ email: emailDoTelefone(telefone), password: senha, options: { data: { nome } } })
  if (error) falhar(error)
  // sem sessão = "Confirm email" ligado no Supabase
  if (!data.session) throw new Error('Cadastro criado, mas ainda não liberado. Fale com a loja pelo WhatsApp.')
  await salvarCliente({ id: data.user.id, nome, telefone })
}

export async function entrar({ telefone, senha }) {
  const { error } = await supabase.auth.signInWithPassword({ email: emailDoTelefone(telefone), password: senha })
  if (error) falhar(error)
}

// Volta para /conta depois do Google; lá o cliente completa o celular se for a primeira vez
export async function entrarComGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/conta` } })
  if (error) falhar(error)
}

export const sair = () => supabase.auth.signOut()

export async function obterCliente(id) {
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).maybeSingle()
  if (error) falhar(error)
  return data
}

export async function salvarCliente({ id, nome, telefone }) {
  const { error } = await supabase.from('clientes').upsert({ id, nome, telefone })
  if (error) falhar(error)
}

export async function listarEnderecos() {
  const { data, error } = await supabase.from('enderecos').select('*').order('criado_em')
  if (error) falhar(error)
  return data
}

export async function salvarEndereco({ id, ...campos }) {
  const query = id ? supabase.from('enderecos').update(campos).eq('id', id) : supabase.from('enderecos').insert(campos)
  const { error } = await query
  if (error) falhar(error)
}

export async function removerEndereco(id) {
  const { error } = await supabase.from('enderecos').delete().eq('id', id)
  if (error) falhar(error)
}

// filtro por cliente_id: um admin logado na loja enxergaria os pedidos de todos (regra do painel)
export async function listarMeusPedidos(clienteId) {
  const { data, error } = await supabase
    .from('pedidos')
    .select('id, codigo, status, itens, subtotal, taxa_entrega, total, endereco, bairro, pagamento, criado_em')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false })
    .limit(30)
  if (error) falhar(error)
  return data
}
