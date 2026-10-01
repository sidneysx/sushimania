import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6'
import { listarCategorias } from '../../services/categorias'
import { listarProdutos } from '../../services/produtos'
import { normalizarTexto } from '../../lib/formatar'
import CardProduto from './CardProduto'

const Lista = ({ produtos }) => (
  <div className="grid divide-y divide-gray-100 md:grid-cols-2 md:gap-x-8 md:divide-y-0">
    {produtos.map((p) => (
      <CardProduto key={p.id} produto={p} />
    ))}
  </div>
)

// Cardápio inteiro numa página só, uma seção por categoria. A barra de cima (pesquisa + abas)
// gruda no topo; a aba acende conforme a rolagem e tocar nela leva até a seção.
export default function Cardapio() {
  const [categorias, setCategorias] = useState([])
  const [produtos, setProdutos] = useState([])
  const [ativa, setAtiva] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [busca, setBusca] = useState('')
  const barra = useRef(null)
  const abas = useRef(null)
  // enquanto a página desliza até a seção tocada, a rolagem não troca a aba
  const indoPara = useRef(false)
  const espera = useRef(0)

  useEffect(() => {
    Promise.all([listarCategorias({ somenteAtivas: true }), listarProdutos({ somenteAtivos: true })])
      .then(([cats, prods]) => {
        setCategorias(cats)
        setProdutos(prods)
      })
      .catch((e) => {
        console.error(e)
        setErro(true)
      })
      .finally(() => setCarregando(false))
  }, [])

  const termo = normalizarTexto(busca)
  const buscando = termo.length > 0
  const resultados = buscando ? produtos.filter((p) => normalizarTexto(`${p.nome} ${p.descricao ?? ''}`).includes(termo)) : []
  // categoria sem produto não aparece
  const secoes = categorias.map((c) => ({ categoria: c, itens: produtos.filter((p) => p.categoria_id === c.id) })).filter((s) => s.itens.length)
  const idsSecoes = secoes.map((s) => s.categoria.id).join(',')

  const alturaBarra = () => barra.current?.offsetHeight ?? 0

  // Aba ativa = última seção cujo topo já passou da barra
  useEffect(() => {
    if (buscando || !idsSecoes) return
    const ids = idsSecoes.split(',')
    let quadro = 0
    const aoRolar = () => {
      cancelAnimationFrame(quadro)
      quadro = requestAnimationFrame(() => {
        if (indoPara.current) return
        const limite = alturaBarra() + 16
        let atual = ids[0]
        for (const id of ids) {
          const el = document.getElementById(`secao-${id}`)
          if (el && el.getBoundingClientRect().top <= limite) atual = id
        }
        setAtiva(atual)
      })
    }
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => {
      cancelAnimationFrame(quadro)
      window.removeEventListener('scroll', aoRolar)
    }
  }, [buscando, idsSecoes])

  // Mantém a aba ativa visível na barra de abas (rola só a barra, nunca a página)
  useEffect(() => {
    const caixa = abas.current
    const botao = caixa?.querySelector(`[data-aba="${ativa}"]`)
    if (!botao) return
    caixa.scrollTo({ left: botao.offsetLeft - caixa.clientWidth / 2 + botao.clientWidth / 2, behavior: 'smooth' })
  }, [ativa])

  const irPara = (id) => {
    setBusca('')
    setAtiva(String(id))
    // depois de limpar a pesquisa as seções voltam a existir: espera o React desenhar
    requestAnimationFrame(() => {
      const el = document.getElementById(`secao-${id}`)
      if (!el) return
      indoPara.current = true
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - alturaBarra(), behavior: 'smooth' })
      clearTimeout(espera.current)
      espera.current = setTimeout(() => (indoPara.current = false), 900)
    })
  }

  return (
    <section id="cardapio" className="bg-white pb-28">
      {carregando && <p className="py-10 text-center text-gray-500">Carregando cardápio...</p>}
      {erro && <p className="py-10 text-center text-red-600">Não foi possível carregar o cardápio.</p>}
      {!carregando && !erro && secoes.length === 0 && <p className="py-10 text-center text-gray-500">Nenhum item disponível no momento.</p>}

      {secoes.length > 0 && (
        <>
          <div id="barra-cardapio" ref={barra} className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 pt-3 backdrop-blur-xl">
            <div className="mx-auto max-w-5xl px-4 md:px-6">
              <label className="flex items-center gap-3 rounded-2xl bg-gray-100 px-4 py-2.5 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-marca/30">
                <FaMagnifyingGlass className="shrink-0 text-gray-400" />
                <input
                  id="busca-cardapio"
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="O que você quer comer hoje?"
                  aria-label="Pesquisar no cardápio"
                  className="w-full bg-transparent text-base outline-none placeholder:text-gray-400 [&::-webkit-search-cancel-button]:hidden"
                />
                {busca && (
                  <button type="button" onClick={() => setBusca('')} aria-label="Limpar pesquisa" className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700">
                    <FaXmark />
                  </button>
                )}
              </label>
            </div>

            <div ref={abas} className="relative mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] md:px-6 [&::-webkit-scrollbar]:hidden">
              {secoes.map(({ categoria: c }) => {
                const marcada = ativa === String(c.id) && !buscando
                return (
                  <button
                    key={c.id}
                    data-aba={c.id}
                    onClick={() => irPara(c.id)}
                    className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      marcada ? 'text-white' : 'text-gray-600 hover:bg-marca/10'
                    }`}
                  >
                    {marcada && <motion.span layoutId="categoria-ativa" className="absolute inset-0 rounded-full bg-marca" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                    {c.icone && <span className="relative">{c.icone}</span>}
                    <span className="relative whitespace-nowrap">{c.nome}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mx-auto max-w-5xl px-4 md:px-6">
            {buscando ? (
              <div className="pt-4">
                <p className="mb-2 text-sm text-gray-500">
                  {resultados.length
                    ? `${resultados.length} resultado${resultados.length > 1 ? 's' : ''} para "${busca.trim()}"`
                    : `Nenhum item encontrado para "${busca.trim()}". Tente outra palavra.`}
                </p>
                <Lista produtos={resultados} />
              </div>
            ) : (
              secoes.map(({ categoria, itens }) => (
                <div key={categoria.id} id={`secao-${categoria.id}`} className="pt-8">
                  <h2 className="mb-2 flex items-center justify-center gap-2 text-lg font-extrabold tracking-wide uppercase">
                    {categoria.icone && <span>{categoria.icone}</span>}
                    {categoria.nome}
                  </h2>
                  <Lista produtos={itens} />
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  )
}
