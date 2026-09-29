import { createContext, useContext, useMemo, useState } from 'react'

const CarrinhoContext = createContext(null)

export function CarrinhoProvider({ children }) {
  const [itens, setItens] = useState([])
  const [aberto, setAberto] = useState(false)

  const adicionar = (produto, qntd) => {
    setItens((atuais) => {
      const existe = atuais.find((i) => i.id === produto.id)
      if (existe) {
        return atuais.map((i) => (i.id === produto.id ? { ...i, qntd: i.qntd + qntd } : i))
      }
      return [...atuais, { ...produto, qntd }]
    })
  }

  const alterarQuantidade = (id, qntd) => {
    setItens((atuais) =>
      qntd <= 0 ? atuais.filter((i) => i.id !== id) : atuais.map((i) => (i.id === id ? { ...i, qntd } : i)),
    )
  }

  const remover = (id) => setItens((atuais) => atuais.filter((i) => i.id !== id))

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
