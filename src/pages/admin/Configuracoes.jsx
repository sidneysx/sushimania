import { useState } from 'react'
import { Clock, ImagePlus, Loader2, Palette, Phone, Sparkles, Trash2 } from 'lucide-react'
import { useConfig } from '../../context/ConfigContext'
import { salvarConfig } from '../../services/config'
import { DIAS, HORARIOS_PADRAO, situacaoDaLoja, textoFechado } from '../../lib/horario'
import { enviarImagem, removerImagem } from '../../services/produtos'
import { usePainel } from './PainelContext'
import { Botao, Campo, Cartao, classeInput } from './ui'

const CORES_SUGERIDAS = ['#e63946', '#d62828', '#f77f00', '#2a9d8f', '#1d3557', '#6a4c93', '#111827']

export default function Configuracoes() {
  const { config, carregada } = useConfig()
  if (!carregada) return null
  // key: recria o formulário com os valores novos depois de salvar
  return <Formulario key={config.atualizado_em ?? 'padrao'} config={config} />
}

function Formulario({ config }) {
  const { recarregar } = useConfig()
  const { avisar } = usePainel()
  const [form, setForm] = useState({
    nome: config.nome,
    cor: config.cor,
    logo_url: config.logo_url,
    destaque_url: config.destaque_url,
    banner_titulo: config.banner_titulo ?? '',
    banner_destaque: config.banner_destaque ?? '',
    banner_texto: config.banner_texto ?? '',
    whatsapp: config.whatsapp ?? '',
    telefone: config.telefone ?? '',
    endereco: config.endereco ?? '',
    instagram: config.instagram ?? '',
    facebook: config.facebook ?? '',
    horarios: config.horarios.map((h) => ({ ...h })),
  })
  const [enviando, setEnviando] = useState(null) // 'logo_url' | 'destaque_url'
  const [salvando, setSalvando] = useState(false)

  const alterar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })
  const corValida = /^#[0-9a-fA-F]{6}$/.test(form.cor)

  const trocarImagem = (campo) => async (e) => {
    const arquivo = e.target.files[0]
    e.target.value = ''
    if (!arquivo) return
    setEnviando(campo)
    try {
      const url = await enviarImagem(arquivo, 'site')
      setForm((f) => ({ ...f, [campo]: url }))
    } catch (err) {
      avisar(`Não foi possível enviar a imagem: ${err.message}`, 'erro')
    } finally {
      setEnviando(null)
    }
  }

  const salvar = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) return avisar('Informe o nome da loja', 'erro')
    if (!corValida) return avisar('Cor inválida. Use o formato #RRGGBB', 'erro')
    for (const [campo, rotulo] of [['instagram', 'Instagram'], ['facebook', 'Facebook']]) {
      if (form[campo].trim() && !/^https:\/\//i.test(form[campo].trim())) return avisar(`O link do ${rotulo} precisa começar com https://`, 'erro')
    }

    const horarioInvalido = form.horarios.findIndex((h) => h.aberto && (!h.abre || !h.fecha || h.abre === h.fecha))
    if (horarioInvalido >= 0) return avisar(`Confira o horário de ${DIAS[horarioInvalido]}: abre e fecha não podem ser iguais`, 'erro')

    setSalvando(true)
    try {
      await salvarConfig({
        nome: form.nome.trim(),
        cor: form.cor.toLowerCase(),
        logo_url: form.logo_url || null,
        destaque_url: form.destaque_url || null,
        banner_titulo: form.banner_titulo.trim() || null,
        banner_destaque: form.banner_destaque.trim() || null,
        banner_texto: form.banner_texto.trim() || null,
        whatsapp: form.whatsapp.replace(/\D/g, '') || null,
        telefone: form.telefone.trim() || null,
        endereco: form.endereco.trim() || null,
        instagram: form.instagram.trim() || null,
        facebook: form.facebook.trim() || null,
        horarios: form.horarios,
      })
      // Apaga do Storage as imagens que foram trocadas ou removidas
      for (const campo of ['logo_url', 'destaque_url']) {
        if (config[campo] && config[campo] !== form[campo]) removerImagem(config[campo])
      }
      await recarregar()
      avisar('Configurações salvas')
    } catch (err) {
      avisar(`Não foi possível salvar: ${err.message}`, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-6">
      <Cartao className="space-y-5">
        <Titulo icone={Palette} titulo="Aparência" descricao="Nome, logo e cor usados no site e no painel." />

        <Campo rotulo="Nome da loja">
          <input value={form.nome} onChange={alterar('nome')} maxLength={60} className={classeInput()} />
        </Campo>

        <div className="grid gap-5 md:grid-cols-2">
          <Grupo rotulo="Cor principal" dica="Botões, destaques e detalhes do site">
            <div className="flex flex-wrap items-center gap-2">
              <input type="color" value={corValida ? form.cor : '#000000'} onChange={alterar('cor')} className="h-11 w-14 cursor-pointer rounded-xl border border-neutral-200 bg-white p-1" />
              <input value={form.cor} onChange={alterar('cor')} maxLength={7} className={`${classeInput(!corValida)} w-28 font-mono`} />
              <span className="rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm" style={{ backgroundColor: corValida ? form.cor : '#999' }}>
                Prévia
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              {CORES_SUGERIDAS.map((cor) => (
                <button
                  type="button"
                  key={cor}
                  onClick={() => setForm({ ...form, cor })}
                  aria-label={`Usar a cor ${cor}`}
                  className={`size-7 rounded-full ring-offset-2 transition ${form.cor.toLowerCase() === cor ? 'ring-2 ring-neutral-900' : 'hover:scale-110'}`}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
          </Grupo>

          <Grupo rotulo="Logo" dica="PNG com fundo transparente fica melhor">
            <SeletorImagem
              url={form.logo_url}
              enviando={enviando === 'logo_url'}
              onEscolher={trocarImagem('logo_url')}
              onRemover={() => setForm({ ...form, logo_url: null })}
              classePrevia="h-16 w-32 object-contain"
            />
          </Grupo>
        </div>
      </Cartao>

      <Cartao className="space-y-5">
        <Titulo icone={Sparkles} titulo="Capa do site" descricao="Foto larga que aparece no topo do site, atrás da logo." />
        <Grupo rotulo="Foto de capa">
          <SeletorImagem
            url={form.destaque_url}
            enviando={enviando === 'destaque_url'}
            onEscolher={trocarImagem('destaque_url')}
            onRemover={() => setForm({ ...form, destaque_url: null })}
            classePrevia="h-20 w-40 object-cover"
            dica="Foto deitada (paisagem) de um combo ou prato bonito. Sem foto, a capa fica na cor principal."
          />
        </Grupo>
      </Cartao>

      <Cartao className="space-y-5">
        <Titulo icone={Phone} titulo="Contato e redes" descricao="O WhatsApp recebe os pedidos do site; o endereço aparece no topo." />
        <div className="grid gap-5 md:grid-cols-2">
          <Campo rotulo="WhatsApp dos pedidos" dica="Com DDI e DDD. Ex.: 5599981234567">
            <input value={form.whatsapp} onChange={alterar('whatsapp')} inputMode="numeric" className={classeInput()} />
          </Campo>
          <Campo rotulo="Telefone exibido no site" dica="Ex.: (99) 98123-4567">
            <input value={form.telefone} onChange={alterar('telefone')} className={classeInput()} />
          </Campo>
          <Campo rotulo="Endereço da loja" dica="Aparece no topo do site, ao lado da logo" className="md:col-span-2">
            <input value={form.endereco} onChange={alterar('endereco')} maxLength={150} placeholder="Ex.: Rua Ceará, Bacuri, 1590" className={classeInput()} />
          </Campo>
          <Campo rotulo="Instagram" dica="Link completo do perfil">
            <input value={form.instagram} onChange={alterar('instagram')} placeholder="https://instagram.com/..." className={classeInput()} />
          </Campo>
          <Campo rotulo="Facebook" dica="Link completo da página">
            <input value={form.facebook} onChange={alterar('facebook')} placeholder="https://facebook.com/..." className={classeInput()} />
          </Campo>
        </div>
      </Cartao>

      <Horarios horarios={form.horarios} setHorarios={(horarios) => setForm({ ...form, horarios })} />

      <div className="sticky bottom-4 flex justify-end">
        <Botao type="submit" variante="marca" carregando={salvando} disabled={!!enviando} className="h-12 px-6 shadow-lg">
          Salvar configurações
        </Botao>
      </div>
    </form>
  )
}

// Segunda primeiro, domingo por último (como a semana costuma ser lida)
const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0]
const TODOS_OS_DIAS_24H = DIAS.map(() => ({ aberto: true, abre: '00:00', fecha: '23:59' }))

function Horarios({ horarios, setHorarios }) {
  const alterarDia = (dia, campos) => setHorarios(horarios.map((h, i) => (i === dia ? { ...h, ...campos } : h)))
  const { aberta, abreQuando } = situacaoDaLoja(horarios)

  return (
    <Cartao className="space-y-5">
      <Titulo
        icone={Clock}
        titulo="Horário de funcionamento"
        descricao="Fora do horário o site mostra o cardápio, mas o cliente não consegue enviar o pedido. Se fechar depois da meia-noite, é só colocar o horário (ex.: 18:00 às 02:00)."
      />

      <p className={`rounded-xl px-4 py-2.5 text-sm font-medium ${aberta ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
        Com este horário, agora a loja estaria: <b>{aberta ? 'aberta' : 'fechada'}</b>
        {!aberta && ` (${textoFechado(abreQuando)})`}
      </p>

      <div className="divide-y divide-neutral-100 rounded-2xl ring-1 ring-neutral-200">
        {ORDEM_DIAS.map((dia) => {
          const h = horarios[dia]
          return (
            <div key={dia} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <label className="flex w-36 cursor-pointer items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={h.aberto} onChange={(e) => alterarDia(dia, { aberto: e.target.checked })} className="size-4 accent-[var(--cor-marca)]" />
                {DIAS[dia]}
              </label>
              {h.aberto ? (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <input type="time" value={h.abre} onChange={(e) => alterarDia(dia, { abre: e.target.value })} className={`${classeInput()} w-32`} aria-label={`${DIAS[dia]}: abre`} />
                  às
                  <input type="time" value={h.fecha} onChange={(e) => alterarDia(dia, { fecha: e.target.value })} className={`${classeInput()} w-32`} aria-label={`${DIAS[dia]}: fecha`} />
                </div>
              ) : (
                <span className="text-sm text-neutral-400">Fechado</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Botao type="button" variante="fantasma" onClick={() => setHorarios(HORARIOS_PADRAO.map((h) => ({ ...h })))}>
          Terça a domingo, 18:30 às 23:00
        </Botao>
        <Botao type="button" variante="fantasma" onClick={() => setHorarios(TODOS_OS_DIAS_24H.map((h) => ({ ...h })))}>
          Aberto 24h todos os dias (para testes)
        </Botao>
      </div>
      <p className="text-xs text-neutral-500">Os botões só preenchem os horários acima: clique em Salvar configurações para valer no site.</p>
    </Cartao>
  )
}

// Como o Campo, mas sem <label>: para blocos com vários controles dentro
function Grupo({ rotulo, dica, children }) {
  return (
    <div>
      <span className="text-sm font-medium text-neutral-800">{rotulo}</span>
      <div className="mt-1.5">{children}</div>
      {dica && <span className="mt-1 block text-xs text-neutral-500">{dica}</span>}
    </div>
  )
}

function Titulo({ icone: Icone, titulo, descricao }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-neutral-950 text-marca">
        <Icone className="size-[18px]" />
      </span>
      <div>
        <h2 className="font-semibold">{titulo}</h2>
        <p className="text-sm text-neutral-500">{descricao}</p>
      </div>
    </div>
  )
}

function SeletorImagem({ url, enviando, onEscolher, onRemover, classePrevia, dica }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-dashed border-neutral-300 p-3">
      {url ? (
        <img src={url} alt="" className={`${classePrevia} shrink-0 rounded-xl bg-neutral-50`} />
      ) : (
        <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-400">
          {enviando ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 hover:border-marca">
          {enviando ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {url ? 'Trocar' : 'Enviar imagem'}
          <input type="file" accept="image/*" className="sr-only" onChange={onEscolher} disabled={enviando} />
        </label>
        {url && (
          <Botao type="button" variante="fantasma" onClick={onRemover}>
            <Trash2 className="size-4" /> Remover
          </Botao>
        )}
        {dica && !url && <p className="w-full text-xs text-neutral-500">{dica}</p>}
      </div>
    </div>
  )
}
