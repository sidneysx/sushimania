import { useEffect, useState } from 'react'
import { FaMinus, FaPlus, FaXmark, FaImage } from 'react-icons/fa6'
import { useCarrinho } from '../../context/CarrinhoContext'
import { useToast } from '../../context/ToastContext'
import { formatarPreco } from '../../lib/formatar'
import { textoFechado } from '../../lib/horario'
import { useLojaAberta } from '../../lib/useLojaAberta'

const LIMITE_OBS = 140

// Produto aberto: foto grande, descrição completa, observação e quantidade.
// No celular sobe de baixo (folha); a partir de sm, janela no centro.
export default function ModalProduto({ produto, fechar }) {
  const [qntd, setQntd] = useState(1)
  const [obs, setObs] = useState('')
  const { adicionar } = useCarrinho()
  const toast = useToast()
  const { aberta, abreQuando } = useLojaAberta()

  // Esc fecha e a página de trás não rola enquanto o card está aberto
  useEffect(() => {
    const aoTeclar = (e) => e.key === 'Escape' && fechar()
    const overflowAntes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', aoTeclar)
    return () => {
      document.body.style.overflow = overflowAntes
      window.removeEventListener('keydown', aoTeclar)
    }
  }, [fechar])

  const adicionarAoCarrinho = () => {
    adicionar(produto, qntd, obs)
    toast('Item adicionado ao carrinho', 'sucesso')
    fechar()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={fechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={produto.nome}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white sm:max-w-lg sm:rounded-3xl"
      >
        <div className="overflow-y-auto">
          <div className="relative flex aspect-[4/3] items-center justify-center bg-gray-100">
            {produto.imagem_url ? (
              <img src={produto.imagem_url} alt={produto.nome} className="h-full w-full object-cover" />
            ) : (
              <FaImage className="text-5xl text-gray-300" />
            )}
            <button
              onClick={fechar}
              className="absolute top-3 right-3 rounded-full bg-white/90 p-2 text-lg shadow"
              aria-label="Fechar"
            >
              <FaXmark />
            </button>
          </div>

          <div className="flex flex-col gap-3 p-5">
            <h2 className="text-xl font-bold leading-snug">{produto.nome}</h2>
            {produto.descricao && <p className="whitespace-pre-line text-gray-600">{produto.descricao}</p>}
            <p className="text-lg font-bold text-marca">{formatarPreco(produto.preco)}</p>

            <label className="mt-2 flex flex-col gap-1 text-sm font-semibold">
              Alguma observação?
              {/* text-base (16px): com fonte menor o iPhone dá zoom sozinho ao tocar no campo */}
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value.slice(0, LIMITE_OBS))}
                rows={3}
                placeholder="Ex.: sem cebolinha, molho à parte..."
                className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-base font-normal outline-none focus:border-marca"
              />
              <span className="self-end text-xs font-normal text-gray-400">
                {obs.length}/{LIMITE_OBS}
              </span>
            </label>
          </div>
        </div>

        {!aberta && (
          <p className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-900">
            {textoFechado(abreQuando)} Você pode montar o carrinho e enviar quando abrirmos.
          </p>
        )}
        <div className="flex items-center gap-3 border-t border-gray-100 p-4">
          <div className="flex items-center gap-1 rounded-full border border-gray-200">
            <button onClick={() => setQntd(Math.max(1, qntd - 1))} className="rounded-full p-3 disabled:opacity-30" disabled={qntd === 1} aria-label="Diminuir">
              <FaMinus />
            </button>
            <span className="w-6 text-center font-bold">{qntd}</span>
            <button onClick={() => setQntd(Math.min(99, qntd + 1))} className="rounded-full p-3" aria-label="Aumentar">
              <FaPlus />
            </button>
          </div>
          <button onClick={adicionarAoCarrinho} className="flex flex-1 items-center justify-between gap-2 rounded-full bg-marca px-5 py-3 font-semibold text-white">
            <span>Adicionar</span>
            <span>{formatarPreco(produto.preco * qntd)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
