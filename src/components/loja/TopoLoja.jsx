import { FaBagShopping, FaChevronRight, FaMagnifyingGlass, FaPhone } from 'react-icons/fa6'
import { useCarrinho } from '../../context/CarrinhoContext'
import { useConfig } from '../../context/ConfigContext'
import { soNumeros } from '../../lib/config'
import { useLojaAberta } from '../../lib/useLojaAberta'
import { RedesSociais } from './Footer'

// Pesquisa do cardápio: rola até a barra (que gruda no topo) e foca o campo
const irParaBusca = () => {
  const campo = document.getElementById('busca-cardapio')
  if (!campo) return
  const barra = document.getElementById('barra-cardapio')
  window.scrollTo({ top: barra.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' })
  campo.focus({ preventScroll: true })
}

function BotaoRedondo({ children, ...props }) {
  return (
    <button type="button" className="relative grid size-11 place-items-center rounded-full bg-white/90 text-gray-800 shadow-md backdrop-blur" {...props}>
      {children}
    </button>
  )
}

// Capa (foto de destaque do painel) + cartão com logo, situação, endereço e informações
export default function TopoLoja() {
  const { config } = useConfig()
  const { totais, setAberto } = useCarrinho()
  const { aberta, fecha, abreQuando, hoje } = useLojaAberta()

  const mapa = config.endereco && `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.endereco)}`
  const horarioHoje = hoje?.aberto ? `${hoje.abre} às ${hoje.fecha}` : 'Fechado hoje'

  return (
    <header>
      <div className="relative h-44 bg-marca sm:h-56 md:h-72">
        {config.destaque_url && <img src={config.destaque_url} alt="" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/10" />
        <div className="absolute top-3 right-3 flex gap-2 md:right-[max(0.75rem,calc((100vw-64rem)/2))]">
          <BotaoRedondo onClick={irParaBusca} aria-label="Pesquisar no cardápio">
            <FaMagnifyingGlass />
          </BotaoRedondo>
          <BotaoRedondo onClick={() => setAberto(true)} aria-label="Abrir carrinho">
            <FaBagShopping />
            {totais.quantidade > 0 && (
              <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-marca px-1 text-xs font-bold text-white">
                {totais.quantidade}
              </span>
            )}
          </BotaoRedondo>
        </div>
      </div>

      <div className="relative -mt-6 rounded-t-3xl bg-white px-4 pt-5 pb-2 md:mx-auto md:max-w-5xl md:px-6">
        <div className="flex items-center gap-3">
          {config.logo_url ? (
            <img src={config.logo_url} alt="" className="size-16 shrink-0 rounded-2xl bg-white object-contain p-1 shadow-sm ring-1 ring-gray-100" />
          ) : (
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-marca text-2xl font-extrabold text-white">{config.nome.charAt(0)}</span>
          )}

          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold ${aberta ? 'text-green-700' : 'text-amber-700'}`}>
              {aberta ? `● Aberto agora${fecha ? ` · até ${fecha}` : ''}` : abreQuando ? `Fechado · abrimos ${abreQuando}` : 'Fechado no momento'}
            </p>
            <h1 className="truncate text-lg font-extrabold leading-tight">{config.nome}</h1>
            {mapa && (
              <a href={mapa} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-gray-500 hover:text-marca">
                <span className="truncate">{config.endereco}</span>
                <FaChevronRight className="shrink-0 text-xs" />
              </a>
            )}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-3 divide-x divide-gray-200 rounded-2xl py-3 text-center text-xs ring-1 ring-gray-200">
          <div className="px-1">
            <dt className="text-gray-500">Hoje</dt>
            <dd className="font-semibold">{horarioHoje}</dd>
          </div>
          <div className="px-1">
            <dt className="text-gray-500">Entrega</dt>
            <dd className="font-semibold">Taxa por bairro</dd>
          </div>
          <div className="px-1">
            <dt className="text-gray-500">Pagamento</dt>
            <dd className="font-semibold">Pix, cartão ou dinheiro</dd>
          </div>
        </dl>

        <div className="mt-3 flex items-center justify-between gap-3">
          {config.telefone ? (
            <a href={`tel:${soNumeros(config.telefone)}`} className="flex items-center gap-2 text-sm font-semibold text-marca">
              <FaPhone /> {config.telefone}
            </a>
          ) : (
            <span />
          )}
          <RedesSociais className="bg-gray-100 p-2.5 text-base" />
        </div>
      </div>
    </header>
  )
}
