import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6'
import { listarCategorias } from '../../services/categorias'
import { listarProdutos } from '../../services/produtos'
import { ITENS_POR_PAGINA } from '../../lib/config'
import { normalizarTexto } from '../../lib/formatar'
import CardProduto from './CardProduto'

export default function Cardapio() {
  const [categorias, setCategorias] = useState([])
  const [produtos, setProdutos] = useState([])
  const [ativa, setAtiva] = useState(null)
  const [verTodos, setVerTodos] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [busca, setBusca] = useState('')
  const inicioLista = useRef(null)

  useEffect(() => {
    Promise.all([listarCategorias({ somenteAtivas: true }), listarProdutos({ somenteAtivos: true })])
      .then(([cats, prods]) => {
        setCategorias(cats)
        setProdutos(prods)
        setAtiva(cats[0]?.id ?? null)
      })
      .catch((e) => {
        console.error(e)
        setErro(true)
      })
      .finally(() => setCarregando(false))
  }, [])

  const selecionar = (id, botao) => {
    setAtiva(id)
    setVerTodos(false)
    setBusca('')
    // mantém a aba escolhida visível na barra (celular)
    botao.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    // se já rolou para baixo da lista, volta para o começo dela
    const topo = inicioLista.current?.getBoundingClientRect().top ?? 0
    if (topo < 0) inicioLista.current.scrollIntoView({ behavior: 'smooth' })
  }

  // Com busca: procura em todas as categorias (nome e descrição); sem busca: só a categoria ativa
  const termo = normalizarTexto(busca)
  const buscando = termo.length > 0
  const resultados = buscando
    ? produtos.filter((p) => normalizarTexto(`${p.nome} ${p.descricao ?? ''}`).includes(termo))
    : produtos.filter((p) => p.categoria_id === ativa)
  const visiveis = verTodos || buscando ? resultados : resultados.slice(0, ITENS_POR_PAGINA)

  return (
    <section id="cardapio" className="py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <span className="font-bold text-marca">Cardápio</span>
          <h2 className="text-3xl font-extrabold">Conheça o nosso cardápio</h2>
        </div>

        {carregando && <p className="text-center text-gray-500">Carregando cardápio...</p>}
        {erro && <p className="text-center text-red-600">Não foi possível carregar o cardápio.</p>}
        {!carregando && !erro && categorias.length === 0 && <p className="text-center text-gray-500">Nenhum item disponível no momento.</p>}
      </div>

      {categorias.length > 0 && (
        // Busca + categorias grudam embaixo do header ao rolar
        <div className="sticky top-18 z-30 space-y-3 border-y border-gray-100 bg-white/85 py-3 backdrop-blur-xl">
          <div className="container mx-auto px-4">
            <label className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-gray-200 transition focus-within:shadow-md focus-within:ring-2 focus-within:ring-marca/30">
              <FaMagnifyingGlass className="shrink-0 text-gray-400" />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="O que você quer comer hoje?"
                aria-label="Pesquisar no cardápio"
                className="w-full bg-transparent text-base outline-none placeholder:text-gray-400 [&::-webkit-search-cancel-button]:hidden"
              />
              {busca && (
                <button type="button" onClick={() => setBusca('')} aria-label="Limpar pesquisa" className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                  <FaXmark />
                </button>
              )}
            </label>
          </div>

          <div className="container mx-auto flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:justify-center [&::-webkit-scrollbar]:hidden">
            {categorias.map((c) => (
              <button
                key={c.id}
                onClick={(e) => selecionar(c.id, e.currentTarget)}
                className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  ativa === c.id && !buscando ? 'text-white' : 'text-gray-600 hover:bg-marca/10'
                }`}
              >
                {ativa === c.id && !buscando && (
                  <motion.span layoutId="categoria-ativa" className="absolute inset-0 rounded-full bg-marca" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
                {c.icone && <span className="relative">{c.icone}</span>}
                <span className="relative whitespace-nowrap">{c.nome}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={inicioLista} className="container mx-auto scroll-mt-52 px-4 pt-6 md:pt-10">
        {buscando && (
          <p className="mb-4 text-sm text-gray-500">
            {resultados.length
              ? `${resultados.length} resultado${resultados.length > 1 ? 's' : ''} para "${busca.trim()}"`
              : `Nenhum item encontrado para "${busca.trim()}". Tente outra palavra.`}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {visiveis.map((p) => (
            <CardProduto key={p.id} produto={p} />
          ))}
        </div>

        {!buscando && ativa && resultados.length === 0 && !carregando && <p className="text-center text-gray-500">Nenhum produto nesta categoria.</p>}

        {!buscando && !verTodos && resultados.length > ITENS_POR_PAGINA && (
          <div className="mt-10 text-center">
            <button onClick={() => setVerTodos(true)} className="rounded-full bg-white px-6 py-2 font-semibold shadow-sm hover:text-marca">
              Ver mais
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
