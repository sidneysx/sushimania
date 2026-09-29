import { useMemo, useState } from 'react'
import { Bike, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { salvarBairro, excluirBairro, normalizarBairro } from '../../services/bairros'
import { usePainel } from './PainelContext'
import { Botao, Busca, Campo, classeInput, Confirmar, dinheiro, Interruptor, lerValor, Modal, valorParaCampo, Vazio } from './ui'

// Não atendido ou sem valor definido: o cliente não vê esse bairro na lista
const semTaxa = (b) => !b.ativo || Number(b.taxa) === 0

const FILTROS = [
  { id: null, rotulo: 'Todos' },
  { id: 'atendidos', rotulo: 'Atendidos', teste: (b) => !semTaxa(b) },
  { id: 'sem-taxa', rotulo: 'Sem taxa', teste: semTaxa },
]

// Campo de taxa direto na linha: digita o valor e o bairro já passa a ser atendido
function TaxaRapida({ bairro, onSalvar }) {
  const [valor, setValor] = useState('')
  const [salvando, setSalvando] = useState(false)
  const taxa = lerValor(valor)
  const valida = taxa !== null && !Number.isNaN(taxa) && taxa > 0

  const salvar = async (e) => {
    e.preventDefault()
    if (!valida) return
    setSalvando(true)
    await onSalvar(bairro, taxa)
    setSalvando(false)
  }

  return (
    <form onSubmit={salvar} className="flex items-center gap-2">
      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">Sem taxa</span>
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        inputMode="decimal"
        placeholder="R$ 0,00"
        aria-label={`Taxa de ${bairro.nome}`}
        className="h-9 w-24 rounded-lg border border-neutral-200 px-2 text-sm outline-none focus:border-marca"
      />
      <Botao type="submit" variante="marca" carregando={salvando} disabled={!valida} className="h-9 px-3">
        Ativar
      </Botao>
    </form>
  )
}

export default function Bairros() {
  const { bairros, pedidos, recarregar, avisar } = usePainel()
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState(null) // {} = novo
  const [apagando, setApagando] = useState(null)
  const [confirmando, setConfirmando] = useState(false)

  const [filtro, setFiltro] = useState(null)

  const filtrados = useMemo(() => {
    const teste = FILTROS.find((f) => f.id === filtro)?.teste ?? (() => true)
    return bairros.filter((b) => teste(b) && normalizarBairro(b.nome).includes(normalizarBairro(busca)))
  }, [bairros, busca, filtro])

  // Define a taxa e já passa a atender o bairro
  const ativarComTaxa = async (bairro, taxa) => {
    try {
      await salvarBairro({ id: bairro.id, taxa, ativo: true })
      await recarregar()
      avisar(`${bairro.nome}: ${dinheiro.format(taxa)}, agora atendido`)
    } catch (e) {
      avisar(e.message, 'erro')
    }
  }

  // Bairros que já pediram mas ainda não têm taxa cadastrada
  const pendentes = useMemo(() => {
    const cadastrados = new Set(bairros.map((b) => normalizarBairro(b.nome)))
    return [...new Set(pedidos.filter((p) => p.taxa_entrega === null).map((p) => p.bairro))].filter((b) => !cadastrados.has(normalizarBairro(b)))
  }, [bairros, pedidos])

  const apagar = async () => {
    setConfirmando(true)
    try {
      await excluirBairro(apagando.id)
      setApagando(null)
      await recarregar()
      avisar('Bairro apagado')
    } catch (e) {
      avisar(e.message, 'erro')
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Busca valor={busca} onChange={setBusca} placeholder="Buscar bairro" />
        <Botao variante="marca" className="ml-auto" onClick={() => setEditando({ nome: busca })}>
          <Plus className="size-4" /> Novo bairro
        </Botao>
      </div>

      {pendentes.length > 0 && (
        <div className="rounded-2xl border border-marca/25 bg-marca/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Bike className="size-4 text-marca" /> Clientes pediram destes bairros sem taxa cadastrada:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pendentes.map((nome) => (
              <button key={nome} onClick={() => setEditando({ nome })} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-marca/30 hover:ring-marca">
                + {nome}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const ativo = f.id === filtro
          const qtd = f.teste ? bairros.filter(f.teste).length : bairros.length
          return (
            <button
              key={f.rotulo}
              onClick={() => setFiltro(f.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                ativo ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:ring-marca/50'
              }`}
            >
              {f.rotulo}
              <span className={`text-xs ${ativo ? 'text-marca' : 'text-neutral-400'}`}>{qtd}</span>
            </button>
          )
        })}
      </div>

      {bairros.length === 0 ? (
        <Vazio icone={Bike} titulo="Nenhum bairro cadastrado" texto="Cadastre os bairros atendidos e a taxa de entrega de cada um." />
      ) : filtrados.length === 0 ? (
        <Vazio icone={Search} titulo="Bairro não encontrado" texto='Clique em "Novo bairro" para cadastrar com o nome buscado.' />
      ) : (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
          {filtrados.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 sm:px-4">
              <div className="min-w-0 flex-1">
                <p className={`truncate font-medium ${b.ativo ? '' : 'text-neutral-500'}`}>{b.nome}</p>
                {(b.cep_inicial || b.cep_final) && (
                  <p className="text-xs text-neutral-400">
                    CEP {b.cep_inicial ?? '?'} a {b.cep_final ?? '?'}
                  </p>
                )}
              </div>
              {semTaxa(b) ? <TaxaRapida bairro={b} onSalvar={ativarComTaxa} /> : <p className="font-semibold">{dinheiro.format(b.taxa)}</p>}
              <button onClick={() => setEditando(b)} aria-label="Editar" className="grid size-9 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
                <Pencil className="size-4" />
              </button>
              <button onClick={() => setApagando(b)} aria-label="Apagar" className="grid size-9 place-items-center rounded-lg text-neutral-500 hover:bg-rose-50 hover:text-rose-600">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal aberto={!!editando} onFechar={() => setEditando(null)} titulo={editando?.id ? 'Editar bairro' : 'Novo bairro'}>
        {editando && (
          <Formulario
            key={editando.id ?? editando.nome ?? 'novo'}
            bairro={editando}
            onFechar={() => setEditando(null)}
            onSalvo={async (texto) => {
              await recarregar()
              avisar(texto)
              setEditando(null)
            }}
          />
        )}
      </Modal>

      <Confirmar
        aberto={!!apagando}
        titulo="Apagar bairro?"
        texto={`"${apagando?.nome}" sai da lista de entrega. Se for temporário, prefira desativar.`}
        carregando={confirmando}
        onConfirmar={apagar}
        onCancelar={() => setApagando(null)}
      />
    </div>
  )
}

function Formulario({ bairro, onFechar, onSalvo }) {
  const { avisar } = usePainel()
  const [form, setForm] = useState({ nome: bairro.nome ?? '', taxa: valorParaCampo(bairro.taxa), ativo: bairro.ativo ?? true })
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  const salvar = async (e) => {
    e.preventDefault()
    const taxa = lerValor(form.taxa)
    const novosErros = {
      nome: !form.nome.trim() && 'Informe o nome',
      taxa: (taxa === null || Number.isNaN(taxa) || taxa < 0) && 'Taxa inválida. Ex.: 8,00',
    }
    setErros(novosErros)
    if (Object.values(novosErros).some(Boolean)) return

    setSalvando(true)
    try {
      await salvarBairro({ id: bairro.id, nome: form.nome.trim().replace(/\s+/g, ' '), taxa, ativo: form.ativo })
      await onSalvo(bairro.id ? 'Bairro atualizado' : 'Bairro cadastrado')
    } catch (err) {
      avisar(err.message, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <div className="grid grid-cols-[1fr_130px] gap-4">
        <Campo rotulo="Nome do bairro" erro={erros.nome}>
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={classeInput(erros.nome)} />
        </Campo>
        <Campo rotulo="Taxa (R$)" erro={erros.taxa}>
          <input inputMode="decimal" value={form.taxa} onChange={(e) => setForm({ ...form, taxa: e.target.value })} placeholder="0,00" className={classeInput(erros.taxa)} />
        </Campo>
      </div>

      <Interruptor ligado={form.ativo} onChange={(ativo) => setForm({ ...form, ativo })} icone={Eye} rotulo="Atende este bairro" descricao="Desligue para tirar da lista do cliente sem apagar" />

      <div className="flex justify-end gap-2 pt-2">
        <Botao type="button" variante="secundario" onClick={onFechar}>
          Cancelar
        </Botao>
        <Botao type="submit" variante="marca" carregando={salvando}>
          Salvar
        </Botao>
      </div>
    </form>
  )
}
