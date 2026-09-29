import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ExternalLink, Loader2, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useConfig } from '../../context/ConfigContext'
import { supabase } from '../../lib/supabase'
import { listarProdutos } from '../../services/produtos'
import { listarCategorias } from '../../services/categorias'
import { listarPedidos } from '../../services/pedidos'
import { listarBairros } from '../../services/bairros'
import { PainelContext } from './PainelContext'
import Sidebar from './Sidebar'
import { Aviso, Botao, Campo, classeInput, Modal } from './ui'

const TITULOS = {
  dashboard: 'Dashboard',
  produtos: 'Produtos',
  categorias: 'Categorias',
  pedidos: 'Pedidos',
  bairros: 'Bairros e taxas',
  configuracoes: 'Configurações',
}

function lerPreferencia(chave, padrao) {
  try {
    return JSON.parse(localStorage.getItem(chave)) ?? padrao
  } catch {
    return padrao
  }
}

export default function Painel() {
  const { sessao, isAdmin, carregando: verificando, sair } = useAuth()
  const { config } = useConfig()
  const local = useLocation()

  const [dados, setDados] = useState({ produtos: [], categorias: [], pedidos: [], bairros: [] })
  const [carregando, setCarregando] = useState(true)
  const [aviso, setAviso] = useState(null)
  const [menuMobile, setMenuMobile] = useState(false)
  const [trocandoSenha, setTrocandoSenha] = useState(false)
  const [recolhido, setRecolhido] = useState(() => lerPreferencia('admin-menu-recolhido', false))

  const avisar = useCallback((texto, tipo = 'ok') => {
    const id = Date.now()
    setAviso({ id, texto, tipo })
    setTimeout(() => setAviso((a) => (a?.id === id ? null : a)), 3200)
  }, [])

  // Carrega tudo de uma vez; se uma tabela falhar, as outras continuam aparecendo
  const recarregar = useCallback(async () => {
    const fontes = { produtos: listarProdutos, categorias: listarCategorias, pedidos: listarPedidos, bairros: listarBairros }
    const resultados = await Promise.allSettled(Object.values(fontes).map((f) => f()))
    const novos = {}
    Object.keys(fontes).forEach((chave, i) => {
      const r = resultados[i]
      novos[chave] = r.status === 'fulfilled' ? r.value : []
      if (r.status === 'rejected') avisar(`Erro ao carregar ${chave}: ${r.reason.message}`, 'erro')
    })
    setDados(novos)
    setCarregando(false)
  }, [avisar])

  const liberado = sessao && isAdmin

  useEffect(() => {
    if (liberado) recarregar()
  }, [liberado, recarregar])

  useEffect(() => {
    document.title = `Painel · ${config.nome}`
  }, [config.nome])

  useEffect(() => {
    setMenuMobile(false)
    window.scrollTo({ top: 0 })
  }, [local.pathname, local.search])

  const contagens = useMemo(
    () => ({
      produtos: dados.produtos.length,
      categorias: dados.categorias.length,
      bairros: dados.bairros.length,
      novos: dados.pedidos.filter((p) => p.status === 'novo').length,
    }),
    [dados],
  )

  if (verificando) return <TelaCarregando />
  if (!liberado) return <Navigate to="/admin/login" replace />

  const alternarRecolhido = () =>
    setRecolhido((v) => {
      try {
        localStorage.setItem('admin-menu-recolhido', JSON.stringify(!v))
      } catch {
        // sem storage: vale só nesta visita
      }
      return !v
    })

  const pagina = local.pathname.split('/')[2] || 'dashboard'
  const titulo = pagina === 'produtos' && local.search.includes('novo=1') ? 'Novo produto' : TITULOS[pagina] ?? 'Dashboard'

  return (
    <PainelContext.Provider value={{ ...dados, carregando, recarregar, avisar }}>
      <div className="flex min-h-screen bg-neutral-100/70 font-sans text-neutral-900 antialiased">
        <Sidebar
          contagens={contagens}
          usuario={sessao.user}
          recolhido={recolhido}
          onRecolher={alternarRecolhido}
          abertoMobile={menuMobile}
          onFecharMobile={() => setMenuMobile(false)}
          onTrocarSenha={() => setTrocandoSenha(true)}
          onSair={sair}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-neutral-200 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:h-20 lg:px-8">
            <button onClick={() => setMenuMobile(true)} aria-label="Abrir menu" className="grid size-10 place-items-center rounded-xl hover:bg-neutral-100 lg:hidden">
              <Menu className="size-5" />
            </button>
            <div>
              <p className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-marca sm:block">{config.nome} · Painel</p>
              <h1 className="text-2xl font-semibold leading-tight lg:text-3xl">{titulo}</h1>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-marca sm:px-4"
            >
              <ExternalLink className="size-4" />
              <span className="hidden sm:inline">Ver site</span>
            </a>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {carregando ? (
              <div className="grid place-items-center py-32 text-marca">
                <Loader2 className="size-8 animate-spin" />
              </div>
            ) : (
              <Outlet />
            )}
          </main>

          <footer className="border-t border-neutral-200 px-4 py-4 text-center text-xs text-neutral-400">{config.nome} · Painel administrativo</footer>
        </div>

        <TrocarSenha aberto={trocandoSenha} onFechar={() => setTrocandoSenha(false)} avisar={avisar} />
        <Aviso aviso={aviso} />
      </div>
    </PainelContext.Provider>
  )
}

export function TelaCarregando() {
  return (
    <div className="grid min-h-screen place-items-center bg-neutral-950 text-marca">
      <Loader2 className="size-8 animate-spin" />
    </div>
  )
}

function TrocarSenha({ aberto, onFechar, avisar }) {
  const [senha, setSenha] = useState('')
  const [repetir, setRepetir] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const fechar = () => {
    setSenha('')
    setRepetir('')
    setErro('')
    onFechar()
  }

  const salvar = async (e) => {
    e.preventDefault()
    if (senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.')
    if (senha !== repetir) return setErro('As senhas não são iguais.')
    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvando(false)
    if (error) return setErro(error.message)
    avisar('Senha alterada com sucesso')
    fechar()
  }

  return (
    <Modal aberto={aberto} onFechar={fechar} titulo="Alterar senha">
      <form onSubmit={salvar} className="space-y-4">
        <Campo rotulo="Nova senha" dica="Mínimo de 8 caracteres">
          <input type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} className={classeInput()} />
        </Campo>
        <Campo rotulo="Repita a nova senha" erro={erro}>
          <input type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} className={classeInput(!!erro)} />
        </Campo>
        <div className="flex justify-end gap-2 pt-2">
          <Botao type="button" variante="secundario" onClick={fechar}>
            Cancelar
          </Botao>
          <Botao type="submit" carregando={salvando}>
            Salvar senha
          </Botao>
        </div>
      </form>
    </Modal>
  )
}
