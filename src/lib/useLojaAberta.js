import { useEffect, useState } from 'react'
import { useConfig } from '../context/ConfigContext'
import { situacaoDaLoja } from './horario'

// Situação da loja agora, atualizada a cada 30s (a loja abre/fecha com o site aberto).
// Enquanto a config não carrega, considera aberta para não piscar o aviso de "fechado".
export function useLojaAberta() {
  const { config, carregada } = useConfig()
  const [agora, setAgora] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  if (!carregada) return { aberta: true, fecha: null, abreQuando: null, hoje: null }
  return situacaoDaLoja(config.horarios, agora)
}
