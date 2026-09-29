import { supabase } from '../lib/supabase'

// Usado enquanto o banco não responde (ou se a tabela config ainda não existir)
export const CONFIG_PADRAO = {
  nome: 'Sushimania',
  cor: '#e63946',
  logo_url: null,
  destaque_url: null,
  banner_titulo: 'Escolha sua comida',
  banner_destaque: 'favorita.',
  banner_texto: 'Aproveite nosso cardápio! Escolha o que desejar e receba em sua casa de forma rápida e segura.',
  whatsapp: import.meta.env.VITE_WHATSAPP ?? '',
  telefone: import.meta.env.VITE_TELEFONE ?? '',
  instagram: '',
  facebook: '',
}

export async function obterConfig() {
  const { data, error } = await supabase.from('config').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  return data
}

export async function salvarConfig(campos) {
  const { error } = await supabase.from('config').update(campos).eq('id', 1)
  if (error) throw error
}
