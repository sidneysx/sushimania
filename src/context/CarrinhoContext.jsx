import { createContext, useContext, useMemo } from 'react'
import { usePersistente } from '../lib/usePersistente'

const CarrinhoContext = createContext(null)

// Mesmo produto com observações diferentes vira linhas separadas no carrinho
// (ex.: 1 Combo 1 normal e 1 Combo 1 "sem cebolinha")
export const chaveDoItem = (item) => `${item.id}|${item.obs ?? ''}`

export function CarrinhoProvider({ children }) {
  // itens guardados no navegador: atualizar a página não perde o carrinho (só limpa ao enviar o pedido)
  const [itens, setItens] = usePersistente('carrinho-itens', [])
  // aberto só na aba atual: atualizar a página no meio do pedido volta para o carrinho aberto
  const [aberto, setAberto] = usePersistente('carrinho-aberto', false, 'sessao')

  const adicionar = (produto, qntd, obs = '') => {
    const novo = { ...produto, qntd, obs: obs.trim() }
    const chave = chaveDoItem(novo)
    setItens((atuais) => {
      const existe = atuais.find((i) => chaveDoItem(i) === chave)
      if (existe) {
        return atuais.map((i) => (chaveDoItem(i) === chave ? { ...i, qntd: i.qntd + qntd } : i))
      }
      return [...atuais, novo]
    })
  }

  const alterarQuantidade = (chave, qntd) => {
    setItens((atuais) =>
      qntd <= 0 ? atuais.filter((i) => chaveDoItem(i) !== chave) : atuais.map((i) => (chaveDoItem(i) === chave ? { ...i, qntd } : i)),
    )
  }

  const remover = (chave) => setItens((atuais) => atuais.filter((i) => chaveDoItem(i) !== chave))

  const limpar = () => setItens([])

  const totais = useMemo(() => {
    const quantidade = itens.reduce((soma, i) => soma + i.qntd, 0)
    const subtotal = itens.reduce((soma, i) => soma + Number(i.preco) * i.qntd, 0)
    return { quantidade, subtotal }
  }, [itens])

  return (
    <CarrinhoContext.Provider
      value={{ itens, totais, aberto, setAberto, adicionar, alterarQuantidade, remover, limpar }}
    >
      {children}
    </CarrinhoContext.Provider>
  )
}

export const useCarrinho = () => useContext(CarrinhoContext)
