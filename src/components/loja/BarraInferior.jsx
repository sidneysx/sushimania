import { FaBagShopping, FaChevronRight, FaWhatsapp } from 'react-icons/fa6'
import { useCarrinho } from '../../context/CarrinhoContext'
import { useConfig } from '../../context/ConfigContext'
import { linkWhatsapp } from '../../lib/config'
import { formatarPreco } from '../../lib/formatar'

// Barra fixa embaixo: com itens, abre o carrinho; sem itens, tira dúvidas no WhatsApp
export default function BarraInferior() {
  const { totais, setAberto } = useCarrinho()
  const { config } = useConfig()

  if (totais.quantidade === 0 && !config.whatsapp) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-white via-white/95 to-white/0 px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md">
        {totais.quantidade > 0 ? (
          <button
            onClick={() => setAberto(true)}
            className="flex w-full items-center gap-3 rounded-2xl bg-marca px-5 py-3.5 font-semibold text-white shadow-lg transition active:scale-[0.98]"
          >
            <span className="relative">
              <FaBagShopping className="text-lg" />
              <span className="absolute -top-2 -right-2.5 grid min-w-5 place-items-center rounded-full bg-white px-1 text-xs font-bold text-marca">
                {totais.quantidade}
              </span>
            </span>
            <span className="flex-1 text-center">Ver carrinho</span>
            <span>{formatarPreco(totais.subtotal)}</span>
          </button>
        ) : (
          <a
            href={linkWhatsapp(config.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="mx-auto flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-md ring-1 ring-gray-100"
          >
            <FaWhatsapp className="text-lg text-green-600" />
            Tirar dúvidas no WhatsApp
            <FaChevronRight className="text-xs text-gray-400" />
          </a>
        )}
      </div>
    </div>
  )
}
