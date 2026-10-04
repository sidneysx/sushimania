import { useMemo, useState } from 'react'
import { Bike, Copy, ExternalLink, Phone, Pin, Trash2, UserPlus } from 'lucide-react'
import { mascaraTelefone, soTelefone, telefoneValido } from '../../services/conta'
import { adicionarMotoboy, alterarMotoboy, definirMotoboyFixo, removerMotoboy } from '../../services/motoboys'
import { usePainel } from './PainelContext'
import { Botao, Campo, Cartao, classeInput, Confirmar, dinheiro, Vazio } from './ui'

const mesmoDia = (iso, dia) => new Date(iso).toDateString() === dia.toDateString()

export default function Motoboys() {
  const { motoboys, pedidos, recarregar, avisar } = usePainel()
  const [form, setForm] = useState({ nome: '', telefone: '' })
  const [salvando, setSalvando] = useState(false)
  const [removendo, setRemovendo] = useState(null)
  const [confirmando, setConfirmando] = useState(false)

  const link = `${window.location.origin}/entregador`

  // números de hoje de cada motoboy (cancelados não contam)
  const hoje = useMemo(() => {
    const agora = new Date()
    const porMotoboy = {}
    pedidos
      .filter((p) => p.motoboy_id && p.status !== 'cancelado' && mesmoDia(p.criado_em, agora))
      .forEach((p) => {
        const r = (porMotoboy[p.motoboy_id] ??= { total: 0, entregues: 0, taxas: 0 })
        r.total += 1
        if (p.status === 'entregue') {
          r.entregues += 1
          r.taxas += p.taxa_entrega ?? 0
        }
      })
    return porMotoboy
  }, [pedidos])

  const adicionar = async (e) => {
    e.preventDefault()
    const telefone = soTelefone(form.telefone)
    if (!form.nome.trim()) return avisar('Informe o nome do motoboy', 'erro')
    if (!telefoneValido(telefone)) return avisar('Informe o celular com DDD', 'erro')
    setSalvando(true)
    try {
      await adicionarMotoboy({ nome: form.nome.trim(), telefone })
      setForm({ nome: '', telefone: '' })
      await recarregar()
      avisar('Motoboy liberado')
    } catch (err) {
      avisar(err.message, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  const alternarAtivo = async (m) => {
    try {
      await alterarMotoboy(m.user_id, { ativo: !m.ativo })
      await recarregar()
      avisar(m.ativo ? `${m.nome} bloqueado` : `${m.nome} liberado`)
    } catch (err) {
      avisar(err.message, 'erro')
    }
  }

  const alternarFixo = async (m) => {
    try {
      await definirMotoboyFixo(m.fixo ? null : m.user_id)
      await recarregar()
      avisar(m.fixo ? 'Nenhum motoboy fixo: escolha no pedido' : `Pedidos novos vão direto para ${m.nome}`)
    } catch (err) {
      avisar(err.message, 'erro')
    }
  }

  const remover = async () => {
    setConfirmando(true)
    try {
      await removerMotoboy(removendo.user_id)
      setRemovendo(null)
      await recarregar()
      avisar('Motoboy removido')
    } catch (err) {
      avisar(err.message, 'erro')
    } finally {
      setConfirmando(false)
    }
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link)
      avisar('Link copiado')
    } catch {
      avisar(link)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="space-y-4">
        <Cartao className="p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <UserPlus className="size-4 text-marca" /> Liberar motoboy da casa
          </h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-neutral-600">
            <li>
              O motoboy abre <b>/entregador</b> no celular e toca em <b>“Primeiro acesso”</b> para criar a senha.
            </li>
            <li>Você cadastra aqui o mesmo celular.</li>
            <li>
              Marque um como <b>fixo</b> para todo pedido novo ir direto para ele, ou escolha o motoboy em cada pedido.
            </li>
          </ol>
          <div className="mt-3 flex gap-2">
            <Botao type="button" variante="secundario" onClick={copiar} className="flex-1">
              <Copy className="size-4" /> Copiar link
            </Botao>
            <a
              href="/entregador"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-700 hover:border-marca"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>

          <form onSubmit={adicionar} className="mt-5 space-y-3 border-t border-neutral-100 pt-5">
            <Campo rotulo="Nome">
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={classeInput()} placeholder="Ex.: João" />
            </Campo>
            <Campo rotulo="Celular" dica="O mesmo que ele usou para criar a senha">
              <input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: mascaraTelefone(e.target.value) })}
                inputMode="tel"
                className={classeInput()}
                placeholder="(99) 98123-4567"
              />
            </Campo>
            <Botao type="submit" variante="marca" carregando={salvando} className="w-full">
              Liberar acesso
            </Botao>
          </form>
        </Cartao>
      </div>

      {motoboys.length === 0 ? (
        <Vazio icone={Bike} titulo="Nenhum motoboy da casa" texto="Cadastre seus entregadores para eles acompanharem as entregas e as taxas do dia pelo celular." />
      ) : (
        <ul className="grid content-start gap-3 sm:grid-cols-2">
          {motoboys.map((m) => {
            const r = hoje[m.user_id] ?? { total: 0, entregues: 0, taxas: 0 }
            return (
              <li key={m.user_id}>
                <Cartao className={`p-4 ${m.ativo ? '' : 'opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-neutral-950 text-marca">
                      <Bike className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{m.nome}</p>
                      <p className="flex items-center gap-1 text-xs text-neutral-500">
                        <Phone className="size-3" /> {mascaraTelefone(m.telefone)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                        m.ativo ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-neutral-100 text-neutral-500 ring-neutral-200'
                      }`}
                    >
                      {m.ativo ? 'Ativo' : 'Bloqueado'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => alternarFixo(m)}
                    disabled={!m.ativo}
                    className={`mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      m.fixo ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-600 ring-1 ring-neutral-200 hover:ring-marca/50'
                    }`}
                  >
                    <Pin className={`size-3.5 ${m.fixo ? 'fill-marca text-marca' : ''}`} />
                    {m.fixo ? 'Fixo: recebe todos os pedidos novos' : 'Tornar motoboy fixo'}
                  </button>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-neutral-50 p-2">
                      <p className="text-lg font-semibold">{r.total}</p>
                      <p className="text-[11px] text-neutral-500">hoje</p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-2">
                      <p className="text-lg font-semibold">{r.entregues}</p>
                      <p className="text-[11px] text-neutral-500">entregues</p>
                    </div>
                    <div className="rounded-xl bg-marca/5 p-2">
                      <p className="text-lg font-semibold">{dinheiro.format(r.taxas)}</p>
                      <p className="text-[11px] text-neutral-500">taxas</p>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between">
                    <Botao variante="fantasma" className="h-8 px-2 text-xs" onClick={() => alternarAtivo(m)}>
                      {m.ativo ? 'Bloquear acesso' : 'Liberar acesso'}
                    </Botao>
                    <Botao variante="fantasma" className="h-8 px-2 text-xs hover:text-rose-600" onClick={() => setRemovendo(m)}>
                      <Trash2 className="size-3.5" /> Remover
                    </Botao>
                  </div>
                </Cartao>
              </li>
            )
          })}
        </ul>
      )}

      <Confirmar
        aberto={!!removendo}
        titulo="Remover motoboy?"
        texto={`${removendo?.nome} perde o acesso às entregas. Os pedidos dele continuam no painel, sem motoboy.`}
        rotuloConfirmar="Remover"
        carregando={confirmando}
        onConfirmar={remover}
        onCancelar={() => setRemovendo(null)}
      />
    </div>
  )
}
