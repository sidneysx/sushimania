import { useEffect, useMemo, useState } from 'react'
import { Bike, Check, Copy, ExternalLink, Phone, Pin, Trash2, UserCheck, X } from 'lucide-react'
import { mascaraTelefone } from '../../services/conta'
import { alterarMotoboy, autorizarMotoboy, definirMotoboyFixo, removerMotoboy, situacaoMotoboy } from '../../services/motoboys'
import { usePainel } from './PainelContext'
import { Botao, Cartao, Confirmar, dinheiro, formatarData, Vazio } from './ui'

const mesmoDia = (iso, dia) => new Date(iso).toDateString() === dia.toDateString()

export default function Motoboys() {
  const { motoboys, pedidos, recarregar, avisar } = usePainel()
  const [removendo, setRemovendo] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [salvando, setSalvando] = useState(null)

  // solicitações chegam a qualquer hora: busca de novo ao abrir a aba
  useEffect(() => {
    recarregar()
  }, [recarregar])

  const link = `${window.location.origin}/entregador`
  const pendentes = motoboys.filter((m) => situacaoMotoboy(m) === 'pendente')
  const cadastrados = motoboys.filter((m) => situacaoMotoboy(m) !== 'pendente')

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

  const executar = async (m, acao, mensagem) => {
    setSalvando(m.user_id)
    try {
      await acao()
      await recarregar()
      avisar(mensagem)
    } catch (err) {
      avisar(err.message, 'erro')
    } finally {
      setSalvando(null)
    }
  }

  const autorizar = (m) => executar(m, () => autorizarMotoboy(m.user_id), `${m.nome} autorizado a receber pedidos`)

  const bloquear = (m) =>
    executar(
      m,
      async () => {
        if (m.fixo) await definirMotoboyFixo(null)
        await alterarMotoboy(m.user_id, { ativo: false })
      },
      `${m.nome} bloqueado`,
    )

  const alternarFixo = (m) =>
    executar(m, () => definirMotoboyFixo(m.fixo ? null : m.user_id), m.fixo ? 'Nenhum motoboy fixo: escolha no pedido' : `Pedidos novos vão direto para ${m.nome}`)

  const remover = async () => {
    setConfirmando(true)
    try {
      await removerMotoboy(removendo.user_id)
      const pendente = situacaoMotoboy(removendo) === 'pendente'
      setRemovendo(null)
      await recarregar()
      avisar(pendente ? 'Solicitação recusada' : 'Motoboy removido')
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
    <div className="space-y-6">
      <Cartao className="flex flex-wrap items-center gap-3 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-950 text-marca">
          <Bike className="size-5" />
        </span>
        <p className="min-w-0 flex-1 text-sm text-neutral-600">
          Mande o link <b className="text-neutral-900">/entregador</b> para o motoboy se cadastrar. A solicitação aparece aqui para você autorizar.
        </p>
        <div className="flex gap-2">
          <Botao type="button" variante="secundario" onClick={copiar}>
            <Copy className="size-4" /> Copiar link
          </Botao>
          <a
            href="/entregador"
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir área do entregador"
            className="inline-flex h-10 items-center rounded-xl border border-neutral-200 bg-white px-3 text-neutral-700 hover:border-marca"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
      </Cartao>

      {pendentes.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <UserCheck className="size-4 text-marca" /> Solicitações
            <span className="rounded-full bg-marca px-2 py-0.5 text-xs text-white">{pendentes.length}</span>
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pendentes.map((m) => (
              <li key={m.user_id}>
                <Cartao className="p-4 ring-2 ring-marca/30">
                  <p className="truncate font-semibold">{m.nome}</p>
                  <p className="flex items-center gap-1 text-xs text-neutral-500">
                    <Phone className="size-3" /> {mascaraTelefone(m.telefone)} · pediu em {formatarData(m.criado_em)}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Botao variante="marca" className="flex-1" carregando={salvando === m.user_id} onClick={() => autorizar(m)}>
                      <Check className="size-4" /> Autorizar
                    </Botao>
                    <Botao variante="secundario" onClick={() => setRemovendo(m)}>
                      <X className="size-4" /> Recusar
                    </Botao>
                  </div>
                </Cartao>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cadastrados.length === 0 ? (
        pendentes.length === 0 && (
          <Vazio
            icone={Bike}
            titulo="Nenhum motoboy da casa"
            texto="Quando um entregador se cadastrar em /entregador, ele aparece aqui para você autorizar. Depois ele acompanha as entregas e as taxas do dia pelo celular."
          />
        )
      ) : (
        <section>
          <h2 className="mb-3 font-semibold">Motoboys da casa</h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cadastrados.map((m) => {
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

                    {m.ativo && (
                      <button
                        type="button"
                        onClick={() => alternarFixo(m)}
                        className={`mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                          m.fixo ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-600 ring-1 ring-neutral-200 hover:ring-marca/50'
                        }`}
                      >
                        <Pin className={`size-3.5 ${m.fixo ? 'fill-marca text-marca' : ''}`} />
                        {m.fixo ? 'Fixo: recebe todos os pedidos novos' : 'Tornar motoboy fixo'}
                      </button>
                    )}

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
                      <Botao
                        variante="fantasma"
                        className="h-8 px-2 text-xs"
                        disabled={salvando === m.user_id}
                        onClick={() => (m.ativo ? bloquear(m) : autorizar(m))}
                      >
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
        </section>
      )}

      <Confirmar
        aberto={!!removendo}
        titulo={removendo && situacaoMotoboy(removendo) === 'pendente' ? 'Recusar solicitação?' : 'Remover motoboy?'}
        texto={
          removendo && situacaoMotoboy(removendo) === 'pendente'
            ? `${removendo.nome} não terá acesso às entregas. Se precisar, ele pode pedir de novo em /entregador.`
            : `${removendo?.nome} perde o acesso às entregas. Os pedidos dele continuam no painel, sem motoboy.`
        }
        rotuloConfirmar={removendo && situacaoMotoboy(removendo) === 'pendente' ? 'Recusar' : 'Remover'}
        carregando={confirmando}
        onConfirmar={remover}
        onCancelar={() => setRemovendo(null)}
      />
    </div>
  )
}
