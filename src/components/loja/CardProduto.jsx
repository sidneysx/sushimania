import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FaImage } from 'react-icons/fa6'
import { formatarPreco } from '../../lib/formatar'
import ModalProduto from './ModalProduto'

// Linha do cardápio: nome, descrição e preço à esquerda, foto à direita.
// Tocar abre o produto (descrição completa, observação e quantidade).
export default function CardProduto({ produto }) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className="group flex w-full items-center gap-4 py-4 text-left">
        <div className="flex min-w-0 flex-1 flex-col gap-1 self-stretch">
          <p className="font-bold leading-snug uppercase group-hover:text-marca">{produto.nome}</p>
          {produto.descricao && <p className="line-clamp-2 text-sm text-gray-500">{produto.descricao}</p>}
          <p className="mt-auto pt-1 font-bold text-marca">{formatarPreco(produto.preco)}</p>
        </div>

        <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gray-100">
          {produto.imagem_url ? (
            <img src={produto.imagem_url} alt={produto.nome} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
          ) : (
            <FaImage className="text-3xl text-gray-300" />
          )}
        </div>
      </button>

      {/* no body: nada da página (barra fixa, animações) fica por cima do card aberto */}
      {aberto && createPortal(<ModalProduto produto={produto} fechar={() => setAberto(false)} />, document.body)}
    </>
  )
}
