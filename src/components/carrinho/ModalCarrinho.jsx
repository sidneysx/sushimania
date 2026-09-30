import { useEffect, useState } from 'react'
import { FaMotorcycle } from 'react-icons/fa6'
import { useCarrinho } from '../../context/CarrinhoContext'
import { useToast } from '../../context/ToastContext'
import { useConfig } from '../../context/ConfigContext'
import { formatarPreco } from '../../lib/formatar'
import { usePersistente } from '../../lib/usePersistente'
import { linkWhatsapp } from '../../lib/config'
import { listarBairros } from '../../services/bairros'
import { gerarCodigo, registrarPedido } from '../../services/pedidos'
import EtapaItens from './EtapaItens'
import EtapaEndereco, { DADOS_DO_BAIRRO, DADOS_DO_CEP, PAGAMENTOS, bairroDoPedido, validarEndereco } from './EtapaEndereco'
import EtapaResumo from './EtapaResumo'

const TITULOS = { 1: 'Seu carrinho:', 2: 'Seus dados e entrega:', 3: 'Resumo do pedido:' }

// taxa: null enquanto o bairro não foi escolhido ou quando ele não é atendido (a combinar)
const ENDERECO_VAZIO = {
  nome: '',
  pagamento: PAGAMENTOS[0],
  troco: '',
  cep: '',
  endereco: '', // rua
  numero: '',
  complemento: '',
  localizacao: '', // "lat,lng" do botão "Usar minha localização"
  ...DADOS_DO_CEP,
  ...DADOS_DO_BAIRRO,
}

const enderecoCompleto = (e) => {
  const cidade = e.cidade ? `${e.cidade}${e.uf ? `-${e.uf}` : ''}` : ''
  return [
    `${e.endereco}, ${e.numero}${e.complemento ? ` (${e.complemento})` : ''}`,
    bairroDoPedido(e),
    cidade,
    e.cep ? `CEP ${e.cep}` : '',
  ]
    .filter(Boolean)
    .join(' - ')
}

const linkMapa = (localizacao) => `https://www.google.com/maps?q=${localizacao}`

function montarMensagem(codigo, itens, e, subtotal) {
  const linhas = [
    'Olá! Gostaria de fazer um pedido:',
    '',
    `*Pedido:* #${codigo}`,
    `*Nome:* ${e.nome.trim()}`,
    '',
    '*Itens do pedido:*',
    ...itens.flatMap((i) => [
      `*${i.qntd}x* ${i.nome} ....... ${formatarPreco(i.preco * i.qntd)}`,
      ...(i.obs ? [`   _Obs.: ${i.obs}_`] : []),
    ]),
    '',
    '*Endereço de entrega:*',
    enderecoCompleto(e),
    ...(e.localizacao ? [`📍 Localização: ${linkMapa(e.localizacao)}`] : []),
    '',
    `*Pagamento:* ${e.pagamento}${e.pagamento === 'Dinheiro' && e.troco.trim() ? ` (troco para ${e.troco.trim()})` : ''}`,
  ]
  if (e.taxa === null) {
    linhas.push(`*Subtotal: ${formatarPreco(subtotal)}*`, '*Taxa de entrega: a combinar*')
  } else {
    linhas.push(`Taxa de entrega: ${formatarPreco(e.taxa)}`, `*Total (com entrega): ${formatarPreco(subtotal + e.taxa)}*`)
  }
  return linhas.join('\n')
}

