import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [mensagens, setMensagens] = useState([])

  const mostrar = useCallback((texto, tipo = 'erro', tempo = 3500) => {
    const id = crypto.randomUUID()
    setMensagens((atuais) => [...atuais, { id, texto, tipo }])
    setTimeout(() => {
      setMensagens((atuais) => atuais.filter((m) => m.id !== id))
    }, tempo)
  }, [])

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {mensagens.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
              m.tipo === 'sucesso' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {m.texto}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
