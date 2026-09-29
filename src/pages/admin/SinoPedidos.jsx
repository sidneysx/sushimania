import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Bell, BellOff, BellRing, X } from 'lucide-react'
import { dinheiro, formatarData } from './ui'

/**
 * Sino do topo do painel: mostra quantos pedidos novos chegaram e abre um cartão com eles.
 * O cartão abre sozinho quando chega pedido e só fecha quando o admin clica.
 */
export default function SinoPedidos({ alertas, somLigado, onAlternarSom, onDispensar, onDispensarTodos, onVer }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  const qtdAnterior = useRef(alertas.length)

  // Chegou alerta novo: abre o cartão
  useEffect(() => {
    if (alertas.length > qtdAnterior.current) setAberto(true)
    qtdAnterior.current = alertas.length
  }, [alertas.length])

  // Clique fora fecha
  useEffect(() => {
    if (!aberto) return
    const fora = (e) => !ref.current?.contains(e.target) && setAberto(false)
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [aberto])

  const qtd = alertas.length
  const Icone = qtd ? BellRing : somLigado ? Bell : BellOff

  const ver = (pedido) => {
    setAberto(false)
    onDispensar(pedido.id)
    onVer(pedido)
  }

  return (
    <div ref={ref} className="relative ml-auto">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label={qtd ? `${qtd} pedido(s) novo(s)` : 'Avisos de pedidos'}
        aria-expanded={aberto}
        className={`relative grid size-10 place-items-center rounded-xl border transition ${
          qtd ? 'border-marca bg-marca text-white' : somLigado ? 'border-marca/40 bg-marca/10 text-marca' : 'border-neutral-200 bg-white text-neutral-400 hover:border-marca'
        }`}
      >
        <Icone className={`size-4 ${qtd ? 'animate-bounce' : ''}`} />
        {qtd > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-neutral-950 px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {qtd}
          </span>
        )}
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <p className="font-semibold">{qtd ? `🛎️ ${qtd} pedido${qtd > 1 ? 's' : ''} novo${qtd > 1 ? 's' : ''}` : 'Avisos de pedidos'}</p>
              {qtd > 1 && (
                <button onClick={onDispensarTodos} className="text-xs font-medium text-neutral-500 hover:text-neutral-900">
                  Dispensar todos
                </button>
              )}
            </div>

            {qtd === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-neutral-500">Nenhum pedido novo. Quando chegar, ele aparece aqui.</p>
            ) : (
              <ul className="max-h-80 divide-y divide-neutral-100 overflow-y-auto">
                {alertas.map((p) => (
                  <li key={p.id} className="flex items-start gap-3 px-4 py-3">
                    <button onClick={() => ver(p)} className="min-w-0 flex-1 text-left">
                      <p className="flex items-center gap-2 text-sm">
                        <span className="font-mono font-bold">#{p.codigo}</span>
                        <span className="truncate font-medium">{p.cliente_nome}</span>
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        {p.bairro} · {formatarData(p.criado_em, { timeStyle: 'short' })}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-marca">
                        {dinheiro.format(p.total)} <ArrowRight className="size-3.5" />
                      </p>
                    </button>
                    <button onClick={() => onDispensar(p.id)} aria-label="Dispensar aviso" className="grid size-7 shrink-0 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={onAlternarSom}
              className="flex w-full items-center justify-between border-t border-neutral-100 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              <span className="flex items-center gap-2">
                {somLigado ? <Bell className="size-4 text-marca" /> : <BellOff className="size-4 text-neutral-400" />}
                Som de pedido novo
              </span>
              <span className={`relative h-5 w-9 rounded-full transition ${somLigado ? 'bg-marca' : 'bg-neutral-300'}`}>
                <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${somLigado ? 'left-[18px]' : 'left-0.5'}`} />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
