import { useState } from 'react'
import { FaCircleCheck, FaLock, FaTriangleExclamation } from 'react-icons/fa6'
import { useToast } from '../../context/ToastContext'
import { atende, bairroDoCep } from '../../services/bairros'
import { formatarPreco } from '../../lib/formatar'

export const PAGAMENTOS = ['Pix', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito']

// Tudo que vem do CEP (bairro, taxa, cidade) é apagado quando o CEP muda
export const DADOS_DO_CEP = {
  cepConsultado: '',
  situacao: '', // 'atendido' | 'fora' (bairro sem entrega) | 'geral' (CEP sem bairro)
  bairro: '',
  bairroId: '',
  taxa: null,
  cidade: '',
  uf: '',
  endereco: '',
  logradouroDoCep: false,
}

const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-marca'

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

export default function EtapaEndereco({ endereco, setEndereco, bairros }) {
  const toast = useToast()
  const [buscando, setBuscando] = useState(false)

  const alterar = (campo) => (e) => setEndereco({ ...endereco, [campo]: e.target.value })

  const buscarCep = async (cep) => {
    setBuscando(true)
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const dados = await resposta.json()
      if (dados.erro) return toast('CEP não encontrado. Confira o número.')

      const cadastrado = bairroDoCep(bairros, cep, dados.bairro)
      const situacao = cadastrado && atende(cadastrado) ? 'atendido' : dados.bairro || cadastrado ? 'fora' : 'geral'

      setEndereco((atual) => {
        // o cliente trocou o CEP enquanto consultava: ignora a resposta antiga
        if (atual.cep.replace(/\D/g, '') !== cep) return atual
        return {
          ...atual,
          cepConsultado: cep,
          situacao,
          bairro: cadastrado?.nome ?? dados.bairro ?? '',
          bairroId: situacao === 'atendido' ? cadastrado.id : '',
          taxa: situacao === 'atendido' ? Number(cadastrado.taxa) : null,
          cidade: dados.localidade,
          uf: dados.uf,
          endereco: dados.logradouro ?? '',
          logradouroDoCep: !!dados.logradouro,
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
    // CEP mudou: descarta bairro/taxa do CEP anterior
    const base = digitos === endereco.cepConsultado ? { ...endereco, cep } : { ...endereco, ...DADOS_DO_CEP, cep }
    setEndereco(base)
    if (digitos.length === 8 && digitos !== endereco.cepConsultado) buscarCep(digitos)
  }

  const consultado = !!endereco.cepConsultado

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

      <Campo label="CEP:" className="md:col-span-2">
        <input className={input} value={endereco.cep} onChange={mudarCep} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" />
        <span className="text-xs font-normal text-gray-500">
          {buscando ? 'Consultando CEP...' : 'O bairro e a taxa de entrega são definidos pelo CEP.'}
        </span>
      </Campo>

      <div className="md:col-span-4 md:pt-6">{consultado && <ResultadoCep endereco={endereco} />}</div>

      {consultado && (
        <>
          {endereco.situacao === 'geral' && (
            <Campo label="Bairro:" className="md:col-span-6">
              <input className={input} value={endereco.bairro} onChange={alterar('bairro')} placeholder="Digite o seu bairro" />
            </Campo>
          )}
          {/* Rua sempre editável: há CEPs de rodovia/área (ex.: 65916-973) que cobrem ruas próximas sem CEP próprio */}
          <Campo label="Rua / Avenida:" className="md:col-span-3">
            <input className={input} value={endereco.endereco} onChange={alterar('endereco')} placeholder="Nome da sua rua" autoComplete="address-line1" />
            {endereco.logradouroDoCep && (
              <span className="text-xs font-normal text-gray-500">Preenchido pelo CEP. Se sua rua for outra, pode corrigir.</span>
            )}
          </Campo>
          <Campo label="Número:">
            <input className={input} value={endereco.numero} onChange={alterar('numero')} inputMode="numeric" />
          </Campo>
          <Campo label="Complemento:" className="md:col-span-2">
            <input className={input} value={endereco.complemento} onChange={alterar('complemento')} placeholder="Apto, bloco, referência" />
          </Campo>
        </>
      )}
    </div>
  )
}

function ResultadoCep({ endereco }) {
  const local = `${endereco.cidade}-${endereco.uf}`

  if (endereco.situacao === 'atendido') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-green-50 p-3 text-sm text-green-900 ring-1 ring-green-200">
        <FaCircleCheck className="shrink-0 text-lg text-green-600" />
        <div className="flex-1">
          <p className="flex items-center gap-1.5 font-bold">
            {endereco.bairro} <FaLock className="text-xs text-green-600" title="Definido pelo CEP" />
          </p>
          <p className="text-xs">
            {local} · Entrega: <b>{formatarPreco(endereco.taxa)}</b>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
      <FaTriangleExclamation className="mt-0.5 shrink-0 text-lg text-amber-500" />
      <p>
        {endereco.situacao === 'fora' ? (
          <>
            <b>{endereco.bairro ? `${endereco.bairro} (${local})` : local}</b> ainda não está na nossa área de entrega.
          </>
        ) : (
          <>Este CEP é geral de {local}, então não identificamos o bairro.</>
        )}{' '}
        Você pode enviar o pedido e a <b>taxa de entrega será combinada pelo WhatsApp</b>.
      </p>
    </div>
  )
}

// Retorna a mensagem de erro do primeiro campo inválido, ou null
export function validarEndereco(e) {
  if (!e.nome.trim()) return 'Informe o seu nome, por favor.'
  if (!e.cepConsultado || e.cep.replace(/\D/g, '') !== e.cepConsultado) return 'Informe um CEP válido, por favor.'
  if (!e.bairro.trim()) return 'Informe o Bairro, por favor.'
  if (!e.endereco.trim()) return 'Informe o Endereço, por favor.'
  if (!e.numero.trim()) return 'Informe o Número, por favor.'
  return null
}

// Nome do bairro gravado no pedido. Bairro digitado pelo cliente ganha uma marca,
// para o banco nunca aplicar a taxa de um bairro cadastrado a partir de texto livre.
export const bairroDoPedido = (e) => (e.situacao === 'geral' ? `${e.bairro.trim()} (informado pelo cliente)` : e.bairro)
