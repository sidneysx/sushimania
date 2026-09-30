import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { FaCircleCheck, FaCircleInfo, FaLocationCrosshairs, FaTriangleExclamation } from 'react-icons/fa6'
import { useToast } from '../../context/ToastContext'
import { atende, buscarBairros, cepConfere } from '../../services/bairros'

// Leaflet só é baixado quando o mapa aparece
const MapaLocalizacao = lazy(() => import('./MapaLocalizacao'))

export const PAGAMENTOS = ['Pix', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito']

// Bairro que não está na lista (o cliente digitou): taxa a combinar
const BAIRRO_NOVO = 'novo'

// Dados que vêm do CEP: apagados quando o CEP muda. O CEP não preenche bairro nem rua,
// só confere se combina com o bairro escolhido e informa a cidade.
export const DADOS_DO_CEP = {
  cepConsultado: '',
  viaBairro: '', // bairro que o ViaCEP devolveu
  cidade: '',
  uf: '',
}

// Bairro escolhido pelo cliente
export const DADOS_DO_BAIRRO = {
  bairroBusca: '',
  bairroId: '',
  bairro: '',
  taxa: null,
  situacao: '', // 'atendido' | 'fora' (não entregamos) | 'novo' (não está na lista)
}

// text-base (16px): com fonte menor o celular (principalmente iPhone) dá zoom sozinho ao tocar no campo
const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-base font-normal outline-none focus:border-marca'

function Campo({ label, className = '', children }) {
  return (
    <label className={`flex flex-col gap-1 text-sm font-semibold ${className}`}>
      {label}
      {children}
    </label>
  )
}

const mascaraCep = (texto) => {
  const n = texto.replace(/\D/g, '').slice(0, 8)
  return n.length > 5 ? `${n.slice(0, 5)}-${n.slice(5)}` : n
}

const dadosDoBairro = (b) => ({
  bairroBusca: b.nome,
  bairroId: b.id,
  bairro: b.nome,
  taxa: atende(b) ? Number(b.taxa) : null,
  situacao: atende(b) ? 'atendido' : 'fora',
})

// CEP e bairro escolhido não combinam (ex.: CEP de outro bairro)
export function cepDivergente(e, bairros) {
  if (!e.cepConsultado || !e.bairroId || e.bairroId === BAIRRO_NOVO) return false
  const escolhido = bairros.find((b) => b.id === e.bairroId)
  return !cepConfere(bairros, escolhido, e.cepConsultado, e.viaBairro)
}

export default function EtapaEndereco({ endereco, setEndereco, bairros }) {
  const toast = useToast()
  const [buscando, setBuscando] = useState(false)
  const [listaAberta, setListaAberta] = useState(false)
  const [localizando, setLocalizando] = useState(false)

  // CEP e bairro de lugares diferentes: vale o que o cliente mexeu por último e o outro é apagado.
  // Escolheu o bairro com um CEP de outro lugar -> apaga o CEP; digitou um CEP de outro bairro -> apaga o bairro.
  const anterior = useRef({ cep: endereco.cepConsultado, bairro: endereco.bairroId })
  useEffect(() => {
    const antes = anterior.current
    anterior.current = { cep: endereco.cepConsultado, bairro: endereco.bairroId }
    if (!cepDivergente(endereco, bairros)) return

    if (endereco.bairroId !== antes.bairro) {
      setEndereco((atual) => ({ ...atual, ...DADOS_DO_CEP, cep: '' }))
      toast(`O CEP digitado não é do bairro ${endereco.bairro}. Apagamos o CEP: digite o certo ou deixe em branco.`)
    } else if (endereco.cepConsultado !== antes.cep) {
      setEndereco((atual) => ({ ...atual, ...DADOS_DO_BAIRRO }))
      toast(`Esse CEP não é do bairro ${endereco.bairro}${endereco.viaBairro ? ` (é de ${endereco.viaBairro})` : ''}. Escolha o bairro de novo.`)
    }
  }, [endereco.cepConsultado, endereco.bairroId, bairros])

  const alterar = (campo) => (e) => setEndereco({ ...endereco, [campo]: e.target.value })

  const buscarCep = async (cep) => {
    setBuscando(true)
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const dados = await resposta.json()
      if (dados.erro) return toast('CEP não encontrado. Confira o número ou deixe o CEP em branco.')

      setEndereco((atual) => {
        // o cliente trocou o CEP enquanto consultava: ignora a resposta antiga
        if (atual.cep.replace(/\D/g, '') !== cep) return atual
        return { ...atual, cepConsultado: cep, viaBairro: dados.bairro ?? '', cidade: dados.localidade, uf: dados.uf }
      })
    } catch {
      toast('Não foi possível consultar o CEP. Tente novamente.')
    } finally {
      setBuscando(false)
    }
  }

  const mudarCep = (e) => {
    const cep = mascaraCep(e.target.value)
    const digitos = cep.replace(/\D/g, '')
    const mudou = digitos !== endereco.cepConsultado
    setEndereco(mudou ? { ...endereco, ...DADOS_DO_CEP, cep } : { ...endereco, cep })
    if (digitos.length === 8 && mudou) buscarCep(digitos)
  }

  // Ponto no mapa -> rua, pelo OpenStreetMap (gratuito). Usado pelo GPS e quando o cliente
  // arrasta o pino. O bairro não vem daqui: os limites de bairro do OpenStreetMap erram
  // (ex.: Parque Santa Lúcia saía como Residencial Teotônio), então o cliente escolhe na lista.
  const enderecoDoPonto = async (lat, lng) => {
    const localizacao = `${lat.toFixed(6)},${lng.toFixed(6)}`
    setLocalizando(true)
    try {
      const resposta = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=pt-BR&lat=${lat}&lon=${lng}`,
      )
      const { address: a = {} } = await resposta.json()
      setEndereco((atual) => ({
        ...atual,
        localizacao,
        endereco: a.road || atual.endereco,
        // cidade do CEP tem prioridade; sem CEP, usa a do mapa
        cidade: atual.cidade || a.city || a.town || '',
        uf: atual.uf || (a['ISO3166-2-lvl4'] ?? '').replace('BR-', ''),
      }))
      toast(a.road ? 'Localização encontrada! Confira a rua e escolha o seu bairro.' : 'Localização encontrada. Preencha a rua e o bairro.', 'sucesso')
    } catch {
      // sem o endereço, a localização ainda vai no pedido para o entregador
      setEndereco((atual) => ({ ...atual, localizacao }))
      toast('Pegamos sua localização, mas não o endereço. Preencha a rua e o bairro.')
    } finally {
      setLocalizando(false)
    }
  }

  const usarLocalizacao = () => {
    if (!('geolocation' in navigator)) return toast('Seu navegador não permite pegar a localização.')
    setLocalizando(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => enderecoDoPonto(coords.latitude, coords.longitude),
      (erro) => {
        setLocalizando(false)
        toast(
          erro.code === erro.PERMISSION_DENIED
            ? 'Permissão de localização negada. Libere nas configurações do navegador.'
            : 'Não foi possível pegar sua localização. Tente de novo ou preencha o endereço.',
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  }

  // Tira o ponto do pedido e a rua que ele preencheu
  const limparLocalizacao = () => {
    setEndereco({ ...endereco, localizacao: '', endereco: '' })
    document.getElementById('campo-endereco')?.focus()
  }

  const digitarBairro = (e) => {
    setEndereco({ ...endereco, ...DADOS_DO_BAIRRO, bairroBusca: e.target.value })
    setListaAberta(true)
  }

  // onMouseDown (e não onClick): escolhe antes do onBlur do campo fechar a lista
  const aoEscolher = (dados) => (e) => {
    e.preventDefault()
    setEndereco({ ...endereco, ...dados })
    setListaAberta(false)
  }

  const [lat, lng] = endereco.localizacao ? endereco.localizacao.split(',').map(Number) : []
  const ponto = endereco.localizacao ? { lat, lng } : null

  const sugestoes = buscarBairros(bairros, endereco.bairroBusca)
  const divergente = cepDivergente(endereco, bairros)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
      <div className="md:col-span-6">
        <button
          type="button"
          onClick={usarLocalizacao}
          disabled={localizando}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-marca/40 bg-marca/5 px-4 py-3 font-semibold text-marca transition hover:bg-marca/10 disabled:opacity-60 md:w-auto"
        >
          <FaLocationCrosshairs className={localizando ? 'animate-pulse' : ''} />
          {localizando ? 'Buscando sua localização...' : 'Usar minha localização atual'}
        </button>
        {ponto && (
          <div className="mt-2 flex flex-col gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-800 ring-1 ring-green-200">
            <p>
              📍 <b>Confira o ponto da entrega.</b> Se não estiver no lugar certo, arraste o pino ou toque no mapa.
            </p>
            <Suspense fallback={<div className="h-56 animate-pulse rounded-lg bg-gray-100" />}>
              <MapaLocalizacao lat={ponto.lat} lng={ponto.lng} aoMover={({ lat, lng }) => enderecoDoPonto(lat, lng)} />
            </Suspense>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{localizando ? 'Atualizando endereço...' : 'O entregador recebe este ponto no mapa.'}</span>
              <button type="button" onClick={limparLocalizacao} className="font-semibold text-marca underline">
                Remover localização
              </button>
            </div>
          </div>
        )}
      </div>

      <Campo label="Seu nome:" className="md:col-span-6">
        <input id="campo-nome" className={input} value={endereco.nome} onChange={alterar('nome')} autoComplete="name" />
      </Campo>
      <Campo label="CEP (opcional):" className="md:col-span-2">
        <input id="campo-cep" className={input} value={endereco.cep} onChange={mudarCep} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" />
        <span className="text-xs font-normal text-gray-500">{buscando ? 'Consultando CEP...' : 'Não sabe? Deixe em branco e escolha o bairro.'}</span>
      </Campo>

      <div className="relative md:col-span-4">
        <Campo label="Bairro:">
          <input
            id="campo-bairro"
            className={input}
            value={endereco.bairroBusca}
            onChange={digitarBairro}
            onFocus={() => setListaAberta(true)}
            onBlur={() => setListaAberta(false)}
            placeholder="Digite o nome do seu bairro ou residencial"
            autoComplete="off"
            role="combobox"
            aria-expanded={listaAberta}
          />
        </Campo>

        {listaAberta && !endereco.bairroId && endereco.bairroBusca.trim() && (
          <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg" role="listbox">
            {sugestoes.map((b) => (
              <li key={b.id}>
                <button type="button" onMouseDown={aoEscolher(dadosDoBairro(b))} className="w-full px-3 py-2 text-left text-sm hover:bg-marca/10">
                  {b.nome}
                </button>
              </li>
            ))}
            <li className={sugestoes.length ? 'border-t border-gray-100' : ''}>
              <button
                type="button"
                onMouseDown={aoEscolher({ bairroId: BAIRRO_NOVO, bairro: endereco.bairroBusca.trim(), taxa: null, situacao: 'novo' })}
                className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
              >
                Meu bairro não está na lista: usar “{endereco.bairroBusca.trim()}”
              </button>
            </li>
          </ul>
        )}
      </div>

      {(divergente || endereco.situacao) && (
        <div className="md:col-span-6">
          <Situacao endereco={endereco} divergente={divergente} />
        </div>
      )}

      <Campo label="Rua / Avenida:" className="md:col-span-3">
        <input id="campo-endereco" className={input} value={endereco.endereco} onChange={alterar('endereco')} placeholder="Nome da sua rua" autoComplete="address-line1" />
        {endereco.localizacao && <span className="text-xs font-normal text-gray-500">Preenchida pela localização. Se sua rua for outra, pode corrigir.</span>}
      </Campo>
      <Campo label="Número:">
        <input id="campo-numero" className={input} value={endereco.numero} onChange={alterar('numero')} inputMode="numeric" />
      </Campo>
      <Campo label="Complemento:" className="md:col-span-2">
        <input className={input} value={endereco.complemento} onChange={alterar('complemento')} placeholder="Apto, bloco, referência" />
      </Campo>

      <Campo label="Pagamento:" className="md:col-span-3">
        <select className={input} value={endereco.pagamento} onChange={alterar('pagamento')}>
          {PAGAMENTOS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </Campo>
      {endereco.pagamento === 'Dinheiro' && (
        <Campo label="Troco para:" className="md:col-span-3">
          <input className={input} value={endereco.troco} onChange={alterar('troco')} placeholder="Ex.: 100" />
        </Campo>
      )}
    </div>
  )
}

function Situacao({ endereco, divergente }) {
  if (divergente) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-900 ring-1 ring-red-200">
        <FaCircleInfo className="mt-0.5 shrink-0 text-lg text-red-500" />
        <p>
          <b>O CEP informado não corresponde ao bairro selecionado.</b> Confira o CEP ou o bairro.
        </p>
      </div>
    )
  }

  // sem o valor da taxa aqui: ele só aparece na revisão (etapa 3), para o cliente
  // não trocar para um bairro mais barato
  if (endereco.situacao === 'atendido') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-green-50 p-3 text-sm text-green-900 ring-1 ring-green-200">
        <FaCircleCheck className="shrink-0 text-lg text-green-600" />
        <p>
          Entregamos em <b>{endereco.bairro}</b>.
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
      <FaTriangleExclamation className="mt-0.5 shrink-0 text-lg text-amber-500" />
      <p>
        {endereco.situacao === 'fora' ? (
          <>
            <b>{endereco.bairro}</b> ainda não está na nossa área de entrega.
          </>
        ) : (
          <>
            <b>{endereco.bairro}</b> não está na nossa lista de bairros.
          </>
        )}{' '}
        Você pode enviar o pedido e a <b>taxa de entrega será combinada pelo WhatsApp</b>.
      </p>
    </div>
  )
}

// Retorna { mensagem, campo } do primeiro campo inválido, ou null.
// `campo` casa com o id "campo-<campo>" do input, para focar nele.
export function validarEndereco(e, bairros) {
  const erro = (mensagem, campo) => ({ mensagem, campo })
  if (!e.nome.trim()) return erro('Informe o seu nome, por favor.', 'nome')
  // CEP é opcional; se foi digitado, precisa estar completo e encontrado
  const cep = e.cep.replace(/\D/g, '')
  if (cep && cep.length !== 8) return erro('Complete o CEP ou deixe o campo em branco.', 'cep')
  if (cep && cep !== e.cepConsultado) return erro('CEP não encontrado. Confira o número ou deixe o campo em branco.', 'cep')
  if (!e.bairroId) return erro('Escolha o seu bairro na lista, por favor.', 'bairro')
  if (cepDivergente(e, bairros)) return erro('O CEP informado não corresponde ao bairro selecionado.', 'cep')
  if (!e.endereco.trim()) return erro('Informe a Rua, por favor.', 'endereco')
  if (!e.numero.trim()) return erro('Informe o Número, por favor.', 'numero')
  return null
}

// Nome do bairro gravado no pedido. Bairro digitado pelo cliente ganha uma marca,
// para o banco nunca aplicar a taxa de um bairro cadastrado a partir de texto livre.
export const bairroDoPedido = (e) => (e.situacao === 'novo' ? `${e.bairro.trim()} (informado pelo cliente)` : e.bairro)
