import { useState } from 'react'
import { FaBars, FaBagShopping, FaLocationDot } from 'react-icons/fa6'
import { useCarrinho } from '../../context/CarrinhoContext'
import { useConfig } from '../../context/ConfigContext'

const links = [
  { href: '#cardapio', texto: 'Cardápio' },
  { href: '#servicos', texto: 'Serviços' },
]

export function Logo({ className = 'h-12' }) {
  const { config } = useConfig()
  return config.logo_url ? (
    <img src={config.logo_url} alt={config.nome} className={`${className} w-auto object-contain`} />
  ) : (
    <span className="text-2xl font-extrabold text-marca">{config.nome}</span>
  )
}

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false)
  const { totais, setAberto } = useCarrinho()
  const { config } = useConfig()

  return (
    <header className="sticky top-0 z-40 bg-white/90 shadow-sm backdrop-blur">
      <nav className="container mx-auto flex min-h-18 flex-wrap items-center justify-between gap-3 px-4 py-3">
        {/* Logo + nome + endereço */}
        <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none">
          {config.logo_url && (
            <a href="#" className="shrink-0">
              <img src={config.logo_url} alt="" className="h-12 w-auto object-contain" />
            </a>
          )}
          <div className="min-w-0 leading-tight">
            <a href="#" className="block truncate text-lg font-extrabold text-gray-900">
              {config.nome}
            </a>
            {config.endereco && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.endereco)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-marca"
              >
                <FaLocationDot className="shrink-0 text-marca" />
                <span className="truncate">{config.endereco}</span>
              </a>
            )}
          </div>
        </div>

        <button className="shrink-0 text-xl md:hidden" onClick={() => setMenuAberto(!menuAberto)} aria-label="Menu">
          <FaBars />
        </button>

        <div
          className={`${menuAberto ? 'flex' : 'hidden'} w-full flex-col gap-4 pt-4 md:flex md:w-auto md:flex-row md:items-center md:gap-8 md:pt-0`}
        >
          {links.map((l) => (
            <a key={l.href} href={l.href} className="font-semibold hover:text-marca" onClick={() => setMenuAberto(false)}>
              {l.texto}
            </a>
          ))}

          <button
            onClick={() => setAberto(true)}
            className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 font-semibold hover:border-marca"
          >
            Meu carrinho
            <span className="relative">
              <FaBagShopping className="text-marca" />
              {totais.quantidade > 0 && (
                <span className="absolute -top-3 -right-3 rounded-full bg-marca px-1.5 text-xs text-white">{totais.quantidade}</span>
              )}
            </span>
          </button>
        </div>
      </nav>
    </header>
  )
}
