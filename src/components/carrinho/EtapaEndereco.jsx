import { useState } from 'react'
import { FaCircleCheck, FaCircleInfo, FaLocationCrosshairs, FaTriangleExclamation } from 'react-icons/fa6'
import { useToast } from '../../context/ToastContext'
import { atende, bairroDoCep, buscarBairros, cepConfere, normalizarBairro } from '../../services/bairros'
import { formatarPreco } from '../../lib/formatar'

export const PAGAMENTOS = ['Pix', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito']

// Bairro que não está na lista (o cliente digitou): taxa a combinar
const BAIRRO_NOVO = 'novo'

// Dados que vêm do CEP: apagados quando o CEP muda
export const DADOS_DO_CEP = {
  cepConsultado: '',
  viaBairro: '', // bairro que o ViaCEP devolveu
  cidade: '',
  uf: '',
  endereco: '',
  logradouroDoCep: false,
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
        // ainda não escolheu o bairro: já sugere o bairro do CEP
        const sugestao = !atual.bairroId && bairroDoCep(bairros, cep, dados.bairro)
        return {
          ...atual,
          cepConsultado: cep,
          viaBairro: dados.bairro ?? '',
          cidade: dados.localidade,
          uf: dados.uf,
          endereco: dados.logradouro || atual.endereco,
          logradouroDoCep: !!dados.logradouro,
          ...(sugestao ? dadosDoBairro(sugestao) : {}),
        }
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
    setEndereco(mudou ? { ...endereco, ...DADOS_DO_CEP, endereco: endereco.endereco, cep } : { ...endereco, cep })
    if (digitos.length === 8 && mudou) buscarCep(digitos)
  }

  // GPS do celular + OpenStreetMap (gratuito) para descobrir rua e bairro
  const usarLocalizacao = () => {
    if (!('geolocation' in navigator)) return toast('Seu navegador não permite pegar a localização.')
    setLocalizando(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const localizacao = `${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`
        try {
          const resposta = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=pt-BR&lat=${coords.latitude}&lon=${coords.longitude}`,
          )
          const { address: a = {} } = await resposta.json()
          const nomeBairro = a.suburb || a.neighbourhood || a.quarter || a.city_district || ''
          const cadastrado = nomeBairro && bairros.find((b) => normalizarBairro(b.nome) === normalizarBairro(nomeBairro))

          setEndereco((atual) => ({
            ...atual,
            // a localização substitui o CEP digitado antes (evita CEP e bairro de lugares diferentes)
            ...DADOS_DO_CEP,
            cep: '',
            localizacao,
            endereco: a.road || atual.endereco,
            numero: a.house_number || atual.numero,
            cidade: a.city || a.town || '',
            uf: (a['ISO3166-2-lvl4'] ?? '').replace('BR-', ''),
            ...(cadastrado ? dadosDoBairro(cadastrado) : { ...DADOS_DO_BAIRRO, bairroBusca: nomeBairro }),
          }))
          toast(cadastrado ? 'Localização encontrada! Confira o endereço.' : 'Localização encontrada. Escolha o seu bairro na lista.', 'sucesso')
          if (!cadastrado) setListaAberta(true)
        } catch {
          // sem o endereço, a localização ainda vai no pedido para o entregador
          setEndereco((atual) => ({ ...atual, localizacao }))
          toast('Pegamos sua localização, mas não o endereço. Preencha o bairro e a rua.')
        } finally {
          setLocalizando(false)
        }
      },
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

  const sugestoes = buscarBairros(bairros, endereco.bairroBusca)
  const divergente = cepDivergente(endereco, bairros)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
      <Campo label="Seu nome:" className="md:col-span-3">
        <input className={input} value={endereco.nome} onChange={alterar('nome')} autoComplete="name" />
      </Campo>
      <Campo label="Pagamento:" className={endereco.pagamento === 'Dinheiro' ? 'md:col-span-2' : 'md:col-span-3'}>
        <select className={input} value={endereco.pagamento} onChange={alterar('pagamento')}>
          {PAGAMENTOS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </Campo>
      {endereco.pagamento === 'Dinheiro' && (
        <Campo label="Troco para:">
          <input className={input} value={endereco.troco} onChange={alterar('troco')} placeholder="Ex.: 100" />
        </Campo>
      )}

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
        {endereco.localizacao && !localizando && (
          <p className="mt-1 text-xs text-green-700">📍 Localização anexada ao pedido: o entregador recebe o ponto no mapa.</p>
        )}
      </div>

      <Campo label="CEP (opcional):" className="md:col-span-2">
        <input className={input} value={endereco.cep} onChange={mudarCep} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" />
        <span className="text-xs font-normal text-gray-500">{buscando ? 'Consultando CEP...' : 'Não sabe? Deixe em branco e escolha o bairro.'}</span>
      </Campo>

      <div className="relative md:col-span-4">
        <Campo label="Bairro:">
          <input
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

      {/* Rua sempre editável: há CEPs de rodovia/área (ex.: 65916-973) que cobrem ruas próximas sem CEP próprio */}
      <Campo label="Rua / Avenida:" className="md:col-span-3">
        <input className={input} value={endereco.endereco} onChange={alterar('endereco')} placeholder="Nome da sua rua" autoComplete="address-line1" />
        {endereco.logradouroDoCep && <span className="text-xs font-normal text-gray-500">Preenchido pelo CEP. Se sua rua for outra, pode corrigir.</span>}
      </Campo>
      <Campo label="Número:">
        <input className={input} value={endereco.numero} onChange={alterar('numero')} inputMode="numeric" />
      </Campo>
      <Campo label="Complemento:" className="md:col-span-2">
        <input className={input} value={endereco.complemento} onChange={alterar('complemento')} placeholder="Apto, bloco, referência" />
      </Campo>
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

  if (endereco.situacao === 'atendido') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-green-50 p-3 text-sm text-green-900 ring-1 ring-green-200">
        <FaCircleCheck className="shrink-0 text-lg text-green-600" />
        <p>
          Entrega em <b>{endereco.bairro}</b>: <b>{formatarPreco(endereco.taxa)}</b>
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

// Retorna a mensagem de erro do primeiro campo inválido, ou null
export function validarEndereco(e, bairros) {
  if (!e.nome.trim()) return 'Informe o seu nome, por favor.'
  // CEP é opcional; se foi digitado, precisa estar completo e encontrado
  const cep = e.cep.replace(/\D/g, '')
  if (cep && cep.length !== 8) return 'Complete o CEP ou deixe o campo em branco.'
  if (cep && cep !== e.cepConsultado) return 'CEP não encontrado. Confira o número ou deixe o campo em branco.'
  if (!e.bairroId) return 'Escolha o seu bairro na lista, por favor.'
  if (cepDivergente(e, bairros)) return 'O CEP informado não corresponde ao bairro selecionado.'
  if (!e.endereco.trim()) return 'Informe a Rua, por favor.'
  if (!e.numero.trim()) return 'Informe o Número, por favor.'
  return null
}

// Nome do bairro gravado no pedido. Bairro digitado pelo cliente ganha uma marca,
// para o banco nunca aplicar a taxa de um bairro cadastrado a partir de texto livre.
export const bairroDoPedido = (e) => (e.situacao === 'novo' ? `${e.bairro.trim()} (informado pelo cliente)` : e.bairro)
