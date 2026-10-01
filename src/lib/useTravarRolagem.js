import { useEffect } from 'react'

// Trava a rolagem da página de trás enquanto um card/modal está aberto.
// Só "overflow: hidden" não basta no iPhone: o fundo continua rolando ao arrastar o dedo.
// Por isso o body vira position: fixed na posição atual e, ao fechar, volta para o mesmo ponto.
export function useTravarRolagem(ativo = true) {
  useEffect(() => {
    if (!ativo) return
    const y = window.scrollY
    const { style } = document.body
    const antes = { position: style.position, top: style.top, left: style.left, right: style.right, overflow: style.overflow }
    Object.assign(style, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', overflow: 'hidden' })

    return () => {
      Object.assign(style, antes)
      // instant: o html tem scroll-behavior smooth e a página "deslizaria" de volta
      window.scrollTo({ top: y, behavior: 'instant' })
    }
  }, [ativo])
}
