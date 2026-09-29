import { useState } from 'react'
import { FaBars, FaBagShopping } from 'react-icons/fa6'
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

  return (
    <header className="sticky top-0 z-40 bg-white/90 shadow-sm backdrop-blur">
      <nav className="container mx-auto flex min-h-18 flex-wrap items-center justify-between px-4 py-3">
        <a href="#">
          <Logo />
        </a>

        <button className="text-xl md:hidden" onClick={() => setMenuAberto(!menuAberto)} aria-label="Menu">
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
