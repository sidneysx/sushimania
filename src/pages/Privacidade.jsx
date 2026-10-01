import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa6'
import { useConfig } from '../context/ConfigContext'
import { linkWhatsapp } from '../lib/config'

// Data da última mudança no texto abaixo: atualize sempre que mudar a política
const ATUALIZADA_EM = '1 de outubro de 2026'

function Secao({ titulo, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold">{titulo}</h2>
      <div className="space-y-2 text-gray-700">{children}</div>
    </section>
  )
}

// Política de Privacidade (LGPD): o que o site guarda, para quê e como pedir para apagar.
// O link desta página vai na tela de consentimento do login com Google.
export default function Privacidade() {
  const { config } = useConfig()
  const contato = config.whatsapp ? linkWhatsapp(config.whatsapp, 'Olá! Tenho uma dúvida sobre os meus dados no site.') : null

  useEffect(() => {
    document.title = `Política de Privacidade - ${config.nome}`
  }, [config.nome])

  return (
    <div className="min-h-dvh bg-[#fffdf7]">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link to="/" className="rounded-full p-2 hover:bg-gray-100" aria-label="Voltar ao cardápio">
            <FaArrowLeft />
          </Link>
          <h1 className="text-lg font-bold">Política de Privacidade</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-4 py-8 leading-relaxed">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Última atualização: {ATUALIZADA_EM}</p>
          <p className="text-gray-700">
            Esta política explica quais dados o site do <b>{config.nome}</b>
            {config.endereco && ` (${config.endereco})`} coleta quando você faz um pedido ou cria uma conta, para que eles são usados e como você pode
            pedir para corrigir ou apagar. Seguimos a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD).
          </p>
        </div>

        <Secao titulo="1. Quais dados coletamos">
          <p>
            <b>Ao fazer um pedido</b> (com ou sem conta): nome, endereço de entrega (rua, número, complemento, bairro, CEP e cidade), forma de pagamento,
            os itens escolhidos com as observações e, se você tocar em “Usar minha localização atual”, o ponto do mapa (latitude e longitude) do
            local da entrega.
          </p>
          <p>
            <b>Ao criar uma conta</b>: nome, número de celular e senha. A senha é guardada de forma criptografada e ninguém da loja tem acesso a ela.
            Se você entrar com o Google, recebemos do Google apenas o seu nome e e-mail.
          </p>
          <p>
            <b>Na conta</b>: os endereços que você salvar e o histórico dos seus pedidos.
          </p>
          <p>Não coletamos CPF, dados de cartão nem documentos. O pagamento é combinado diretamente com a loja.</p>
        </Secao>

        <Secao titulo="2. Para que usamos">
          <ul className="list-disc space-y-1 pl-5">
            <li>Preparar e entregar o seu pedido;</li>
            <li>Falar com você sobre o pedido pelo WhatsApp;</li>
            <li>Mostrar o andamento do pedido (recebido, em preparo, saiu para entrega) na sua conta;</li>
            <li>Preencher seus dados e endereços automaticamente nos próximos pedidos.</li>
          </ul>
          <p>Não usamos seus dados para propaganda e não os vendemos.</p>
        </Secao>

        <Secao titulo="3. Com quem os dados são compartilhados">
          <p>Só com os serviços necessários para o site funcionar:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <b>Supabase</b>: guarda as contas, os endereços e os pedidos com segurança;
            </li>
            <li>
              <b>Vercel</b>: hospeda o site;
            </li>
            <li>
              <b>WhatsApp</b>: o resumo do pedido é enviado por você, pelo seu WhatsApp, para o número da loja;
            </li>
            <li>
              <b>Google</b>: apenas se você escolher entrar com o Google;
            </li>
            <li>
              <b>ViaCEP</b> e <b>OpenStreetMap</b>: recebem o CEP digitado ou o ponto do mapa para descobrir a rua. Não recebem seu nome.
            </li>
          </ul>
        </Secao>

        <Secao titulo="4. Dados guardados no seu aparelho">
          <p>
            O carrinho e os dados que você está preenchendo ficam salvos no próprio navegador, para não se perderem se a página for atualizada. Eles
            são apagados ao enviar o pedido. Não usamos cookies de rastreamento nem de propaganda.
          </p>
        </Secao>

        <Secao titulo="5. Por quanto tempo guardamos">
          <p>
            Os dados da conta e os endereços ficam guardados enquanto a conta existir. Os pedidos ficam registrados para o controle da loja, mesmo
            depois que a conta é apagada, mas deixam de ficar ligados a ela.
          </p>
        </Secao>

        <Secao titulo="6. Seus direitos">
          <p>Pela LGPD, você pode a qualquer momento:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>saber quais dados seus nós temos;</li>
            <li>corrigir seus dados (nome e endereços podem ser alterados em “Minha conta”);</li>
            <li>pedir para apagar a sua conta e os seus dados.</li>
          </ul>
          <p>
            Para isso,{' '}
            {contato ? (
              <a href={contato} target="_blank" rel="noreferrer" className="font-semibold text-marca underline">
                fale com a loja pelo WhatsApp
              </a>
            ) : (
              <b>fale com a loja pelo WhatsApp</b>
            )}
            .
          </p>
        </Secao>

        <Secao titulo="7. Mudanças nesta política">
          <p>Se esta política mudar, a data de “Última atualização” no topo desta página também muda.</p>
        </Secao>

        <Link to="/" className="inline-block rounded-full bg-marca px-6 py-2.5 font-semibold text-white">
          Voltar ao cardápio
        </Link>
      </main>
    </div>
  )
}
