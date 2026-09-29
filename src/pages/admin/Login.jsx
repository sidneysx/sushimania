import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useConfig } from '../../context/ConfigContext'
import { Botao } from './ui'
import { TelaCarregando } from './Painel'

const MENSAGENS = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed': 'Este e-mail ainda não foi confirmado.',
}

export default function Login() {
  const { sessao, isAdmin, carregando, entrar, sair } = useAuth()
  const { config } = useConfig()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  if (carregando) return <TelaCarregando />
  if (sessao && isAdmin) return <Navigate to="/admin/dashboard" replace />

  if (sessao && !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-950 px-4 text-center text-white">
        <div>
          <ShieldAlert className="mx-auto size-10 text-marca" />
          <p className="mt-4 text-3xl font-semibold">Acesso restrito</p>
          <p className="mt-2 text-sm text-neutral-400">{sessao.user.email} não tem permissão para acessar o painel.</p>
          <Botao variante="marca" className="mt-6" onClick={sair}>
            Entrar com outra conta
          </Botao>
        </div>
      </div>
    )
  }

  const enviar = async (e) => {
    e.preventDefault()
    setErro('')
    setEntrando(true)
    const { error } = await entrar(email.trim(), senha)
    setEntrando(false)
    // Deu certo: o AuthContext percebe a nova sessão e esta tela redireciona sozinha
    if (error) setErro(MENSAGENS[error.message] ?? 'Não foi possível entrar. Tente novamente.')
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
          {config.logo_url ? (
            <img src={config.logo_url} alt="" className="mx-auto size-24 rounded-full bg-white object-contain shadow-2xl ring-1 ring-marca/40" />
          ) : (
            <span className="mx-auto grid size-24 place-items-center rounded-full bg-marca text-4xl font-bold text-white shadow-2xl">{config.nome[0]}</span>
          )}
          <h1 className="mt-6 text-3xl font-semibold text-white">Painel da loja</h1>
          <p className="mt-1 text-sm text-neutral-400">{config.nome}</p>
        </div>

        <form onSubmit={enviar} className="mt-10 space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">E-mail</span>
            <span className="relative mt-1.5 block">
              <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className={input} />
            </span>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Senha</span>
            <span className="relative mt-1.5 block">
              <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
              <input
                type={verSenha ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
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

          {erro && (
            <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/30">
              {erro}
            </p>
          )}

          <Botao type="submit" variante="marca" carregando={entrando} className="h-12 w-full">
            Entrar
          </Botao>
        </form>

        <a href="/" className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-white">
          <ArrowLeft className="size-4" /> Voltar para a loja
        </a>
      </motion.div>
    </main>
  )
}
