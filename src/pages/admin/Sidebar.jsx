import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  Bike,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Motorbike,
  Package,
  PlusCircle,
  Settings,
  ShoppingBag,
  Tags,
  X,
} from 'lucide-react'
import { useConfig } from '../../context/ConfigContext'

// "sidney.sousa10@icloud.com" -> "Sidney Sousa"
export function nomeDoEmail(email = '') {
  return (
    email
      .split('@')[0]
      .split(/[._-]+/)
      .map((p) => p.replace(/\d+/g, ''))
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase() + p.slice(1))
      .join(' ') || 'Admin'
  )
}

const iniciais = (nome) =>
  nome
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

function grupos(c) {
  return [
    {
      titulo: 'Geral',
      itens: [{ rotulo: 'Dashboard', to: '/admin/dashboard', icone: LayoutDashboard }],
    },
    {
      titulo: 'Cardápio',
      itens: [
        { rotulo: 'Produtos', to: '/admin/produtos', icone: Package, contador: c.produtos, fim: true },
        { rotulo: 'Novo produto', to: '/admin/produtos?novo=1', icone: PlusCircle, ativo: (l) => l.search.includes('novo=1') },
        { rotulo: 'Categorias', to: '/admin/categorias', icone: Tags, contador: c.categorias },
      ],
    },
    {
      titulo: 'Vendas',
      itens: [
        { rotulo: 'Pedidos', to: '/admin/pedidos', icone: ShoppingBag, contador: c.novos, alerta: c.novos > 0 },
        { rotulo: 'Bairros e taxas', to: '/admin/bairros', icone: Bike, contador: c.bairros },
        { rotulo: 'Motoboys', to: '/admin/motoboys', icone: Motorbike, contador: c.motoboys },
      ],
    },
    {
      titulo: 'Loja',
      itens: [
        { rotulo: 'Configurações', to: '/admin/configuracoes', icone: Settings },
        { rotulo: 'Ver site', href: '/', icone: ExternalLink },
      ],
    },
  ]
}

export default function Sidebar({ contagens, usuario, recolhido, onRecolher, abertoMobile, onFecharMobile, onTrocarSenha, onSair }) {
  const { config } = useConfig()
  const local = useLocation()
  const nome = nomeDoEmail(usuario.email)

  const estaAtivo = (item, isActive) => {
    if (item.ativo) return item.ativo(local)
    // "Produtos" não fica ativo quando o "Novo produto" está aberto
    if (item.fim) return isActive && !local.search.includes('novo=1')
    return isActive
  }

  const conteudo = (compacto) => (
    <div className="flex h-full flex-col bg-neutral-950 text-neutral-300">
      <div className={`flex h-20 shrink-0 items-center gap-3 border-b border-white/5 ${compacto ? 'justify-center px-2' : 'px-5'}`}>
        {config.logo_url ? (
          <img src={config.logo_url} alt="" className="size-10 shrink-0 rounded-full bg-white object-contain ring-1 ring-marca/40" />
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-marca text-lg font-bold text-white">{config.nome[0]}</span>
        )}
        {!compacto && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-lg font-bold uppercase tracking-[0.12em] text-white">{config.nome}</p>
            <p className="text-[11px] font-medium text-marca">Painel da loja</p>
          </div>
        )}
        {abertoMobile && (
          <button onClick={onFecharMobile} aria-label="Fechar menu" className="ml-auto grid size-9 place-items-center rounded-lg hover:bg-white/5 lg:hidden">
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
        {grupos(contagens).map((g, i) => (
          <div key={g.titulo} className={i > 0 ? 'border-t border-white/5 pt-3' : ''}>
            {!compacto && <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{g.titulo}</p>}
            <ul className="space-y-1 pb-2">
              {g.itens.map((item) => (
                <li key={item.rotulo}>
                  <ItemMenu item={item} compacto={compacto} estaAtivo={estaAtivo} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <button
        onClick={onRecolher}
        className="hidden h-12 shrink-0 items-center justify-center gap-2 border-t border-white/5 text-sm text-neutral-400 transition hover:text-white lg:flex"
      >
        {compacto ? (
          <ChevronsRight className="size-4" />
        ) : (
          <>
            <ChevronsLeft className="size-4" /> Retrair
          </>
        )}
      </button>

      <MenuUsuario nome={nome} email={usuario.email} compacto={compacto} onTrocarSenha={onTrocarSenha} onSair={onSair} />
    </div>
  )

  return (
    <>
      <aside className={`sticky top-0 hidden h-screen shrink-0 transition-[width] duration-300 lg:block ${recolhido ? 'w-[76px]' : 'w-64'}`}>
        {conteudo(recolhido)}
      </aside>

      <AnimatePresence>
        {abertoMobile && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onFecharMobile}
            />
            <motion.div
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              {conteudo(false)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

function ItemMenu({ item, compacto, estaAtivo }) {
  const Icone = item.icone

  const miolo = (ativo) => (
    <>
      <Icone className={`size-[18px] shrink-0 ${ativo ? 'text-marca' : 'text-neutral-400'}`} />
      {!compacto && <span className="flex-1">{item.rotulo}</span>}
      {item.contador > 0 &&
        (compacto ? (
          <span className={`absolute right-1.5 top-1.5 size-2 rounded-full ${item.alerta ? 'bg-marca' : 'bg-neutral-500'}`} />
        ) : (
          <span
            className={`min-w-6 rounded-full px-2 py-0.5 text-center text-[11px] font-bold ${
              item.alerta ? 'bg-marca text-white' : 'bg-white/10 text-neutral-300'
            }`}
          >
            {item.contador}
          </span>
        ))}
    </>
  )

  const classe = (ativo) =>
    `relative flex h-11 items-center gap-3 rounded-xl text-sm font-medium transition ${compacto ? 'justify-center' : 'px-3'} ${
      ativo ? 'bg-white/[0.06] text-white ring-1 ring-marca/70' : 'hover:bg-white/[0.04] hover:text-white'
    }`

  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" title={compacto ? item.rotulo : undefined} className={classe(false)}>
        {miolo(false)}
      </a>
    )
  }

  return (
    <NavLink to={item.to} title={compacto ? item.rotulo : undefined} className={({ isActive }) => classe(estaAtivo(item, isActive))}>
      {({ isActive }) => miolo(estaAtivo(item, isActive))}
    </NavLink>
  )
}

function MenuUsuario({ nome, email, compacto, onTrocarSenha, onSair }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!aberto) return
    const fora = (e) => !ref.current?.contains(e.target) && setAberto(false)
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [aberto])

  return (
    <div ref={ref} className="relative shrink-0 border-t border-white/5 p-3">
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`absolute bottom-full mb-2 overflow-hidden rounded-xl border border-white/10 bg-neutral-900 py-1 shadow-2xl ${
              compacto ? 'left-3 w-52' : 'inset-x-3'
            }`}
          >
            <p className="truncate px-4 py-2 text-xs text-neutral-500">{email}</p>
            <button
              onClick={() => {
                setAberto(false)
                onTrocarSenha()
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5"
            >
              <KeyRound className="size-4 text-marca" /> Alterar senha
            </button>
            <button onClick={onSair} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-300 hover:bg-white/5">
              <LogOut className="size-4" /> Sair
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/5 ${compacto ? 'justify-center' : ''}`}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-marca text-xs font-bold text-white">{iniciais(nome)}</span>
        {!compacto && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{nome}</span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-marca">Admin</span>
            </span>
            <ChevronUp className={`size-4 text-neutral-500 transition ${aberto ? '' : 'rotate-180'}`} />
          </>
        )}
      </button>
    </div>
  )
}