export default function ModalCarrinho() {
  const { itens, totais, aberto, setAberto, limpar } = useCarrinho()
  const { config } = useConfig()
  const toast = useToast()
  // etapa e dados de entrega sobrevivem a atualizar a página; só são limpos ao enviar o pedido
  const [etapa, setEtapa] = usePersistente('carrinho-etapa', 1, 'sessao')
  const [enderecoSalvo, setEndereco] = usePersistente('carrinho-endereco', ENDERECO_VAZIO)
  // campos novos que ainda não existiam no que foi salvo ficam com o valor padrão
  const endereco = { ...ENDERECO_VAZIO, ...enderecoSalvo }
  const [bairros, setBairros] = useState([])

  useEffect(() => {
    if (aberto && bairros.length === 0) {
      // todos os bairros (inclusive não atendidos) para identificar o bairro pelo CEP
      listarBairros()
        .then(setBairros)
        .catch(() => toast('Não foi possível carregar os bairros.'))
    }
  }, [aberto])

  if (!aberto) return null

  // Fechar (para escolher mais itens): volta à etapa 1. Itens e dados de entrega continuam
  // guardados; só são limpos ao enviar o pedido.
  const fechar = () => {
    setAberto(false)
    setEtapa(1)
  }

  const voltar = () => setEtapa(etapaAtual - 1)

  const avancarParaEndereco = () => {
    if (itens.length === 0) return toast('Seu carrinho está vazio.')
    setEtapa(2)
  }

  const avancarParaResumo = () => {
    const erro = validarEndereco(endereco, bairros)
    if (erro) {
      toast(erro.mensagem)
      const campo = document.getElementById(`campo-${erro.campo}`)
      campo?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      campo?.focus({ preventScroll: true })
      return
    }
    setEtapa(3)
  }

  // se o carrinho esvaziar nas etapas 2/3, volta para a 1
  const etapaAtual = itens.length === 0 ? 1 : etapa

  const total = totais.subtotal + (endereco.taxa ?? 0)

  const enviarPedido = () => {
    const codigo = gerarCodigo()
    // Abre o WhatsApp primeiro: se esperar o banco, o navegador bloqueia o pop-up.
    window.open(linkWhatsapp(config.whatsapp, montarMensagem(codigo, itens, endereco, totais.subtotal)), '_blank', 'noopener')

    // Registra o pedido para o painel. Se falhar, o pedido já foi pelo WhatsApp mesmo assim.
    registrarPedido({
      codigo,
      cliente_nome: endereco.nome.trim(),
      pagamento: endereco.pagamento,
      troco: endereco.pagamento === 'Dinheiro' ? endereco.troco.trim() || null : null,
      endereco: enderecoCompleto(endereco),
      bairro: bairroDoPedido(endereco),
      cep: endereco.cep || null,
      localizacao: endereco.localizacao || null,
      itens: itens.map(({ id, nome, qntd, preco, imagem_url, obs }) => ({ id, nome, qtd: qntd, preco: Number(preco), imagem_url, obs: obs || null })),
      // subtotal, taxa e total são recalculados pelo banco (gatilho validar_pedido)
      subtotal: totais.subtotal,
      taxa_entrega: endereco.taxa,
      total,
    }).catch((e) => console.error('Pedido não registrado:', e.message))

    toast(`Pedido #${codigo} enviado! Finalize a conversa no WhatsApp.`, 'sucesso', 6000)
    limpar()
    setEndereco(ENDERECO_VAZIO)
    fechar()
  }
  const textoEntrega =
    endereco.taxa !== null ? `+ ${formatarPreco(endereco.taxa)}` : endereco.situacao ? 'a combinar' : 'informe o bairro'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fffdf7]">
      <div className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    n <= etapaAtual ? 'bg-marca text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {n}
                </div>
              ))}
            </div>
            <button onClick={fechar} className="rounded-full border border-gray-200 px-4 py-1 font-semibold">
              Fechar
            </button>
          </div>
          <p className="mt-4 text-xl font-bold">{TITULOS[etapaAtual]}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          {etapaAtual === 1 && <EtapaItens />}
          {etapaAtual === 2 && <EtapaEndereco endereco={endereco} setEndereco={setEndereco} bairros={bairros} />}
          {etapaAtual === 3 && <EtapaResumo endereco={endereco} />}
        </div>
      </div>

      <div className="border-t border-gray-100 bg-white">
        <div className="container mx-auto flex flex-col items-end gap-4 px-4 py-4">
          {/* na etapa 2 o cliente ainda está preenchendo a entrega: valores só na 1 e na revisão (3) */}
          {etapaAtual !== 2 && (
            <div className="text-right">
              <p>
                Subtotal: <span className="font-semibold">{formatarPreco(totais.subtotal)}</span>
              </p>
              <p className="text-gray-500">
                <FaMotorcycle className="inline" /> Entrega: {textoEntrega}
              </p>
              <p className="text-lg">
                <b>Total: <span className="text-marca">{formatarPreco(total)}</span></b>
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {etapaAtual > 1 && (
              <button onClick={voltar} className="rounded-full border border-gray-200 px-6 py-2 font-semibold">
                Voltar
              </button>
            )}
            {etapaAtual === 1 && (
              <button onClick={avancarParaEndereco} className="rounded-full bg-marca px-6 py-2 font-semibold text-white">
                Continuar
              </button>
            )}
            {etapaAtual === 2 && (
              <button onClick={avancarParaResumo} className="rounded-full bg-marca px-6 py-2 font-semibold text-white">
                Revisar pedido
              </button>
            )}
            {etapaAtual === 3 && (
              <button onClick={enviarPedido} className="rounded-full bg-marca px-6 py-2 font-semibold text-white">
                Enviar pedido
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
