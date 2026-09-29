import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { AlertCircle, ArrowRight, Bike, ImageOff, MapPin, Package, Receipt, ShoppingBag, Table2, TrendingUp, Trophy, Wallet } from 'lucide-react'
import { usePainel } from './PainelContext'
import { Cartao, dinheiro, formatarData, Miniatura, StatusPedido, Vazio } from './ui'

const DIA = 24 * 60 * 60 * 1000
const chaveDia = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

export default function Dashboard() {
  const { produtos, categorias, pedidos, bairros } = usePainel()

  const dados = useMemo(() => {
    const agora = Date.now()
    const validos = pedidos.filter((p) => p.status !== 'cancelado')
    const ult30 = validos.filter((p) => new Date(p.criado_em) >= agora - 30 * DIA)
    const faturamento = ult30.reduce((t, p) => t + p.total, 0)

    // Quantas unidades de cada produto já foram pedidas
    const vendidos = {}
    for (const p of validos) for (const i of p.itens) vendidos[i.id] = (vendidos[i.id] ?? 0) + (i.qtd ?? 1)

    const porId = Object.fromEntries(produtos.map((p) => [String(p.id), p]))
    const nomes = {}
    for (const p of validos) for (const i of p.itens) nomes[i.id] = i.nome

    const maisPedidos = Object.entries(vendidos)
      .map(([id, qtd]) => ({ produto: porId[id], nome: porId[id]?.nome ?? nomes[id], id, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5)

    // Bairros que mais pedem
    const porBairro = {}
    for (const p of validos) {
      const b = (porBairro[p.bairro] ??= { bairro: p.bairro, qtd: 0, valor: 0 })
      b.qtd += 1
      b.valor += p.total
    }
    const topBairros = Object.values(porBairro)
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5)

    // Pedidos de bairros sem taxa cadastrada (taxa "a combinar")
    const semTaxa = [...new Set(pedidos.filter((p) => p.taxa_entrega === null && p.status !== 'cancelado').map((p) => p.bairro))]

    // Últimos 14 dias, inclusive hoje
    const hoje = new Date()
    const serie = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (13 - i))
      return { data: d, chave: chaveDia(d), qtd: 0, valor: 0 }
    })
    const indice = Object.fromEntries(serie.map((s, i) => [s.chave, i]))
    for (const p of validos) {
      const i = indice[chaveDia(new Date(p.criado_em))]
      if (i !== undefined) {
        serie[i].qtd += 1
        serie[i].valor += p.total
      }
    }

    const ativos = produtos.filter((p) => p.ativo)

    return {
      pedidos30: ult30.length,
      faturamento,
      ticket: ult30.length ? faturamento / ult30.length : 0,
      novos: pedidos.filter((p) => p.status === 'novo').length,
      ativos: ativos.length,
      ocultos: produtos.length - ativos.length,
      semFoto: ativos.filter((p) => !p.imagem_url).length,
      semTaxa,
      maisPedidos,
      topBairros,
      serie,
      recentes: pedidos.slice(0, 5),
    }
  }, [produtos, pedidos])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Indicador icone={ShoppingBag} rotulo="Pedidos" valor={dados.pedidos30} detalhe="nos últimos 30 dias" to="/admin/pedidos" />
        <Indicador icone={Wallet} rotulo="Faturamento" valor={dinheiro.format(dados.faturamento)} detalhe="últimos 30 dias, sem cancelados" />
        <Indicador icone={Receipt} rotulo="Ticket médio" valor={dinheiro.format(dados.ticket)} detalhe="valor médio por pedido" />
        <Indicador
          icone={Package}
          rotulo="Produtos no site"
          valor={dados.ativos}
          detalhe={dados.ocultos ? `${dados.ocultos} oculto${dados.ocultos > 1 ? 's' : ''}` : 'todos visíveis'}
          to="/admin/produtos"
        />
      </div>

      {(dados.novos > 0 || dados.semFoto > 0 || dados.semTaxa.length > 0) && (
        <div className="grid gap-3 md:grid-cols-3">
          {dados.novos > 0 && (
            <Alerta to="/admin/pedidos" icone={AlertCircle} destaque>
              <b>{dados.novos}</b> pedido{dados.novos > 1 ? 's' : ''} novo{dados.novos > 1 ? 's' : ''} para confirmar
            </Alerta>
          )}
          {dados.semFoto > 0 && (
            <Alerta to="/admin/produtos?filtro=sem-foto" icone={ImageOff}>
              <b>{dados.semFoto}</b> produto{dados.semFoto > 1 ? 's' : ''} sem foto no cardápio
            </Alerta>
          )}
          {dados.semTaxa.length > 0 && (
            <Alerta to="/admin/bairros" icone={Bike}>
              Pedidos de <b>{dados.semTaxa.length}</b> bairro{dados.semTaxa.length > 1 ? 's' : ''} sem taxa cadastrada ({dados.semTaxa.slice(0, 2).join(', ')}
              {dados.semTaxa.length > 2 ? '…' : ''})
            </Alerta>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <Cartao className="xl:col-span-2">
          <GraficoPedidos serie={dados.serie} />
        </Cartao>

        <Cartao>
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-marca" />
            <h2 className="font-semibold">Resumo do cardápio</h2>
          </div>
          <dl className="mt-4 divide-y divide-neutral-100 text-sm">
            {[
              ['Categorias', categorias.length, '/admin/categorias'],
              ['Produtos visíveis', dados.ativos, '/admin/produtos'],
              ['Ocultos do site', dados.ocultos, '/admin/produtos?filtro=ocultos'],
              ['Sem foto', dados.semFoto, '/admin/produtos?filtro=sem-foto'],
              ['Bairros atendidos', bairros.filter((b) => b.ativo).length, '/admin/bairros'],
            ].map(([rotulo, valor, to]) => (
              <div key={rotulo} className="flex items-center justify-between py-3">
                <dt className="text-neutral-600">{rotulo}</dt>
                <dd>
                  <Link to={to} className="font-semibold text-neutral-900 underline-offset-4 hover:text-marca hover:underline">
                    {valor}
                  </Link>
                </dd>
              </div>
            ))}
          </dl>
        </Cartao>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao>
          <Cabecalho icone={Trophy} titulo="Mais pedidos" subtitulo="Unidades pedidas pelo site (sem cancelados)" />
          {dados.maisPedidos.length === 0 ? (
            <div className="mt-4">
              <Vazio icone={Trophy} titulo="Nenhum pedido ainda" texto="Quando clientes enviarem pedidos pelo site, os pratos mais pedidos aparecem aqui." />
            </div>
          ) : (
            <ol className="mt-4 space-y-3">
              {dados.maisPedidos.map(({ produto, nome, id, qtd }, i) => (
                <li key={id} className="flex items-center gap-3">
                  <span className="w-5 text-center text-lg font-bold text-marca">{i + 1}</span>
                  <Miniatura src={produto?.imagem_url} className="size-11" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{nome ?? 'Produto apagado'}</p>
                    <p className="text-xs text-neutral-500">{produto?.categoria?.nome}</p>
                  </div>
                  <span className="text-sm font-semibold">
                    {qtd} <span className="font-normal text-neutral-500">un.</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Cartao>

        <Cartao>
          <Cabecalho icone={MapPin} titulo="Bairros que mais pedem" subtitulo="Quantidade de pedidos e valor total (sem cancelados)" />
          {dados.topBairros.length === 0 ? (
            <div className="mt-4">
              <Vazio icone={MapPin} titulo="Nenhum pedido ainda" texto="Os bairros com mais pedidos aparecem aqui." />
            </div>
          ) : (
            <ol className="mt-4 space-y-3">
              {dados.topBairros.map((b, i) => (
                <li key={b.bairro} className="flex items-center gap-3">
                  <span className="w-5 text-center text-lg font-bold text-marca">{i + 1}</span>
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-500">
                    <MapPin className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.bairro}</p>
                    <p className="text-xs text-neutral-500">{dinheiro.format(b.valor)}</p>
                  </div>
                  <span className="text-sm font-semibold">
                    {b.qtd} <span className="font-normal text-neutral-500">pedido{b.qtd > 1 ? 's' : ''}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Cartao>
      </div>

      <Cartao>
        <div className="flex items-center justify-between gap-4">
          <Cabecalho icone={ShoppingBag} titulo="Últimos pedidos" />
          <Link to="/admin/pedidos" className="inline-flex items-center gap-1 text-sm font-semibold text-marca hover:brightness-75">
            Ver todos <ArrowRight className="size-4" />
          </Link>
        </div>
        {dados.recentes.length === 0 ? (
          <div className="mt-4">
            <Vazio
              icone={ShoppingBag}
              titulo="Nenhum pedido registrado"
              texto="Cada vez que um cliente clicar em “Enviar pedido”, o pedido aparece aqui com um código, que também vai na mensagem do WhatsApp."
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-100">
            {dados.recentes.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                <span className="font-mono text-xs font-semibold text-neutral-500">#{p.codigo}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{p.cliente_nome}</span>
                <span className="text-neutral-500">{formatarData(p.criado_em)}</span>
                <span className="w-24 text-right font-semibold">{dinheiro.format(p.total)}</span>
                <StatusPedido status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  )
}

function Indicador({ icone: Icone, rotulo, valor, detalhe, to }) {
  const conteudo = (
    <>
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-neutral-950 text-marca">
          <Icone className="size-[18px]" />
        </span>
        {to && <ArrowRight className="size-4 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-marca" />}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">{rotulo}</p>
      <p className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">{valor}</p>
      <p className="mt-1 text-xs text-neutral-500">{detalhe}</p>
    </>
  )
  const classe = `group rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm transition sm:p-5 ${to ? 'hover:border-marca/50 hover:shadow-md' : ''}`
  return to ? (
    <Link to={to} className={classe}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  )
}

function Alerta({ to, icone: Icone, destaque, children }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-2xl p-4 text-sm transition ${
        destaque ? 'bg-neutral-950 text-white hover:bg-neutral-900' : 'border border-marca/25 bg-marca/5 text-neutral-800 hover:border-marca/60'
      }`}
    >
      <Icone className="size-5 shrink-0 text-marca" />
      <span className="flex-1">{children}</span>
      <ArrowRight className="size-4 shrink-0 opacity-60" />
    </Link>
  )
}

function Cabecalho({ icone: Icone, titulo, subtitulo }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icone className="size-4 text-marca" />
        <h2 className="font-semibold">{titulo}</h2>
      </div>
      {subtitulo && <p className="mt-0.5 text-xs text-neutral-500">{subtitulo}</p>}
    </div>
  )
}

// Arredonda o topo do eixo para um número "limpo" (1, 2, 5, 10, 20...)
function topoLimpo(max) {
  if (max <= 4) return 4
  const base = 10 ** Math.floor(Math.log10(max))
  return [1, 2, 5, 10].map((m) => m * base).find((v) => v >= max)
}

function GraficoPedidos({ serie }) {
  const [emTabela, setEmTabela] = useState(false)
  const [focado, setFocado] = useState(null)
  const total = serie.reduce((t, s) => t + s.qtd, 0)
  const topo = topoLimpo(Math.max(...serie.map((s) => s.qtd)))
  const dia = (d, o) => new Intl.DateTimeFormat('pt-BR', o).format(d)

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Pedidos por dia</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Últimos 14 dias · <b className="text-neutral-800">{total}</b> pedido{total === 1 ? '' : 's'} (sem cancelados)
          </p>
        </div>
        <button
          onClick={() => setEmTabela((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:border-marca"
        >
          <Table2 className="size-3.5" /> {emTabela ? 'Ver gráfico' : 'Ver tabela'}
        </button>
      </div>

      {emTabela ? (
        <div className="mt-4 max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white text-left text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="py-2 font-semibold">Dia</th>
                <th className="py-2 text-right font-semibold">Pedidos</th>
                <th className="py-2 text-right font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {[...serie].reverse().map((s) => (
                <tr key={s.chave}>
                  <td className="py-2 capitalize">{dia(s.data, { weekday: 'short', day: '2-digit', month: '2-digit' })}</td>
                  <td className="py-2 text-right font-semibold">{s.qtd}</td>
                  <td className="py-2 text-right text-neutral-600">{dinheiro.format(s.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 flex gap-3">
          <div className="flex h-48 flex-col justify-between pb-6 text-right text-[11px] tabular-nums text-neutral-400">
            <span>{topo}</span>
            <span>{topo / 2}</span>
            <span>0</span>
          </div>
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-42 border-y border-neutral-100">
              <div className="absolute inset-x-0 top-1/2 border-t border-neutral-100" />
            </div>
            <div className="relative flex h-48 items-end" onMouseLeave={() => setFocado(null)}>
              {serie.map((s, i) => (
                <div
                  key={s.chave}
                  className="group relative flex h-full flex-1 cursor-default flex-col items-center justify-end"
                  onMouseEnter={() => setFocado(i)}
                  onFocus={() => setFocado(i)}
                  onBlur={() => setFocado(null)}
                  tabIndex={0}
                  aria-label={`${dia(s.data, { day: '2-digit', month: 'long' })}: ${s.qtd} pedidos, ${dinheiro.format(s.valor)}`}
                >
                  <div className="flex h-42 w-full items-end justify-center px-[1px]">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(s.qtd / topo) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                      className={`w-full max-w-6 rounded-t-[4px] bg-marca transition ${focado === i ? 'brightness-75' : ''}`}
                    />
                  </div>
                  <span className={`mt-2 h-4 text-[10px] tabular-nums ${focado === i ? 'font-semibold text-neutral-900' : 'text-neutral-400'}`}>
                    {dia(s.data, { day: '2-digit' })}
                  </span>

                  {focado === i && (
                    <div
                      className={`pointer-events-none absolute bottom-full z-10 mb-1 w-max rounded-xl bg-neutral-950 px-3 py-2 text-xs text-white shadow-xl ${
                        i < 3 ? 'left-0' : i > 10 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                      }`}
                    >
                      <p className="font-semibold capitalize text-marca">{dia(s.data, { weekday: 'long', day: '2-digit', month: 'short' })}</p>
                      <p className="mt-0.5">
                        {s.qtd} pedido{s.qtd === 1 ? '' : 's'} · {dinheiro.format(s.valor)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
