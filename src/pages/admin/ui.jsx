// Peças visuais do painel (mesmo padrão do painel Cardins)
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Bike, CheckCircle2, ChefHat, Clock, ImageOff, Loader2, Search, X, XCircle } from 'lucide-react'

export const STATUS = {
  novo: { rotulo: 'Novo', icone: Clock, classe: 'bg-amber-50 text-amber-800 ring-amber-200' },
  preparando: { rotulo: 'Preparando', icone: ChefHat, classe: 'bg-sky-50 text-sky-800 ring-sky-200' },
  saiu: { rotulo: 'Saiu p/ entrega', icone: Bike, classe: 'bg-violet-50 text-violet-800 ring-violet-200' },
  entregue: { rotulo: 'Entregue', icone: CheckCircle2, classe: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  cancelado: { rotulo: 'Cancelado', icone: XCircle, classe: 'bg-rose-50 text-rose-700 ring-rose-200' },
}

export function StatusPedido({ status }) {
  const s = STATUS[status] ?? STATUS.novo
  const Icone = s.icone
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${s.classe}`}>
      <Icone className="size-3.5" /> {s.rotulo}
    </span>
  )
}

export function Miniatura({ src, alt = '', className = 'size-12' }) {
  return src ? (
    <img src={src} alt={alt} loading="lazy" className={`${className} shrink-0 rounded-xl bg-neutral-100 object-cover`} />
  ) : (
    <span className={`${className} grid shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-400`}>
      <ImageOff className="size-4" />
    </span>
  )
}

export const dinheiro = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const formatarData = (iso, opcoes = { dateStyle: 'short', timeStyle: 'short' }) =>
  new Intl.DateTimeFormat('pt-BR', opcoes).format(new Date(iso))

// "199,90" ou "199.90" -> 199.9 ; vazio -> null ; inválido -> NaN
export function lerValor(texto) {
  const limpo = String(texto ?? '').trim().replace(/\s|R\$/g, '')
  if (!limpo) return null
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const n = Number(normalizado)
  return Number.isFinite(n) ? n : NaN
}

export const valorParaCampo = (n) => (n === null || n === undefined ? '' : Number(n).toFixed(2).replace('.', ','))

export function Botao({ variante = 'primario', carregando, className = '', children, ...props }) {
  const estilos = {
    primario: 'bg-neutral-950 text-white hover:bg-neutral-800',
    marca: 'bg-marca text-white hover:brightness-110',
    secundario: 'border border-neutral-200 bg-white text-neutral-700 hover:border-marca hover:text-neutral-950',
    perigo: 'bg-rose-600 text-white hover:bg-rose-700',
    fantasma: 'text-neutral-600 hover:bg-neutral-100',
  }
  return (
    <button
      {...props}
      disabled={carregando || props.disabled}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${estilos[variante]} ${className}`}
    >
      {carregando && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Campo({ rotulo, dica, erro, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-neutral-800">{rotulo}</span>
      <div className="mt-1.5">{children}</div>
      {erro ? (
        <span className="mt-1 block text-xs text-rose-600">{erro}</span>
      ) : (
        dica && <span className="mt-1 block text-xs text-neutral-500">{dica}</span>
      )}
    </label>
  )
}

export const classeInput = (erro) =>
  `h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-marca focus:ring-2 focus:ring-marca/20 ${
    erro ? 'border-rose-400 bg-rose-50' : 'border-neutral-200'
  }`

export function Interruptor({ ligado, onChange, rotulo, descricao, icone: Icone }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={() => onChange(!ligado)}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
        ligado ? 'border-marca/40 bg-marca/5' : 'border-neutral-200 bg-white hover:border-neutral-300'
      }`}
    >
      {Icone && (
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${ligado ? 'bg-neutral-950 text-marca' : 'bg-neutral-100 text-neutral-500'}`}>
          <Icone className="size-4" />
        </span>
      )}
      <span className="flex-1">
        <span className="block text-sm font-semibold text-neutral-900">{rotulo}</span>
        {descricao && <span className="block text-xs text-neutral-500">{descricao}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${ligado ? 'bg-marca' : 'bg-neutral-300'}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${ligado ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

export function Modal({ aberto, onFechar, titulo, children, largura = 'max-w-md' }) {
  useEffect(() => {
    if (!aberto) return
    const onKey = (e) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [aberto, onFechar])

  return (
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onFechar}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={`relative max-h-[92vh] w-full overflow-y-auto ${largura} rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl`}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">{titulo}</h2>
              <button onClick={onFechar} aria-label="Fechar" className="grid size-9 place-items-center rounded-full hover:bg-neutral-100">
                <X className="size-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function Confirmar({ aberto, titulo, texto, rotuloConfirmar = 'Apagar', carregando, onConfirmar, onCancelar }) {
  return (
    <Modal aberto={aberto} onFechar={onCancelar} titulo={titulo}>
      <div className="flex gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
        <AlertTriangle className="size-5 shrink-0" />
        <p>{texto}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Botao variante="secundario" onClick={onCancelar}>
          Cancelar
        </Botao>
        <Botao variante="perigo" carregando={carregando} onClick={onConfirmar}>
          {rotuloConfirmar}
        </Botao>
      </div>
    </Modal>
  )
}

export function Aviso({ aviso }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      <AnimatePresence>
        {aviso && (
          <motion.div
            key={aviso.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            role="status"
            className={`pointer-events-auto rounded-2xl px-5 py-3 text-sm font-medium shadow-xl ${
              aviso.tipo === 'erro' ? 'bg-rose-600 text-white' : 'bg-neutral-950 text-white'
            }`}
          >
            {aviso.texto}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Vazio({ icone: Icone, titulo, texto, children }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-marca/10 text-marca ring-1 ring-marca/15">
        <Icone className="size-5" />
      </span>
      <p className="mt-4 font-semibold text-neutral-900">{titulo}</p>
      {texto && <p className="mt-1 max-w-sm text-sm text-neutral-500">{texto}</p>}
      {children}
    </div>
  )
}

export function Cartao({ className = '', children }) {
  return <section className={`rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm ${className}`}>{children}</section>
}

export function Busca({ valor, onChange, placeholder }) {
  return (
    <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 focus-within:border-marca focus-within:ring-2 focus-within:ring-marca/20 sm:max-w-sm">
      <Search className="size-4 shrink-0 text-neutral-400" />
      <input value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400" />
    </label>
  )
}

