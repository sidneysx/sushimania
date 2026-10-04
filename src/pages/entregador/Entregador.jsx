import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  Ban,
  Bike,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Navigation,
  Package,
  Phone,
  User,
  RefreshCw,
  ShieldAlert,
  Wallet,
} from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa6'
import { supabase } from '../../lib/supabase'
import { linkWhatsapp } from '../../lib/config'
import { useConfig } from '../../context/ConfigContext'
import { mascaraTelefone, sair, soTelefone, telefoneValido } from '../../services/conta'
import { cadastrarMotoboy, ehContaMotoboy, entrarMotoboy, marcarStatusMotoboy, meuCadastroMotoboy, meusPedidosDoDia, situacaoMotoboy, solicitarAcessoMotoboy } from '../../services/motoboys'
import { dinheiro, formatarData, StatusPedido } from '../admin/ui'

const FINALIZADOS = ['entregue', 'cancelado']
const mesmoDia = (a, b) => a.toDateString() === b.toDateString()

export default function Entregador() {
  const [sessao, setSessao] = useState(undefined) // undefined = ainda verificando
  const [motoboy, setMotoboy] = useState(null)
  const [verificando, setVerificando] = useState(true)

  // Área do motoboy não deve aparecer no Google
  useEffect(() => {
    const meta = Object.assign(document.createElement('meta'), { name: 'robots', content: 'noindex, nofollow' })
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  // só mostra o carregando quando muda a pessoa logada (não a cada renovação do token)
  const usuarioAtual = useRef()
  const consulta = useRef(0) // vale só a resposta da consulta mais recente
  const verificar = useCallback(async (novaSessao, forcar = false) => {
    setSessao(novaSessao)
    const id = novaSessao?.user.id ?? null
    if (id === usuarioAtual.current && !forcar) return setVerificando(false)
    if (id !== usuarioAtual.current) setVerificando(true)
    usuarioAtual.current = id
    const n = ++consulta.current
    let cadastro = null
    try {
      cadastro = novaSessao ? await meuCadastroMotoboy() : null
    } catch {
      // sem cadastro legível: trata como sem acesso
    }
    if (n !== consulta.current) return
    setMotoboy(cadastro)
    setVerificando(false)
  }, [])

  const atualizar = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    await verificar(data.session, true)
  }, [verificar])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => verificar(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      // evita chamar o Supabase dentro do callback (recomendação da lib)
      setTimeout(() => verificar(novaSessao), 0)
    })
    return () => data.subscription.unsubscribe()
  }, [verificar])

  if (sessao === undefined || verificando) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-950 text-marca">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }
  if (!sessao) return <Login onCadastrado={atualizar} />
  if (!motoboy || situacaoMotoboy(motoboy) !== 'ativo') return <SemAcesso sessao={sessao} motoboy={motoboy} onAtualizar={atualizar} />
  return <PainelMotoboy motoboy={motoboy} />
}

// ---------------------------------------------------------------------------

