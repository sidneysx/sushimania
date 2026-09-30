import { FaMinus, FaPlus, FaXmark, FaImage } from 'react-icons/fa6'
import { chaveDoItem, useCarrinho } from '../../context/CarrinhoContext'
import { formatarPreco } from '../../lib/formatar'

export default function EtapaItens() {
  const { itens, alterarQuantidade, remover } = useCarrinho()

  if (itens.length === 0) {
    return (
      <div className="py-10 text-center text-gray-500">
        <img src="/img/icone-carrinho-vazio.svg" alt="" className="mx-auto mb-4 h-32" />
        Seu carrinho está vazio.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {itens.map((item) => (
        <div key={chaveDoItem(item)} className="flex items-center gap-4 rounded-xl bg-white p-3 shadow-sm">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
            {item.imagem_url ? (
              <img src={item.imagem_url} alt={item.nome} className="h-full w-full object-cover" />
            ) : (
              <FaImage className="text-gray-300" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold">{item.nome}</p>
            {item.obs && <p className="text-xs break-words text-gray-500">Obs.: {item.obs}</p>}
            <p className="text-sm font-semibold text-marca">{formatarPreco(item.preco)}</p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => alterarQuantidade(chaveDoItem(item), item.qntd - 1)} className="rounded-full p-2 hover:bg-gray-100" aria-label="Diminuir">
              <FaMinus />
            </button>
            <span className="w-6 text-center font-bold">{item.qntd}</span>
            <button onClick={() => alterarQuantidade(chaveDoItem(item), item.qntd + 1)} className="rounded-full p-2 hover:bg-gray-100" aria-label="Aumentar">
              <FaPlus />
            </button>
            <button onClick={() => remover(chaveDoItem(item))} className="ml-2 hidden rounded-full bg-red-50 p-2 text-red-600 sm:block" aria-label="Remover">
              <FaXmark />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
