import { useState } from 'react'
import { FaMinus, FaPlus, FaBagShopping, FaImage } from 'react-icons/fa6'
import { useCarrinho } from '../../context/CarrinhoContext'
import { useToast } from '../../context/ToastContext'
import { formatarPreco } from '../../lib/formatar'

// No celular vira uma linha (foto à esquerda); a partir de sm, cartão em coluna
export default function CardProduto({ produto }) {
  const [qntd, setQntd] = useState(0)
  const { adicionar } = useCarrinho()
  const toast = useToast()

  const adicionarAoCarrinho = () => {
    if (qntd <= 0) return
    adicionar(produto, qntd)
    setQntd(0)
    toast('Item adicionado ao carrinho', 'sucesso')
  }

  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm transition hover:shadow-md sm:flex-col sm:gap-0 sm:p-4">
      <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:aspect-square sm:size-auto">
        {produto.imagem_url ? (
          <img src={produto.imagem_url} alt={produto.nome} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <FaImage className="text-3xl text-gray-300 sm:text-4xl" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col sm:mt-4 sm:text-center">
        <p className="font-bold leading-snug">{produto.nome}</p>
        {produto.descricao && <p className="line-clamp-2 text-xs text-gray-500 sm:line-clamp-3 sm:text-sm">{produto.descricao}</p>}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2 sm:flex-col sm:pt-3">
          <p className="font-bold text-marca">{formatarPreco(produto.preco)}</p>

          <div className="flex items-center gap-1 sm:gap-3">
            <button onClick={() => setQntd(Math.max(0, qntd - 1))} className="rounded-full p-2 hover:bg-gray-100" aria-label="Diminuir">
              <FaMinus className="text-xs sm:text-base" />
            </button>
            <span className="w-5 text-center font-bold">{qntd}</span>
            <button onClick={() => setQntd(qntd + 1)} className="rounded-full p-2 hover:bg-gray-100" aria-label="Aumentar">
              <FaPlus className="text-xs sm:text-base" />
            </button>
            <button
              onClick={adicionarAoCarrinho}
              disabled={qntd === 0}
              className="rounded-full bg-marca p-2.5 text-white disabled:opacity-40 sm:p-3"
              aria-label="Adicionar ao carrinho"
            >
              <FaBagShopping />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
