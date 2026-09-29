import { useState } from 'react'
import { Eye, Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { salvarCategoria, excluirCategoria } from '../../services/categorias'
import { EMOJIS_SUGERIDOS } from '../../lib/icones'
import { usePainel } from './PainelContext'
import { Botao, Campo, classeInput, Confirmar, Interruptor, Modal, Vazio } from './ui'

export default function Categorias() {
  const { categorias, produtos, recarregar, avisar } = usePainel()
  const [editando, setEditando] = useState(null) // {} = nova
  const [apagando, setApagando] = useState(null)
  const [confirmando, setConfirmando] = useState(false)

  const qtdProdutos = (id) => produtos.filter((p) => p.categoria_id === id).length

  const apagar = async () => {
    setConfirmando(true)
    try {
      await excluirCategoria(apagando.id)
      setApagando(null)
      await recarregar()
      avisar('Categoria apagada')
    } catch (e) {
      avisar(e.message, 'erro')
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">As categorias viram as abas do cardápio no site, na ordem definida aqui.</p>
        <Botao variante="marca" onClick={() => setEditando({})}>
          <Plus className="size-4" /> Nova categoria
        </Botao>
      </div>

      {categorias.length === 0 ? (
        <Vazio icone={Tags} titulo="Nenhuma categoria" texto="Crie categorias como Combos, Temakis, Bebidas..." />
      ) : (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
          {categorias.map((c) => (
            <li key={c.id} className="flex items-center gap-4 p-3 sm:px-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-neutral-100 text-2xl">{c.icone || '🍽️'}</span>
              <div className="min-w-0 flex-1">
                <p className={`truncate font-medium ${c.ativo ? '' : 'text-neutral-400 line-through'}`}>{c.nome}</p>
                <p className="text-xs text-neutral-500">
                  {qtdProdutos(c.id)} produto{qtdProdutos(c.id) === 1 ? '' : 's'} · ordem {c.ordem}
                  {!c.ativo && ' · oculta'}
                </p>
              </div>
              <button onClick={() => setEditando(c)} aria-label="Editar" className="grid size-9 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
                <Pencil className="size-4" />
              </button>
              <button onClick={() => setApagando(c)} aria-label="Apagar" className="grid size-9 place-items-center rounded-lg text-neutral-500 hover:bg-rose-50 hover:text-rose-600">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal aberto={!!editando} onFechar={() => setEditando(null)} titulo={editando?.id ? 'Editar categoria' : 'Nova categoria'}>
        {editando && (
          <Formulario
            key={editando.id ?? 'nova'}
            categoria={editando}
            proximaOrdem={categorias.length + 1}
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
        titulo="Apagar categoria?"
        texto={`"${apagando?.nome}" será apagada. Só é possível apagar categorias sem produtos.`}
        carregando={confirmando}
        onConfirmar={apagar}
        onCancelar={() => setApagando(null)}
      />
    </div>
  )
}

function Formulario({ categoria, proximaOrdem, onFechar, onSalvo }) {
  const { avisar } = usePainel()
  const [form, setForm] = useState({
    nome: categoria.nome ?? '',
    icone: categoria.icone ?? '🍣',
    ordem: String(categoria.ordem ?? proximaOrdem),
    ativo: categoria.ativo ?? true,
  })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const salvar = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) return setErro('Informe o nome')
    setSalvando(true)
    try {
      await salvarCategoria({
        id: categoria.id,
        nome: form.nome.trim(),
        icone: form.icone.trim() || null,
        ordem: Number(form.ordem) || 0,
        ativo: form.ativo,
      })
      await onSalvo(categoria.id ? 'Categoria atualizada' : 'Categoria criada')
    } catch (err) {
      avisar(`Não foi possível salvar: ${err.message}`, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <div className="grid grid-cols-[1fr_96px] gap-4">
        <Campo rotulo="Nome" erro={erro}>
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={classeInput(erro)} />
        </Campo>
        <Campo rotulo="Ordem">
          <input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: e.target.value })} className={classeInput()} />
        </Campo>
      </div>

      <Campo rotulo="Ícone" dica="Clique em um emoji ou digite outro">
        <div className="flex items-start gap-3">
          <input value={form.icone} onChange={(e) => setForm({ ...form, icone: e.target.value })} className={`${classeInput()} w-16 text-center text-2xl`} />
          <div className="flex flex-wrap gap-1.5">
            {EMOJIS_SUGERIDOS.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => setForm({ ...form, icone: emoji })}
                className={`grid size-9 place-items-center rounded-lg border text-lg ${form.icone === emoji ? 'border-marca bg-marca/10' : 'border-neutral-200 hover:border-neutral-300'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </Campo>

      <Interruptor ligado={form.ativo} onChange={(ativo) => setForm({ ...form, ativo })} icone={Eye} rotulo="Visível no site" descricao="Desligue para esconder a aba do cardápio" />

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
