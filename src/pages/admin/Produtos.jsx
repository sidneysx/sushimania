import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, ImagePlus, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { salvarProduto, excluirProduto, enviarImagem, removerImagem } from '../../services/produtos'
import { usePainel } from './PainelContext'
import { Botao, Busca, Campo, classeInput, Confirmar, dinheiro, Interruptor, lerValor, Miniatura, Modal, valorParaCampo, Vazio } from './ui'

const FILTROS = [
  { id: null, rotulo: 'Todos' },
  { id: 'ocultos', rotulo: 'Ocultos', teste: (p) => !p.ativo },
  { id: 'sem-foto', rotulo: 'Sem foto', teste: (p) => !p.imagem_url },
]

export default function Produtos() {
  const { produtos, categorias, recarregar, avisar } = usePainel()
  const [params, setParams] = useSearchParams()
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [editando, setEditando] = useState(null)
  const [apagando, setApagando] = useState(null)
  const [confirmando, setConfirmando] = useState(false)

  const filtro = params.get('filtro')
  const criando = params.has('novo')

  const mudarParams = (mudanca) => {
    const novos = new URLSearchParams(params)
    Object.entries(mudanca).forEach(([k, v]) => (v ? novos.set(k, v) : novos.delete(k)))
    setParams(novos)
  }

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const teste = FILTROS.find((f) => f.id === filtro)?.teste ?? (() => true)
    return produtos.filter(
      (p) => teste(p) && (!categoria || String(p.categoria_id) === categoria) && (!termo || p.nome.toLowerCase().includes(termo)),
    )
  }, [produtos, filtro, categoria, busca])

  const alternarAtivo = async (produto) => {
    try {
      await salvarProduto({ id: produto.id, ativo: !produto.ativo })
      await recarregar()
      avisar(produto.ativo ? `"${produto.nome}" oculto do site` : `"${produto.nome}" visível no site`)
    } catch (e) {
      avisar(`Não foi possível salvar: ${e.message}`, 'erro')
    }
  }

  const apagar = async () => {
    setConfirmando(true)
    try {
      await excluirProduto(apagando)
      setApagando(null)
      await recarregar()
      avisar('Produto apagado')
    } catch (e) {
      avisar(`Não foi possível apagar: ${e.message}`, 'erro')
    } finally {
      setConfirmando(false)
    }
  }

  const fecharForm = () => {
    setEditando(null)
    if (criando) mudarParams({ novo: null })
  }

  const novo = () => (categorias.length ? mudarParams({ novo: '1' }) : avisar('Cadastre uma categoria primeiro', 'erro'))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Busca valor={busca} onChange={setBusca} placeholder="Buscar produto" />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={`${classeInput()} w-auto`}>
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icone} {c.nome}
            </option>
          ))}
        </select>
        <Botao variante="marca" className="ml-auto" onClick={novo}>
          <Plus className="size-4" /> Novo produto
        </Botao>
      </div>

      <div className="flex gap-2">
        {FILTROS.map((f) => {
          const ativo = f.id === filtro
          const qtd = f.teste ? produtos.filter(f.teste).length : produtos.length
          return (
            <button
              key={f.rotulo}
              onClick={() => mudarParams({ filtro: f.id })}
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

      {produtos.length === 0 ? (
        <Vazio icone={Package} titulo="Nenhum produto cadastrado" texto="Cadastre o primeiro prato do cardápio.">
          <Botao variante="marca" className="mt-5" onClick={novo}>
            <Plus className="size-4" /> Novo produto
          </Botao>
        </Vazio>
      ) : lista.length === 0 ? (
        <Vazio icone={Search} titulo="Nenhum produto encontrado" texto="Mude o filtro ou a busca." />
      ) : (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
          {lista.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 sm:px-4">
              <Miniatura src={p.imagem_url} alt={p.nome} className="size-14" />
              <div className="min-w-0 flex-1">
                <p className={`truncate font-medium ${p.ativo ? '' : 'text-neutral-400 line-through'}`}>{p.nome}</p>
                <p className="truncate text-xs text-neutral-500">
                  {p.categoria?.nome ?? 'Sem categoria'}
                  {p.descricao ? ` · ${p.descricao}` : ''}
                </p>
              </div>
              <p className="w-24 text-right font-semibold">{dinheiro.format(p.preco)}</p>
              <button
                role="switch"
                aria-checked={p.ativo}
                onClick={() => alternarAtivo(p)}
                title={p.ativo ? 'Visível no site (clique para ocultar)' : 'Oculto (clique para mostrar)'}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${p.ativo ? 'bg-marca' : 'bg-neutral-300'}`}
              >
                <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${p.ativo ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
              <div className="flex">
                <button onClick={() => setEditando(p)} aria-label="Editar" className="grid size-9 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
                  <Pencil className="size-4" />
                </button>
                <button onClick={() => setApagando(p)} aria-label="Apagar" className="grid size-9 place-items-center rounded-lg text-neutral-500 hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <FormProduto
        aberto={criando || !!editando}
        produto={editando}
        categoriaPadrao={categoria || String(categorias[0]?.id ?? '')}
        onFechar={fecharForm}
        onSalvo={async (texto) => {
          await recarregar()
          avisar(texto)
          fecharForm()
        }}
      />

      <Confirmar
        aberto={!!apagando}
        titulo="Apagar produto?"
        texto={`"${apagando?.nome}" sai do cardápio para sempre. Se for só temporário, prefira ocultar.`}
        carregando={confirmando}
        onConfirmar={apagar}
        onCancelar={() => setApagando(null)}
      />
    </div>
  )
}

function FormProduto({ aberto, produto, categoriaPadrao, onFechar, onSalvo }) {
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={produto ? 'Editar produto' : 'Novo produto'} largura="max-w-xl">
      {/* key: reinicia o formulário ao trocar de produto */}
      <Formulario key={produto?.id ?? 'novo'} produto={produto} categoriaPadrao={categoriaPadrao} onFechar={onFechar} onSalvo={onSalvo} />
    </Modal>
  )
}

function Formulario({ produto, categoriaPadrao, onFechar, onSalvo }) {
  const { categorias, avisar } = usePainel()
  const [form, setForm] = useState({
    nome: produto?.nome ?? '',
    descricao: produto?.descricao ?? '',
    preco: valorParaCampo(produto?.preco),
    categoria_id: String(produto?.categoria_id ?? categoriaPadrao),
    ordem: String(produto?.ordem ?? 0),
    ativo: produto?.ativo ?? true,
  })
  const [arquivo, setArquivo] = useState(null)
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  const alterar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })
  const previa = arquivo ? URL.createObjectURL(arquivo) : produto?.imagem_url

  const salvar = async (e) => {
    e.preventDefault()
    const preco = lerValor(form.preco)
    const novosErros = {
      nome: !form.nome.trim() && 'Informe o nome',
      preco: (preco === null || Number.isNaN(preco) || preco < 0) && 'Preço inválido. Ex.: 39,90',
      categoria_id: !form.categoria_id && 'Escolha a categoria',
    }
    setErros(novosErros)
    if (Object.values(novosErros).some(Boolean)) return

    setSalvando(true)
    try {
      let imagem_url = produto?.imagem_url ?? null
      if (arquivo) {
        imagem_url = await enviarImagem(arquivo)
        await removerImagem(produto?.imagem_url)
      }
      await salvarProduto({
        id: produto?.id,
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        preco,
        categoria_id: Number(form.categoria_id),
        ordem: Number(form.ordem) || 0,
        ativo: form.ativo,
        imagem_url,
      })
      await onSalvo(produto ? 'Produto atualizado' : 'Produto cadastrado')
    } catch (err) {
      avisar(`Não foi possível salvar: ${err.message}`, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-neutral-300 p-3 hover:border-marca">
        {previa ? (
          <img src={previa} alt="" className="size-24 rounded-xl object-cover" />
        ) : (
          <span className="grid size-24 place-items-center rounded-xl bg-neutral-100 text-neutral-400">
            <ImagePlus className="size-6" />
          </span>
        )}
        <span className="text-sm">
          <b>{previa ? 'Trocar foto' : 'Adicionar foto'}</b>
          <span className="block text-xs text-neutral-500">JPG ou PNG, de preferência quadrada</span>
        </span>
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => setArquivo(e.target.files[0] ?? null)} />
      </label>

      <Campo rotulo="Nome" erro={erros.nome}>
        <input value={form.nome} onChange={alterar('nome')} className={classeInput(erros.nome)} />
      </Campo>

      <Campo rotulo="Descrição" dica="Ex.: 10 peças de salmão com cream cheese">
        <textarea rows={3} value={form.descricao} onChange={alterar('descricao')} className={`${classeInput()} h-auto py-2`} />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo rotulo="Preço (R$)" erro={erros.preco}>
          <input inputMode="decimal" value={form.preco} onChange={alterar('preco')} placeholder="0,00" className={classeInput(erros.preco)} />
        </Campo>
        <Campo rotulo="Categoria" erro={erros.categoria_id}>
          <select value={form.categoria_id} onChange={alterar('categoria_id')} className={classeInput(erros.categoria_id)}>
            <option value="">Escolha...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icone} {c.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Ordem" dica="Menor aparece antes">
          <input type="number" value={form.ordem} onChange={alterar('ordem')} className={classeInput()} />
        </Campo>
      </div>

      <Interruptor
        ligado={form.ativo}
        onChange={(ativo) => setForm({ ...form, ativo })}
        icone={Eye}
        rotulo="Visível no site"
        descricao="Desligue para esconder sem apagar (ex.: acabou o ingrediente)"
      />

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
