import { supabase } from '../lib/supabase'

export async function listarBairros({ somenteAtivos = false } = {}) {
  let query = supabase.from('bairros').select('*').order('nome')
  if (somenteAtivos) query = query.eq('ativo', true)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function salvarBairro({ id, ...campos }) {
  const query = id
    ? supabase.from('bairros').update(campos).eq('id', id)
    : supabase.from('bairros').insert(campos)

  const { error } = await query
  if (error?.code === '23505') throw new Error('Já existe um bairro com esse nome.')
  if (error) throw error
}

export async function excluirBairro(id) {
  const { error } = await supabase.from('bairros').delete().eq('id', id)
  if (error) throw error
}

// "Jardim São Luís", "JARDIM SAO LUIS" e "Beira-Rio"/"Beira Rio" viram a mesma chave
export const normalizarBairro = (nome = '') =>
  nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()

export const atende = (b) => b.ativo && Number(b.taxa) > 0

const cepNumero = (cep) => Number(String(cep ?? '').replace(/\D/g, ''))
const temFaixa = (b) => b.cep_inicial && b.cep_final

// O CEP está na região dos bairros cadastrados? (evita CEP de outra cidade)
function dentroDaRegiao(bairros, n) {
  const comFaixa = bairros.filter(temFaixa)
  if (!comFaixa.length) return true
  const menor = Math.min(...comFaixa.map((b) => cepNumero(b.cep_inicial)))
  const maior = Math.max(...comFaixa.map((b) => cepNumero(b.cep_final)))
  // margem até o fim da faixa de milhar (ex.: 65919-999), para CEPs novos da mesma cidade
  return n >= Math.floor(menor / 1000) * 1000 && n <= Math.ceil((maior + 1) / 1000) * 1000 - 1
}

const dentroDaFaixa = (b, n) => temFaixa(b) && cepNumero(b.cep_inicial) <= n && n <= cepNumero(b.cep_final)

/**
 * Sugere o bairro a partir do CEP (o cliente ainda pode escolher outro; ver cepConfere).
 * 1. CEP fora da região dos bairros cadastrados -> null (outra cidade)
 * 2. Nome do bairro devolvido pelo ViaCEP igual a um bairro cadastrado
 * 3. Se o ViaCEP não trouxe um bairro conhecido: a menor faixa de CEP que contém o número
 * Devolve o bairro cadastrado (atendido ou não) ou null.
 */
export function bairroDoCep(bairros, cep, nomeViaCep) {
  const n = cepNumero(cep)
  const comFaixa = bairros.filter(temFaixa)
  if (!dentroDaRegiao(bairros, n)) return null

  if (nomeViaCep) {
    const porNome = bairros.find((b) => normalizarBairro(b.nome) === normalizarBairro(nomeViaCep))
    if (porNome) return porNome
  }

  const tamanho = (b) => cepNumero(b.cep_final) - cepNumero(b.cep_inicial)
  return (
    comFaixa
      .filter((b) => dentroDaFaixa(b, n))
      .sort((a, b) => tamanho(a) - tamanho(b))[0] ?? null
  )
}

/**
 * O CEP combina com o bairro escolhido pelo cliente?
 * - CEP de outra cidade: não
 * - Bairro sem faixa de CEP (residencial/condomínio sem CEP próprio): sim (o painel avisa para conferir)
 * - ViaCEP trouxe um bairro cadastrado: precisa ser o mesmo que foi escolhido
 * - ViaCEP trouxe um nome desconhecido: o CEP precisa estar na faixa do bairro escolhido
 * - ViaCEP não trouxe bairro (CEP geral): sim, não há como conferir
 */
export function cepConfere(bairros, escolhido, cep, nomeViaCep) {
  const n = cepNumero(cep)
  if (!dentroDaRegiao(bairros, n)) return false
  if (!escolhido || !temFaixa(escolhido)) return true
  if (!nomeViaCep) return true

  const doCep = bairros.find((b) => normalizarBairro(b.nome) === normalizarBairro(nomeViaCep))
  if (doCep) return doCep.id === escolhido.id
  return dentroDaFaixa(escolhido, n)
}

// Busca por nome ignorando acento/maiúscula; os que começam com o termo vêm primeiro
export function buscarBairros(bairros, termo, limite = 6) {
  const t = normalizarBairro(termo)
  if (!t) return []
  const achados = bairros.filter((b) => normalizarBairro(b.nome).includes(t))
  const comeca = (b) => (normalizarBairro(b.nome).startsWith(t) ? 0 : 1)
  return achados.sort((a, b) => comeca(a) - comeca(b) || a.nome.localeCompare(b.nome)).slice(0, limite)
}
