import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FaArrowLeft,
  FaBagShopping,
  FaBowlFood,
  FaCircleCheck,
  FaCircleXmark,
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaHouse,
  FaLocationDot,
  FaMotorcycle,
  FaPen,
  FaPlus,
  FaReceipt,
  FaRightFromBracket,
  FaTrash,
  FaUser,
} from 'react-icons/fa6'
import { useConfig } from '../context/ConfigContext'
import { useConta } from '../context/ContaContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import { linkWhatsapp } from '../lib/config'
import { formatarPreco } from '../lib/formatar'
import { buscarBairros, listarBairros } from '../services/bairros'
import {
  cadastrar,
  entrar,
  entrarComGoogle,
  listarMeusPedidos,
  mascaraTelefone,
  removerEndereco,
  sair,
  salvarCliente,
  salvarEndereco,
  soTelefone,
  telefoneValido,
} from '../services/conta'

// text-base (16px): com fonte menor o iPhone dá zoom sozinho ao tocar no campo
const input = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base outline-none focus:border-marca disabled:bg-gray-50 disabled:text-gray-500'
const botaoMarca = 'flex w-full items-center justify-center gap-2 rounded-xl bg-marca px-4 py-3 font-semibold text-white disabled:opacity-60'

function Campo({ label, children, dica }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-semibold">
      {label}
      {children}
      {dica && <span className="text-xs font-normal text-gray-500">{dica}</span>}
    </label>
  )
}

