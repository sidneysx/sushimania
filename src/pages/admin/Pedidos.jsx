import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Bike, ChevronDown, CreditCard, MapPin, Search, ShoppingBag, Trash2 } from 'lucide-react'
import { alterarStatusPedido, excluirPedido } from '../../services/pedidos'
import { usePainel } from './PainelContext'
import { Busca, Confirmar, dinheiro, formatarData, Miniatura, STATUS, StatusPedido, Vazio } from './ui'

const FILTROS = [null, ...Object.keys(STATUS)]

export default function Pedidos() {
  const { pedidos, produtos, recarregar, avisar } = usePainel()
  const [filtro, setFiltro] = useState(null)
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(null)
  const [apagando, setApagando] = useState(null)
  const [confirmando, setConfirmando] = useState(false)

  const fotos = useMemo(() => Object.fromEntries(produtos.map((p) => [String(p.id), p.imagem_url])), [produtos])

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase().replace(/^#/, '')
    return pedidos.filter(
      (p) =>
        (!filtro || p.status === filtro) &&
        (!termo || p.codigo.toLowerCase().includes(termo) || p.cliente_nome.toLowerCase().includes(termo) || p.bairro.toLowerCase().includes(termo)),
    )
  }, [pedidos, filtro, busca])

  const mudarStatus = async (pedido, status) => {
    try {
      await alterarStatusPedido(pedido.id, status)
      await recarregar()
      avisar(`Pedido #${pedido.codigo}: ${STATUS[status].rotulo.toLowerCase()}`)
    } catch (e) {
      avisar(`Não foi possível alterar: ${e.message}`, 'erro')
    }
  }

  const apagar = async () => {
    setConfirmando(true)
    try {
      await excluirPedido(apagando.id)
      setApagando(null)
      await recarregar()
      avisar('Pedido apagado')
    } catch (e) {
      avisar(`Não foi possível apagar: ${e.message}`, 'erro')
    } finally {
      setConfirmando(false)
    }
  }

  if (pedidos.length === 0) {
    return (
      <Vazio
        icone={ShoppingBag}
        titulo="Nenhum pedido ainda"
        texto="Quando um cliente clicar em “Enviar pedido” no site, o pedido aparece aqui com um código (ex.: #K7P2QX), o mesmo que vai na mensagem do WhatsApp."
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Busca valor={busca} onChange={setBusca} placeholder="Buscar por código, cliente ou bairro" />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTROS.map((f) => {
          const ativo = f === filtro
          const qtd = f ? pedidos.filter((p) => p.status === f).length : pedidos.length
          return (
            <button
              key={f ?? 'todos'}
              onClick={() => setFiltro(f)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                ativo ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:ring-marca/50'
              }`}
            >
              {f ? STATUS[f].rotulo : 'Todos'}
              <span className={`text-xs ${ativo ? 'text-marca' : 'text-neutral-400'}`}>{qtd}</span>
            </button>
          )
        })}
      </div>

      {lista.length === 0 ? (
        <Vazio icone={Search} titulo="Nenhum pedido encontrado" texto="Mude o filtro ou a busca." />
      ) : (
        <ul className="space-y-3">
          {lista.map((p) => {
            const expandido = aberto === p.id
            const qtdItens = p.itens.reduce((t, i) => t + (i.qtd ?? 1), 0)
            return (
              <li key={p.id} className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                  <button onClick={() => setAberto(expandido ? null : p.id)} aria-expanded={expandido} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <ChevronDown className={`size-4 shrink-0 text-neutral-400 transition ${expandido ? 'rotate-180' : ''}`} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold">#{p.codigo}</span>
                        <span className="truncate font-medium">{p.cliente_nome}</span>
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatarData(p.criado_em)} · {qtdItens} {qtdItens === 1 ? 'item' : 'itens'} · {p.bairro}
                      </p>
                      {p.aviso && (
                        <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
                          <AlertTriangle className="size-3" /> {p.aviso}
                        </p>
                      )}
                    </div>
                  </button>
                  <p className="font-semibold">
                    {dinheiro.format(p.total)}
                    {p.taxa_entrega === null && <span className="block text-right text-[11px] font-normal text-marca">+ entrega a combinar</span>}
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`status-${p.id}`}>
                      Status do pedido
                    </label>
                    <select
                      id={`status-${p.id}`}
                      value={p.status}
                      onChange={(e) => mudarStatus(p, e.target.value)}
                      className="h-9 rounded-lg border border-neutral-200 bg-white px-2 text-sm outline-none focus:border-marca"
                    >
                      {Object.entries(STATUS).map(([k, s]) => (
                        <option key={k} value={k}>
                          {s.rotulo}
                        </option>
                      ))}
                    </select>
                    <StatusPedido status={p.status} />
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {expandido && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="grid gap-6 border-t border-neutral-100 bg-neutral-50/60 p-4 md:grid-cols-[1fr_300px]">
                        <ul className="space-y-3">
                          {p.itens.map((i, n) => (
                            <li key={n} className="flex items-center gap-3">
                              <Miniatura src={fotos[String(i.id)] ?? i.imagem_url} className="size-12" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{i.nome}</p>
                                <p className="text-xs text-neutral-500">
                                  {i.qtd}x {dinheiro.format(i.preco)}
                                </p>
                              </div>
                              <span className="text-sm font-medium">{dinheiro.format(i.preco * i.qtd)}</span>
                            </li>
                          ))}
                          <li className="space-y-1 border-t border-neutral-200 pt-3 text-sm">
                            <p className="flex justify-between text-neutral-600">
                              <span>Subtotal</span> <span>{dinheiro.format(p.subtotal)}</span>
                            </p>
                            <p className="flex justify-between text-neutral-600">
                              <span>Entrega</span>
                              <span>{p.taxa_entrega === null ? 'a combinar' : dinheiro.format(p.taxa_entrega)}</span>
                            </p>
                            <p className="flex justify-between font-semibold">
                              <span>Total</span> <span>{dinheiro.format(p.total)}</span>
                            </p>
                          </li>
                        </ul>

                        <div className="space-y-3 text-sm">
                          <p className="flex gap-2">
                            <MapPin className="size-4 shrink-0 text-marca" />
                            <span>
                              <b>{p.bairro}</b>
                              <span className="block text-neutral-600">{p.endereco}</span>
                              {p.cep && <span className="block text-xs text-neutral-500">CEP informado: {p.cep}</span>}
                            </span>
                          </p>
                          <p className="flex gap-2">
                            <CreditCard className="size-4 shrink-0 text-marca" />
                            <span>
                              <b>{p.pagamento}</b>
                              {p.troco && <span className="block text-neutral-600">Troco para {p.troco}</span>}
                            </span>
                          </p>
                          {p.taxa_entrega === null && (
                            <p className="flex gap-2 rounded-xl bg-marca/5 p-3 text-xs text-neutral-700">
                              <Bike className="size-4 shrink-0 text-marca" />
                              Bairro sem taxa cadastrada. Combine a entrega pelo WhatsApp e cadastre o bairro em “Bairros e taxas”.
                            </p>
                          )}
                          <button onClick={() => setApagando(p)} className="inline-flex items-center gap-1.5 pt-2 text-xs font-medium text-neutral-500 hover:text-rose-600">
                            <Trash2 className="size-3.5" /> Apagar pedido
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      )}

      <Confirmar
        aberto={!!apagando}
        titulo="Apagar pedido?"
        texto={`O pedido #${apagando?.codigo} de ${apagando?.cliente_nome} sai do painel e das estatísticas. Para pedidos que não aconteceram, prefira marcar como “Cancelado”.`}
        carregando={confirmando}
        onConfirmar={apagar}
        onCancelar={() => setApagando(null)}
      />
    </div>
  )
}
