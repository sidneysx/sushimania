import { useState } from 'react'
import { ImagePlus, Loader2, Palette, Phone, Sparkles, Trash2 } from 'lucide-react'
import { useConfig } from '../../context/ConfigContext'
import { CONFIG_PADRAO, salvarConfig } from '../../services/config'
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
    instagram: config.instagram ?? '',
    facebook: config.facebook ?? '',
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
        instagram: form.instagram.trim() || null,
        facebook: form.facebook.trim() || null,
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
        <Titulo icone={Sparkles} titulo="Topo do site" descricao="A frase e a foto de destaque que aparecem logo no começo do site. No celular a foto fica escondida." />

        <div className="grid gap-5 md:grid-cols-2">
          <Campo rotulo="Título" dica={'Ex.: "Escolha sua comida"'}>
            <input value={form.banner_titulo} onChange={alterar('banner_titulo')} maxLength={80} placeholder={CONFIG_PADRAO.banner_titulo} className={classeInput()} />
          </Campo>
          <Campo rotulo="Parte colorida do título" dica={'Aparece na cor principal. Ex.: "favorita."'}>
            <input value={form.banner_destaque} onChange={alterar('banner_destaque')} maxLength={40} placeholder={CONFIG_PADRAO.banner_destaque} className={classeInput()} />
          </Campo>
        </div>
        <Campo rotulo="Texto abaixo do título">
          <textarea
            rows={2}
            value={form.banner_texto}
            onChange={alterar('banner_texto')}
            maxLength={300}
            placeholder={CONFIG_PADRAO.banner_texto}
            className={`${classeInput()} h-auto py-2`}
          />
        </Campo>

        <div className="grid items-center gap-6 md:grid-cols-[1fr_320px]">
          <Grupo rotulo="Foto de destaque">
            <SeletorImagem
              url={form.destaque_url}
              enviando={enviando === 'destaque_url'}
              onEscolher={trocarImagem('destaque_url')}
              onRemover={() => setForm({ ...form, destaque_url: null })}
              classePrevia="size-24 object-cover"
              dica="Foto quadrada de um combo ou prato bonito"
            />
          </Grupo>
          {/* Mini prévia do topo do site */}
          <div className="grid grid-cols-2 items-center gap-3 rounded-2xl bg-[#fffdf7] p-4 ring-1 ring-neutral-200">
            <div className="min-w-0 space-y-1.5">
              <p className="text-sm font-extrabold leading-tight">
                {form.banner_titulo || CONFIG_PADRAO.banner_titulo}{' '}
                <span style={{ color: corValida ? form.cor : '#999' }}>{form.banner_destaque || CONFIG_PADRAO.banner_destaque}</span>
              </p>
              <p className="line-clamp-3 text-[9px] leading-snug text-neutral-500">{form.banner_texto || CONFIG_PADRAO.banner_texto}</p>
              <div className="mt-2 h-3 w-12 rounded-full" style={{ backgroundColor: corValida ? form.cor : '#999' }} />
            </div>
            {form.destaque_url ? (
              <img src={form.destaque_url} alt="" className="aspect-square w-full rounded-xl object-cover" />
            ) : (
              <div className="grid aspect-square w-full place-items-center rounded-xl bg-neutral-100 text-[10px] text-neutral-400">sem foto</div>
            )}
          </div>
        </div>
      </Cartao>

      <Cartao className="space-y-5">
        <Titulo icone={Phone} titulo="Contato e redes" descricao="O WhatsApp recebe os pedidos do site." />
        <div className="grid gap-5 md:grid-cols-2">
          <Campo rotulo="WhatsApp dos pedidos" dica="Com DDI e DDD. Ex.: 5599981234567">
            <input value={form.whatsapp} onChange={alterar('whatsapp')} inputMode="numeric" className={classeInput()} />
          </Campo>
          <Campo rotulo="Telefone exibido no site" dica="Ex.: (99) 98123-4567">
            <input value={form.telefone} onChange={alterar('telefone')} className={classeInput()} />
          </Campo>
          <Campo rotulo="Instagram" dica="Link completo do perfil">
            <input value={form.instagram} onChange={alterar('instagram')} placeholder="https://instagram.com/..." className={classeInput()} />
          </Campo>
          <Campo rotulo="Facebook" dica="Link completo da página">
            <input value={form.facebook} onChange={alterar('facebook')} placeholder="https://facebook.com/..." className={classeInput()} />
          </Campo>
        </div>
      </Cartao>

      <div className="sticky bottom-4 flex justify-end">
        <Botao type="submit" variante="marca" carregando={salvando} disabled={!!enviando} className="h-12 px-6 shadow-lg">
          Salvar configurações
        </Botao>
      </div>
    </form>
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