// campo de senha com o "olhinho" para mostrar/esconder o que foi digitado
function InputSenha({ visivel, alternar, ...props }) {
  return (
    <div className="relative">
      <input {...props} type={visivel ? 'text' : 'password'} className={`${input} pr-11`} />
      <button
        type="button"
        onClick={alternar}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-gray-400 hover:text-gray-600"
        aria-label={visivel ? 'Esconder senha' : 'Mostrar senha'}
      >
        {visivel ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  )
}

export default function Conta() {
  const { config } = useConfig()
  const { usuario, cliente, carregando } = useConta()

  useEffect(() => {
    document.title = `Minha conta - ${config.nome}`
  }, [config.nome])

  return (
    <div className="min-h-dvh bg-[#fffdf7]">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link to="/" className="rounded-full p-2 hover:bg-gray-100" aria-label="Voltar ao cardápio">
            <FaArrowLeft />
          </Link>
          <h1 className="text-lg font-bold">Minha conta</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {carregando ? (
          <p className="py-10 text-center text-gray-500">Carregando...</p>
        ) : !usuario ? (
          <Acesso />
        ) : !cliente ? (
          <CompletarCadastro />
        ) : (
          <AreaCliente />
        )}
      </main>
    </div>
  )
}

// ---------------------------------------------------------------- sem login

function Acesso() {
  const { config } = useConfig()
  const { recarregar } = useConta()
  const toast = useToast()
  const [modo, setModo] = useState('entrar') // 'entrar' | 'cadastrar'
  const [form, setForm] = useState({ nome: '', telefone: '', senha: '', confirmar: '' })
  const [verSenha, setVerSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const alterar = (campo) => (e) => setForm({ ...form, [campo]: campo === 'telefone' ? mascaraTelefone(e.target.value) : e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    const telefone = soTelefone(form.telefone)
    if (modo === 'cadastrar' && !form.nome.trim()) return toast('Informe o seu nome.')
    if (!telefoneValido(telefone)) return toast('Informe o celular com DDD.')
    if (form.senha.length < 6) return toast('A senha precisa ter pelo menos 6 caracteres.')
    if (modo === 'cadastrar' && form.senha !== form.confirmar) return toast('As senhas não conferem.')

    setEnviando(true)
    try {
      if (modo === 'cadastrar') await cadastrar({ nome: form.nome.trim(), telefone, senha: form.senha })
      else await entrar({ telefone, senha: form.senha })
      await recarregar()
      toast(modo === 'cadastrar' ? 'Conta criada!' : 'Bem-vindo de volta!', 'sucesso')
    } catch (err) {
      toast(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const google = async () => {
    try {
      await entrarComGoogle()
    } catch (err) {
      toast(err.message)
    }
  }

  // sem e-mail de verdade não há "recuperar senha" automático: a loja ajuda pelo WhatsApp
  const esqueci = linkWhatsapp(
    config.whatsapp,
    `Olá! Esqueci a senha da minha conta no site. Meu celular é ${form.telefone || '(informe aqui)'}.`,
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-marca/10 text-2xl text-marca">
          <FaUser />
        </span>
        <h2 className="mt-3 text-xl font-extrabold">{modo === 'entrar' ? 'Entrar na sua conta' : 'Criar sua conta'}</h2>
        <p className="mt-1 text-sm text-gray-500">Acompanhe seus pedidos e salve seus endereços. É opcional: dá para pedir sem conta.</p>
      </div>

      <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm font-semibold">
        {[
          ['entrar', 'Entrar'],
          ['cadastrar', 'Criar conta'],
        ].map(([valor, rotulo]) => (
          <button key={valor} type="button" onClick={() => setModo(valor)} className={`rounded-lg py-2 transition ${modo === valor ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
            {rotulo}
          </button>
        ))}
      </div>

      <form onSubmit={enviar} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        {modo === 'cadastrar' && (
          <Campo label="Seu nome">
            <input className={input} value={form.nome} onChange={alterar('nome')} autoComplete="name" maxLength={120} />
          </Campo>
        )}
        <Campo label="Celular (com DDD)">
          <input className={input} value={form.telefone} onChange={alterar('telefone')} inputMode="tel" autoComplete="tel-national" placeholder="(99) 98123-4567" />
        </Campo>
        <Campo label="Senha" dica={modo === 'cadastrar' ? 'Pelo menos 6 caracteres' : undefined}>
          <InputSenha
            visivel={verSenha}
            alternar={() => setVerSenha(!verSenha)}
            value={form.senha}
            onChange={alterar('senha')}
            autoComplete={modo === 'cadastrar' ? 'new-password' : 'current-password'}
          />
        </Campo>
        {modo === 'cadastrar' && (
          <Campo label="Confirmar senha">
            <InputSenha visivel={verSenha} alternar={() => setVerSenha(!verSenha)} value={form.confirmar} onChange={alterar('confirmar')} autoComplete="new-password" />
          </Campo>
        )}
        <button type="submit" disabled={enviando} className={botaoMarca}>
          {enviando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>
        {modo === 'cadastrar' && (
          <p className="text-center text-xs text-gray-500">
            Ao criar a conta, você concorda com a{' '}
            <Link to="/privacidade" className="underline">
              Política de Privacidade
            </Link>
            .
          </p>
        )}
        {modo === 'entrar' && config.whatsapp && (
          <a href={esqueci} target="_blank" rel="noreferrer" className="block text-center text-sm text-gray-500 underline">
            Esqueci minha senha
          </a>
        )}
      </form>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" /> ou <span className="h-px flex-1 bg-gray-200" />
      </div>

      <button type="button" onClick={google} className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold shadow-sm hover:bg-gray-50">
        <FaGoogle className="text-[#4285F4]" /> Continuar com Google
      </button>
      <p className="text-center text-xs text-gray-400">
        <Link to="/privacidade" className="hover:underline">
          Política de Privacidade
        </Link>
      </p>
    </div>
  )
}

// Entrou pelo Google pela primeira vez: falta o celular (e confirmar o nome)
function CompletarCadastro() {
  const { usuario, recarregar } = useConta()
  const toast = useToast()
  const meta = usuario.user_metadata ?? {}
  const [nome, setNome] = useState(meta.full_name || meta.name || meta.nome || '')
  const [telefone, setTelefone] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    const tel = soTelefone(telefone)
    if (!nome.trim()) return toast('Informe o seu nome.')
    if (!telefoneValido(tel)) return toast('Informe o celular com DDD.')
    setEnviando(true)
    try {
      await salvarCliente({ id: usuario.id, nome: nome.trim(), telefone: tel })
      await recarregar()
      toast('Cadastro concluído!', 'sucesso')
    } catch (err) {
      toast(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-extrabold">Falta pouco!</h2>
        <p className="text-sm text-gray-500">Confirme seu nome e informe o celular para a entrega.</p>
      </div>
      <Campo label="Seu nome">
        <input className={input} value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" maxLength={120} />
      </Campo>
      <Campo label="Celular (com DDD)">
        <input className={input} value={telefone} onChange={(e) => setTelefone(mascaraTelefone(e.target.value))} inputMode="tel" autoComplete="tel-national" placeholder="(99) 98123-4567" />
      </Campo>
      <button type="submit" disabled={enviando} className={botaoMarca}>
        {enviando ? 'Salvando...' : 'Concluir cadastro'}
      </button>
      <button type="button" onClick={sair} className="w-full text-sm text-gray-500 underline">
        Sair
      </button>
    </form>
  )
}

// ---------------------------------------------------------------- com login

const ABAS = [
  ['pedidos', 'Pedidos', FaReceipt],
  ['enderecos', 'Endereços', FaLocationDot],
  ['dados', 'Meus dados', FaUser],
]

function AreaCliente() {
  const { cliente } = useConta()
  const [aba, setAba] = useState('pedidos')

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-marca text-lg font-bold text-white">{cliente.nome.charAt(0).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold">Olá, {cliente.nome.split(' ')[0]}!</p>
          <p className="text-sm text-gray-500">{mascaraTelefone(cliente.telefone)}</p>
        </div>
        <button type="button" onClick={sair} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-600">
          <FaRightFromBracket /> Sair
        </button>
      </div>

      <div className="grid grid-cols-3 rounded-xl bg-gray-100 p-1 text-sm font-semibold">
        {ABAS.map(([valor, rotulo, Icone]) => (
          <button key={valor} type="button" onClick={() => setAba(valor)} className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${aba === valor ? 'bg-white text-marca shadow-sm' : 'text-gray-500'}`}>
            <Icone className="text-xs" /> {rotulo}
          </button>
        ))}
      </div>

      {aba === 'pedidos' && <MeusPedidos />}
      {aba === 'enderecos' && <MeusEnderecos />}
      {aba === 'dados' && <MeusDados />}
    </div>
  )
}

// ---- pedidos

const ETAPAS = [
  ['novo', 'Recebido', FaReceipt],
  ['preparando', 'Em preparo', FaBowlFood],
  ['saiu', 'Saiu para entrega', FaMotorcycle],
  ['entregue', 'Entregue', FaCircleCheck],
]

function MeusPedidos() {
  const { usuario } = useConta()
  const [pedidos, setPedidos] = useState(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    const buscar = () =>
      listarMeusPedidos(usuario.id)
        .then(setPedidos)
        .catch(() => setErro(true))
    buscar()
    // tempo real: quando a loja muda o status no painel, atualiza aqui sozinho
    const canal = supabase
      .channel(`meus-pedidos-${usuario.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos', filter: `cliente_id=eq.${usuario.id}` }, buscar)
      .subscribe()
    return () => {
      supabase.removeChannel(canal)
    }
  }, [usuario.id])

  if (erro) return <p className="py-8 text-center text-red-600">Não foi possível carregar seus pedidos.</p>
  if (!pedidos) return <p className="py-8 text-center text-gray-500">Carregando pedidos...</p>
  if (!pedidos.length)
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <FaBagShopping className="mx-auto text-4xl text-gray-300" />
        <p className="mt-3 font-semibold">Você ainda não fez pedidos</p>
        <p className="text-sm text-gray-500">Quando pedir com a conta, o andamento aparece aqui.</p>
        <Link to="/" className="mt-4 inline-block rounded-full bg-marca px-5 py-2 font-semibold text-white">
          Ver cardápio
        </Link>
      </div>
    )

  return (
    <div className="space-y-3">
      {pedidos.map((p) => (
        <CartaoPedido key={p.id} pedido={p} />
      ))}
    </div>
  )
}

function CartaoPedido({ pedido: p }) {
  const atual = ETAPAS.findIndex(([s]) => s === p.status)
  const cancelado = p.status === 'cancelado'
  const data = new Date(p.criado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  const qtd = p.itens.reduce((t, i) => t + (i.qtd ?? 1), 0)

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">Pedido #{p.codigo}</p>
          <p className="text-xs text-gray-500">
            {data} · {qtd} {qtd === 1 ? 'item' : 'itens'}
          </p>
        </div>
        <p className="font-bold text-marca">{formatarPreco(Number(p.total))}</p>
      </div>

      {cancelado ? (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          <FaCircleXmark /> Pedido cancelado
        </p>
      ) : (
        <ol className="mt-4 grid grid-cols-4 gap-1">
          {ETAPAS.map(([status, rotulo, Icone], n) => {
            const feito = n <= atual
            return (
              <li key={status} className="flex flex-col items-center gap-1 text-center">
                <span className={`grid size-9 place-items-center rounded-full text-sm ${feito ? 'bg-marca text-white' : 'bg-gray-100 text-gray-400'} ${n === atual ? 'ring-4 ring-marca/20' : ''}`}>
                  <Icone />
                </span>
                <span className={`text-[11px] leading-tight ${feito ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>{rotulo}</span>
              </li>
            )
          })}
        </ol>
      )}

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-gray-500">Ver itens</summary>
        <ul className="mt-2 space-y-1">
          {p.itens.map((i, n) => (
            <li key={n} className="flex justify-between gap-3">
              <span>
                {i.qtd}x {i.nome}
                {i.obs && <span className="block text-xs text-gray-500">Obs.: {i.obs}</span>}
              </span>
              <span className="shrink-0">{formatarPreco(Number(i.preco) * i.qtd)}</span>
            </li>
          ))}
          <li className="flex justify-between border-t border-gray-100 pt-1 text-gray-500">
            <span>Entrega</span>
            <span>{p.taxa_entrega === null ? 'a combinar' : formatarPreco(Number(p.taxa_entrega))}</span>
          </li>
        </ul>
        <p className="mt-2 text-xs text-gray-500">{p.endereco}</p>
      </details>
    </div>
  )
}

// ---- endereços

const ENDERECO_NOVO = { apelido: 'Casa', bairro_id: '', bairro: '', endereco: '', numero: '', complemento: '' }

function MeusEnderecos() {
  const { enderecos, recarregar } = useConta()
  const toast = useToast()
  const [editando, setEditando] = useState(null) // null | endereço (novo ou existente)

  const remover = async (e) => {
    if (!window.confirm(`Remover o endereço "${e.apelido}"?`)) return
    try {
      await removerEndereco(e.id)
      await recarregar()
      toast('Endereço removido', 'sucesso')
    } catch (err) {
      toast(err.message)
    }
  }

  if (editando) return <FormEndereco inicial={editando} fechar={() => setEditando(null)} />

  return (
    <div className="space-y-3">
      {enderecos.map((e) => (
        <div key={e.id} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-marca/10 text-marca">
            <FaHouse />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{e.apelido}</p>
            <p className="text-sm text-gray-600">
              {e.endereco}, {e.numero}
              {e.complemento && ` (${e.complemento})`}
            </p>
            <p className="text-sm text-gray-500">{e.bairro}</p>
          </div>
          <button type="button" onClick={() => setEditando(e)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Editar endereço">
            <FaPen />
          </button>
          <button type="button" onClick={() => remover(e)} className="rounded-full p-2 text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label="Remover endereço">
            <FaTrash />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setEditando(ENDERECO_NOVO)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white px-4 py-4 font-semibold text-marca hover:border-marca"
      >
        <FaPlus /> Adicionar endereço
      </button>
      {!enderecos.length && <p className="text-center text-sm text-gray-500">Você também pode salvar o endereço na hora de fazer o pedido.</p>}
    </div>
  )
}

const OUTRO = 'outro'

function FormEndereco({ inicial, fechar }) {
  const { recarregar } = useConta()
  const toast = useToast()
  const [bairros, setBairros] = useState([])
  const [form, setForm] = useState({
    ...inicial,
    // bairro_id: '' = ainda não escolheu na lista; OUTRO = bairro digitado que não está na lista
    bairro_id: inicial.id && !inicial.bairro_id ? OUTRO : String(inicial.bairro_id ?? ''),
    bairroBusca: inicial.bairro,
    complemento: inicial.complemento ?? '',
  })
  const [salvando, setSalvando] = useState(false)
  const [listaAberta, setListaAberta] = useState(false)

  useEffect(() => {
    listarBairros()
      .then(setBairros)
      .catch(() => toast('Não foi possível carregar os bairros.'))
  }, [])

  const alterar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  // Bairro igual ao da etapa 2 do pedido: digita o começo e escolhe na lista
  const digitarBairro = (e) => {
    setForm({ ...form, bairroBusca: e.target.value, bairro_id: '', bairro: '' })
    setListaAberta(true)
  }
  // onMouseDown (e não onClick): escolhe antes do onBlur do campo fechar a lista
  const escolherBairro = (id, nome) => (e) => {
    e.preventDefault()
    setForm({ ...form, bairro_id: id, bairro: nome, bairroBusca: nome })
    setListaAberta(false)
  }
  const sugestoes = buscarBairros(bairros, form.bairroBusca)

  const salvar = async (e) => {
    e.preventDefault()
    const escolhido = bairros.find((b) => String(b.id) === form.bairro_id)
    const bairro = form.bairro_id === OUTRO ? form.bairro.trim() : escolhido?.nome
    if (!form.apelido.trim()) return toast('Dê um nome ao endereço (ex.: Casa).')
    if (!bairro) return toast('Escolha o seu bairro na lista.')
    if (!form.endereco.trim()) return toast('Informe a rua.')
    if (!form.numero.trim()) return toast('Informe o número.')

    setSalvando(true)
    try {
      await salvarEndereco({
        id: inicial.id,
        apelido: form.apelido.trim(),
        bairro_id: escolhido?.id ?? null,
        bairro,
        endereco: form.endereco.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim() || null,
      })
      await recarregar()
      toast('Endereço salvo', 'sucesso')
      fechar()
    } catch (err) {
      toast(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">{inicial.id ? 'Editar endereço' : 'Novo endereço'}</h2>
      <Campo label="Nome do endereço" dica="Ex.: Casa, Trabalho, Casa da mãe">
        <input className={input} value={form.apelido} onChange={alterar('apelido')} maxLength={30} />
      </Campo>
      <div className="relative">
        <Campo label="Bairro">
          <input
            className={input}
            value={form.bairroBusca}
            onChange={digitarBairro}
            onFocus={() => setListaAberta(true)}
            onBlur={() => setListaAberta(false)}
            placeholder="Digite o nome do seu bairro ou residencial"
            autoComplete="off"
            maxLength={120}
            role="combobox"
            aria-expanded={listaAberta}
          />
        </Campo>
        {listaAberta && !form.bairro_id && form.bairroBusca.trim() && (
          <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg" role="listbox">
            {sugestoes.map((b) => (
              <li key={b.id}>
                <button type="button" onMouseDown={escolherBairro(String(b.id), b.nome)} className="w-full px-3 py-2 text-left text-sm hover:bg-marca/10">
                  {b.nome}
                </button>
              </li>
            ))}
            <li className={sugestoes.length ? 'border-t border-gray-100' : ''}>
              <button
                type="button"
                onMouseDown={escolherBairro(OUTRO, form.bairroBusca.trim())}
                className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
              >
                Meu bairro não está na lista: usar “{form.bairroBusca.trim()}”
              </button>
            </li>
          </ul>
        )}
      </div>
      <Campo label="Rua / Avenida">
        <input className={input} value={form.endereco} onChange={alterar('endereco')} maxLength={200} autoComplete="address-line1" />
      </Campo>
      <div className="grid grid-cols-3 gap-3">
        <Campo label="Número">
          <input className={input} value={form.numero} onChange={alterar('numero')} maxLength={20} inputMode="numeric" />
        </Campo>
        <div className="col-span-2">
          <Campo label="Complemento">
            <input className={input} value={form.complemento} onChange={alterar('complemento')} maxLength={120} placeholder="Apto, bloco, referência" />
          </Campo>
        </div>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={fechar} className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold">
          Cancelar
        </button>
        <button type="submit" disabled={salvando} className={`${botaoMarca} flex-1`}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

// ---- dados

function MeusDados() {
  const { usuario, cliente, recarregar } = useConta()
  const toast = useToast()
  const [nome, setNome] = useState(cliente.nome)
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [salvando, setSalvando] = useState(false)
  // conta do Google não tem senha aqui
  const comSenha = usuario.app_metadata?.provider === 'email'

  const salvar = async (e) => {
    e.preventDefault()
    if (!nome.trim()) return toast('Informe o seu nome.')
    if (senha && senha.length < 6) return toast('A nova senha precisa ter pelo menos 6 caracteres.')
    setSalvando(true)
    try {
      await salvarCliente({ id: cliente.id, nome: nome.trim(), telefone: cliente.telefone })
      if (senha) {
        const { error } = await supabase.auth.updateUser({ password: senha })
        if (error) throw error
      }
      await recarregar()
      setSenha('')
      toast('Dados salvos', 'sucesso')
    } catch (err) {
      toast(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <Campo label="Nome">
        <input className={input} value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} autoComplete="name" />
      </Campo>
      {/* o celular é o login da conta: trocar exige ajuda da loja */}
      <Campo label="Celular" dica="Para trocar o celular, fale com a loja pelo WhatsApp.">
        <input className={input} value={mascaraTelefone(cliente.telefone)} disabled />
      </Campo>
      {comSenha && (
        <Campo label="Nova senha" dica="Deixe em branco para manter a senha atual">
          <InputSenha visivel={verSenha} alternar={() => setVerSenha(!verSenha)} value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
        </Campo>
      )}
      <button type="submit" disabled={salvando} className={botaoMarca}>
        {salvando ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  )
}
