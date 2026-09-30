import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FaPlus, FaImage } from 'react-icons/fa6'
import { formatarPreco } from '../../lib/formatar'
import ModalProduto from './ModalProduto'

// No celular vira uma linha (foto à esquerda); a partir de sm, cartão em coluna.
// Tocar no card abre o produto (descrição completa, observação e quantidade).
export default function CardProduto({ produto }) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition hover:shadow-md sm:flex-col sm:gap-0 sm:p-4"
      >
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:aspect-square sm:size-auto sm:w-full">
          {produto.imagem_url ? (
            <img src={produto.imagem_url} alt={produto.nome} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <FaImage className="text-3xl text-gray-300 sm:text-4xl" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col self-stretch sm:mt-4 sm:text-center">
          <p className="font-bold leading-snug">{produto.nome}</p>
          {produto.descricao && <p className="line-clamp-2 text-xs text-gray-500 sm:line-clamp-3 sm:text-sm">{produto.descricao}</p>}

          <div className="mt-auto flex items-center justify-between gap-2 pt-2 sm:pt-3">
            <p className="font-bold text-marca">{formatarPreco(produto.preco)}</p>
            <span className="rounded-full bg-marca p-2.5 text-white sm:p-3" aria-hidden="true">
              <FaPlus />
            </span>
          </div>
        </div>
      </button>

      {/* no body: nada da página (cabeçalho fixo, animações) fica por cima do card aberto */}
      {aberto && createPortal(<ModalProduto produto={produto} fechar={() => setAberto(false)} />, document.body)}
    </>
  )
}