function Login({ onCadastrado }) {
  const { config } = useConfig()
  const [modo, setModo] = useState('entrar') // 'entrar' | 'cadastrar'
  const [form, setForm] = useState({ nome: '', telefone: '', senha: '', confirmar: '' })
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setErro('')
    const telefone = soTelefone(form.telefone)
    if (!telefoneValido(telefone)) return setErro('Informe o celular com DDD.')
    if (modo === 'cadastrar' && !form.nome.trim()) return setErro('Informe o seu nome.')
    if (form.senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.')
    if (modo === 'cadastrar' && form.senha !== form.confirmar) return setErro('As senhas não conferem.')
    setEnviando(true)
    try {
      if (modo === 'cadastrar') {
        await cadastrarMotoboy({ nome: form.nome.trim(), telefone, senha: form.senha })
        await onCadastrado() // a solicitação foi gravada depois do login: busca de novo
      } else {
        await entrarMotoboy({ telefone, senha: form.senha })
        // deu certo: a sessão nova é percebida pelo onAuthStateChange
      }
    } catch (err) {
      setErro(err.message)
      setEnviando(false)
    }
  }

  const input =
    'h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-marca/60 focus:bg-white/10 focus:ring-2 focus:ring-marca/20'

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-neutral-950 px-4 py-10 font-sans">
      <div className="pointer-events-none absolute -left-40 -top-40 size-[34rem] rounded-full bg-marca/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-[28rem] rounded-full bg-marca/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="text-center">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-marca text-white shadow-2xl">
            <Bike className="size-9" />
          </span>
          <h1 className="mt-6 text-3xl font-semibold text-white">Área do entregador</h1>
          <p className="mt-1 text-sm text-neutral-400">{config.nome}</p>
        </div>

        <form onSubmit={enviar} className="mt-10 space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          {modo === 'cadastrar' && (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Seu nome</span>
              <span className="relative mt-1.5 block">
                <User className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoComplete="name" placeholder="Ex.: João Silva" className={input} />
              </span>
            </label>
          )}
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Celular</span>
            <span className="relative mt-1.5 block">
              <Phone className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
              <input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: mascaraTelefone(e.target.value) })}
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(99) 98123-4567"
                className={input}
              />
            </span>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{modo === 'cadastrar' ? 'Crie uma senha' : 'Senha'}</span>
            <span className="relative mt-1.5 block">
              <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
              <input
                type={verSenha ? 'text' : 'password'}
                autoComplete={modo === 'cadastrar' ? 'new-password' : 'current-password'}
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                placeholder="••••••••"
                className={`${input} pr-12`}
              />
              <button
                type="button"
                onClick={() => setVerSenha((v) => !v)}
                aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-neutral-400 hover:text-white"
              >
                {verSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </span>
          </label>

          {modo === 'cadastrar' && (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Confirme a senha</span>
              <span className="relative mt-1.5 block">
                <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
                <input
                  type={verSenha ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirmar}
                  onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
                  placeholder="••••••••"
                  className={input}
                />
              </span>
            </label>
          )}

          {erro && (
            <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/30">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-marca text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {enviando && <Loader2 className="size-4 animate-spin" />}
            {modo === 'cadastrar' ? 'Cadastrar e pedir acesso' : 'Entrar'}
          </button>

          <button
            type="button"
            onClick={() => {
              setModo(modo === 'cadastrar' ? 'entrar' : 'cadastrar')
              setErro('')
            }}
            className="w-full text-center text-sm text-neutral-400 hover:text-white"
          >
            {modo === 'cadastrar' ? 'Já tenho cadastro: entrar' : 'Novo entregador? Cadastre-se'}
          </button>
        </form>

        <a href="/" className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-white">
          <ArrowLeft className="size-4" /> Voltar para a loja
        </a>
      </motion.div>
    </main>
  )
}

// Logado, mas sem acesso às entregas: pede acesso, espera a autorização ou foi bloqueado
function SemAcesso({ sessao, motoboy, onAtualizar }) {
  const [nome, setNome] = useState(sessao.user.user_metadata?.nome ?? '')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const situacao = motoboy ? situacaoMotoboy(motoboy) : null
  // conta de entregador: o e-mail interno é <celular>@motoboy.sushimania.app
  const email = sessao.user.email ?? ''
  const telefone = ehContaMotoboy(email) ? email.split('@')[0] : ''

  // Pendente: confere sozinho de tempos em tempos se a loja já autorizou
  useEffect(() => {
    if (situacao !== 'pendente') return
    const timer = setInterval(onAtualizar, 15000)
    return () => clearInterval(timer)
  }, [situacao, onAtualizar])

  const solicitar = async (e) => {
    e.preventDefault()
    if (!nome.trim()) return setErro('Informe o seu nome.')
    setErro('')
    setEnviando(true)
    try {
      await solicitarAcessoMotoboy({ id: sessao.user.id, nome: nome.trim(), telefone })
      await onAtualizar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const textos = {
    pendente: {
      icone: Clock,
      titulo: 'Aguardando autorização',
      texto: 'Seu cadastro foi enviado. Assim que a loja autorizar, suas entregas aparecem aqui sozinhas.',
    },
    bloqueado: { icone: Ban, titulo: 'Acesso bloqueado', texto: 'A loja suspendeu seu acesso às entregas. Fale com a loja.' },
  }
  const t = textos[situacao]
  const Icone = t?.icone ?? ShieldAlert

  return (
    <div className="grid min-h-screen place-items-center bg-neutral-950 px-4 text-center text-white">
      <div className="w-full max-w-sm">
        <Icone className="mx-auto size-10 text-marca" />
        {t ? (
          <>
            <p className="mt-4 text-2xl font-semibold">{t.titulo}</p>
            <p className="mt-2 text-sm text-neutral-400">
              <b className="text-white">{motoboy.nome}</b> · {mascaraTelefone(motoboy.telefone)}
            </p>
            <p className="mt-2 text-sm text-neutral-400">{t.texto}</p>
          </>
        ) : telefone ? (
          <form onSubmit={solicitar} className="mt-4 space-y-3 text-left">
            <p className="text-center text-2xl font-semibold">Pedir acesso de entregador</p>
            <p className="text-center text-sm text-neutral-400">
              Celular <b className="text-white">{mascaraTelefone(telefone)}</b>. A loja precisa autorizar.
            </p>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-marca/60"
            />
            {erro && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/30">{erro}</p>}
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-marca text-sm font-semibold disabled:opacity-60"
            >
              {enviando && <Loader2 className="size-4 animate-spin" />} Pedir acesso
            </button>
          </form>
        ) : (
          <>
            <p className="mt-4 text-2xl font-semibold">Esta não é uma conta de entregador</p>
            <p className="mt-2 text-sm text-neutral-400">Você está logado como cliente da loja. Saia e entre (ou cadastre-se) como entregador.</p>
          </>
        )}
        <div className="mt-6 flex justify-center gap-3">
          {situacao === 'pendente' && (
            <button onClick={onAtualizar} className="inline-flex h-11 items-center gap-2 rounded-xl bg-marca px-4 text-sm font-semibold">
              <RefreshCw className="size-4" /> Verificar agora
            </button>
          )}
          <button onClick={sair} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold">
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function PainelMotoboy({ motoboy }) {
  const { config } = useConfig()
  const [dia, setDia] = useState(() => new Date())
  const [pedidos, setPedidos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(null)

  const carregar = useCallback(async () => {
    try {
      setPedidos(await meusPedidosDoDia(motoboy.user_id, dia))
      setErro('')
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [motoboy.user_id, dia])

  useEffect(() => {
    setCarregando(true)
    carregar()
  }, [carregar])

  // Pedido atribuído ou alterado pela loja aparece na hora (o Realtime só envia os pedidos dele)
  useEffect(() => {
    const canal = supabase
      .channel('entregador-pedidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => carregar())
      .subscribe()
    const aoVoltar = () => !document.hidden && carregar()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      supabase.removeChannel(canal)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [carregar])

  useEffect(() => {
    document.title = `Entregas · ${config.nome}`
  }, [config.nome])

  const resumo = useMemo(() => {
    const validos = pedidos.filter((p) => p.status !== 'cancelado')
    const entregues = validos.filter((p) => p.status === 'entregue')
    return {
      total: validos.length,
      entregues: entregues.length,
      abertos: validos.length - entregues.length,
      taxas: entregues.reduce((t, p) => t + (p.taxa_entrega ?? 0), 0),
      taxasPrevistas: validos.reduce((t, p) => t + (p.taxa_entrega ?? 0), 0),
    }
  }, [pedidos])

  // em aberto primeiro, depois os finalizados
  const lista = useMemo(
    () => [...pedidos].sort((a, b) => FINALIZADOS.includes(a.status) - FINALIZADOS.includes(b.status)),
    [pedidos],
  )

  const mudarDia = (dias) => {
    const novo = new Date(dia)
    novo.setDate(novo.getDate() + dias)
    setDia(novo)
  }
  const hoje = mesmoDia(dia, new Date())

  const marcar = async (pedido, status) => {
    setSalvando(pedido.id)
    try {
      await marcarStatusMotoboy(pedido.id, status)
      await carregar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(null)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-white antialiased">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <span className="grid size-10 place-items-center rounded-full bg-marca">
            <Bike className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-marca">{config.nome} · Entregas</p>
            <p className="truncate font-semibold">Olá, {motoboy.nome.split(' ')[0]}</p>
          </div>
          <button onClick={sair} aria-label="Sair" className="grid size-10 place-items-center rounded-xl text-neutral-400 hover:bg-white/10 hover:text-white">
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-2">
          <button onClick={() => mudarDia(-1)} aria-label="Dia anterior" className="grid size-10 place-items-center rounded-xl hover:bg-white/10">
            <ChevronLeft className="size-5" />
          </button>
          <div className="text-center">
            <p className="font-semibold">{hoje ? 'Hoje' : formatarData(dia, { weekday: 'long' })}</p>
            <p className="text-xs text-neutral-400">{formatarData(dia, { dateStyle: 'long' })}</p>
          </div>
          <button
            onClick={() => mudarDia(1)}
            disabled={hoje}
            aria-label="Próximo dia"
            className="grid size-10 place-items-center rounded-xl hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Indicador icone={Package} rotulo="Pedidos do dia" valor={resumo.total} />
          <Indicador icone={CheckCircle2} rotulo="Entregues" valor={resumo.entregues} />
          <Indicador icone={Clock} rotulo="Em aberto" valor={resumo.abertos} destaque={resumo.abertos > 0} />
          <Indicador
            icone={Wallet}
            rotulo="Taxas recebidas"
            valor={dinheiro.format(resumo.taxas)}
            detalhe={resumo.taxasPrevistas > resumo.taxas ? `de ${dinheiro.format(resumo.taxasPrevistas)} previstas` : null}
            destaque
          />
        </div>

        {erro && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/30">{erro}</p>}

        {carregando ? (
          <div className="grid place-items-center py-20 text-marca">
            <Loader2 className="size-7 animate-spin" />
          </div>
        ) : lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
            <Bike className="mx-auto size-8 text-neutral-600" />
            <p className="mt-3 font-semibold">Nenhuma entrega {hoje ? 'ainda hoje' : 'neste dia'}</p>
            <p className="mt-1 text-sm text-neutral-400">Quando a loja passar um pedido para você, ele aparece aqui na hora.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {lista.map((p) => (
              <CartaoEntrega key={p.id} pedido={p} salvando={salvando === p.id} onMarcar={marcar} />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

function Indicador({ icone: Icone, rotulo, valor, detalhe, destaque }) {
  return (
    <div className={`rounded-2xl border p-4 ${destaque ? 'border-marca/40 bg-marca/10' : 'border-white/10 bg-white/[0.03]'}`}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
        <Icone className={`size-4 ${destaque ? 'text-marca' : ''}`} /> {rotulo}
      </p>
      <p className="mt-1 text-2xl font-semibold">{valor}</p>
      {detalhe && <p className="text-[11px] text-neutral-400">{detalhe}</p>}
    </div>
  )
}

function CartaoEntrega({ pedido: p, salvando, onMarcar }) {
  const finalizado = FINALIZADOS.includes(p.status)
  const mapa = p.localizacao
    ? `https://www.google.com/maps/dir/?api=1&destination=${p.localizacao}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.endereco)}`

  return (
    <li className={`overflow-hidden rounded-2xl border bg-white/[0.04] ${finalizado ? 'border-white/5 opacity-70' : 'border-white/10'}`}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="font-mono text-lg font-bold">#{p.codigo}</p>
          <p className="text-xs text-neutral-400">{formatarData(p.criado_em, { timeStyle: 'short' })}</p>
        </div>
        <StatusPedido status={p.status} />
      </div>

      <div className="space-y-4 p-4 text-sm">
        <div>
          <p className="text-base font-semibold">{p.cliente_nome}</p>
          {p.cliente_telefone && (
            <div className="mt-2 flex flex-wrap gap-2">
              <a href={`tel:${p.cliente_telefone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold">
                <Phone className="size-3.5" /> {mascaraTelefone(p.cliente_telefone)}
              </a>
              <a
                href={linkWhatsapp(`55${p.cliente_telefone}`)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold"
              >
                <FaWhatsapp className="size-3.5" /> WhatsApp
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-marca" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{p.bairro}</p>
            <p className="text-neutral-300">{p.endereco}</p>
            <a
              href={mapa}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold"
            >
              <Navigation className="size-3.5" /> {p.localizacao ? 'Rota até o GPS do cliente' : 'Abrir rota no mapa'}
            </a>
          </div>
        </div>

        <ul className="space-y-1 rounded-xl bg-black/30 p-3">
          {p.itens.map((i, n) => (
            <li key={n}>
              <span className="font-semibold">{i.qtd}x</span> {i.nome}
              {i.obs && <span className="block text-xs text-amber-300">Obs.: {i.obs}</span>}
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="flex items-center gap-1.5 text-xs text-neutral-400">
              <CreditCard className="size-3.5" /> {p.pagamento}
            </p>
            <p className="mt-1 text-lg font-semibold">{dinheiro.format(p.total)}</p>
            {p.troco && <p className="text-xs text-amber-300">Levar troco p/ {p.troco}</p>}
          </div>
          <div className="rounded-xl bg-marca/15 p-3 ring-1 ring-marca/30">
            <p className="flex items-center gap-1.5 text-xs text-neutral-300">
              <Wallet className="size-3.5" /> Sua taxa
            </p>
            <p className="mt-1 text-lg font-semibold">{p.taxa_entrega === null ? 'A combinar' : dinheiro.format(p.taxa_entrega)}</p>
          </div>
        </div>

        {!finalizado && (
          <div className="flex gap-2">
            {p.status !== 'saiu' && (
              <button
                onClick={() => onMarcar(p, 'saiu')}
                disabled={salvando}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 font-semibold disabled:opacity-60"
              >
                <Bike className="size-4" /> Saí para entrega
              </button>
            )}
            <button
              onClick={() => onMarcar(p, 'entregue')}
              disabled={salvando}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 font-semibold disabled:opacity-60"
            >
              {salvando ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Entregue
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
