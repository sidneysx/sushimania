import { useEffect, useState } from 'react'

// useState que sobrevive a atualizar a página.
// localStorage: fica até ser limpo; sessionStorage: só enquanto a aba estiver aberta.
// try/catch: aba anônima ou armazenamento bloqueado não pode quebrar o site.
const obter = (armazenamento) => (armazenamento === 'sessao' ? window.sessionStorage : window.localStorage)

export function usePersistente(chave, padrao, armazenamento = 'local') {
  const [valor, setValor] = useState(() => {
    try {
      const salvo = obter(armazenamento).getItem(chave)
      return salvo === null ? padrao : JSON.parse(salvo)
    } catch {
      return padrao
    }
  })

  useEffect(() => {
    try {
      obter(armazenamento).setItem(chave, JSON.stringify(valor))
    } catch {
      // sem armazenamento: segue funcionando, só não guarda
    }
  }, [chave, valor, armazenamento])

  return [valor, setValor]
}
