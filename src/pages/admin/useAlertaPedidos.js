import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { listarPedidos } from '../../services/pedidos'
import { dinheiro } from './ui'

const CHAVE_SOM = 'admin-som-pedidos'
const INTERVALO_RESERVA = 30_000 // se o tempo real cair, confere a cada 30s
const INTERVALO_REPETICAO = 2_000 // o som toca, espera 2s e toca de novo

// ---------- Som ("ding-dong" gerado pelo navegador, sem arquivo de áudio) ----------

let audio = null

// O navegador só libera áudio (e o pedido de permissão de notificação) depois de um clique/toque
function liberarAudio() {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)()
    if (audio.state === 'suspended') audio.resume()
  } catch {
    // navegador sem Web Audio: segue sem som
  }
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
}

export function tocarDing() {
  if (!audio) return
  const agora = audio.currentTime
  // duas notas, repetidas duas vezes
  ;[
    [0, 880],
    [0.18, 1320],
    [0.6, 880],
    [0.78, 1320],
  ].forEach(([inicio, freq]) => {
    const osc = audio.createOscillator()
    const volume = audio.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    volume.gain.setValueAtTime(0.0001, agora + inicio)
    volume.gain.exponentialRampToValueAtTime(0.35, agora + inicio + 0.02)
    volume.gain.exponentialRampToValueAtTime(0.0001, agora + inicio + 0.45)
    osc.connect(volume).connect(audio.destination)
    osc.start(agora + inicio)
    osc.stop(agora + inicio + 0.5)
  })
}

// Alerta de pedido novo: toca, espera 2s e toca de novo
function tocarAlerta() {
  tocarDing()
  setTimeout(tocarDing, INTERVALO_REPETICAO)
}

function lerSom() {
  try {
    return localStorage.getItem(CHAVE_SOM) !== 'false'
  } catch {
    return true
  }
}

// ---------- Hook ----------

/**
 * Mantém a lista de pedidos atualizada sem recarregar a página e avisa quando chega pedido novo:
 * som (2x), alerta no sino do topo (fica até ser dispensado) e notificação do sistema
 * (se a aba estiver em segundo plano).
 */
export function useAlertaPedidos({ ativo, pedidosIniciais, setPedidos, logo, aoClicarNotificacao }) {
  const [somLigado, setSomLigado] = useState(lerSom)
  const [alertas, setAlertas] = useState([]) // pedidos novos ainda não dispensados (mais novo primeiro)
  const conhecidos = useRef(null) // ids já vistos (null = ainda não carregou)
  const somRef = useRef(somLigado)
  useEffect(() => {
    somRef.current = somLigado
  }, [somLigado])

  // Primeiro carregamento: tudo que já existe não é "novo"
  useEffect(() => {
    if (ativo && pedidosIniciais && conhecidos.current === null) {
      conhecidos.current = new Set(pedidosIniciais.map((p) => p.id))
    }
  }, [ativo, pedidosIniciais])

  const anunciar = useCallback(
    (pedido) => {
      setAlertas((atuais) => [pedido, ...atuais.filter((a) => a.id !== pedido.id)])
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        const n = new Notification(`Novo pedido #${pedido.codigo}`, {
          body: `${pedido.cliente_nome} · ${pedido.bairro} · ${dinheiro.format(pedido.total)}`,
          icon: logo || undefined,
          tag: pedido.id,
        })
        n.onclick = () => {
          window.focus()
          aoClicarNotificacao?.()
          n.close()
        }
      }
    },
    [logo, aoClicarNotificacao],
  )

  const conferir = useCallback(async () => {
    if (conhecidos.current === null) return
    try {
      const lista = await listarPedidos()
      const novos = lista.filter((p) => !conhecidos.current.has(p.id))
      lista.forEach((p) => conhecidos.current.add(p.id))
      setPedidos(lista)
      // do mais antigo para o mais novo; o som toca uma vez por lote, não por pedido
      const novosAbertos = novos.filter((p) => p.status === 'novo')
      novosAbertos.reverse().forEach(anunciar)
      if (novosAbertos.length && somRef.current) tocarAlerta()
    } catch (e) {
      console.error('Não foi possível conferir os pedidos:', e.message)
    }
  }, [setPedidos, anunciar])

  // Tempo real (Supabase Realtime) + conferência periódica de reserva
  useEffect(() => {
    if (!ativo) return
    const canal = supabase
      .channel('painel-pedidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => conferir())
      .subscribe()
    const timer = setInterval(conferir, INTERVALO_RESERVA)
    // ao voltar para a aba, confere na hora
    const aoVoltar = () => !document.hidden && conferir()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      supabase.removeChannel(canal)
      clearInterval(timer)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [ativo, conferir])

  // Libera o áudio no primeiro clique dentro do painel
  useEffect(() => {
    document.addEventListener('pointerdown', liberarAudio, { once: true })
    return () => document.removeEventListener('pointerdown', liberarAudio)
  }, [])

  const alternarSom = useCallback(() => {
    liberarAudio()
    const novo = !somLigado
    setSomLigado(novo)
    try {
      localStorage.setItem(CHAVE_SOM, String(novo))
    } catch {
      // sem storage: vale só nesta visita
    }
    if (novo) tocarDing() // amostra do som
  }, [somLigado])

  const dispensar = useCallback((id) => setAlertas((atuais) => atuais.filter((a) => a.id !== id)), [])
  const dispensarTodos = useCallback(() => setAlertas([]), [])

  return { somLigado, alternarSom, alertas, dispensar, dispensarTodos }
}
