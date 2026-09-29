import { createContext, useContext } from 'react'

// Dados carregados uma vez pelo Painel e compartilhados com as telas:
// { produtos, categorias, pedidos, bairros, carregando, recarregar, avisar }
export const PainelContext = createContext(null)

export const usePainel = () => useContext(PainelContext)
