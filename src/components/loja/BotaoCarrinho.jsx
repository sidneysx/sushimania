import { FaBagShopping } from 'react-icons/fa6'
import { useCarrinho } from '../../context/CarrinhoContext'

// Botão flutuante que aparece quando há itens no carrinho
export default function BotaoCarrinho() {
  const { totais, setAberto } = useCarrinho()
  if (totais.quantidade === 0) return null

  return (
    <button
      onClick={() => setAberto(true)}
      className="fixed right-6 bottom-6 z-40 rounded-full bg-marca p-5 text-2xl text-white shadow-lg hover:scale-105"
      aria-label="Abrir carrinho"
    >
      <FaBagShopping />
      <span className="absolute -top-1 -right-1 rounded-full bg-white px-2 text-sm font-bold text-marca shadow">
        {totais.quantidade}
      </span>
    </button>
  )
}
