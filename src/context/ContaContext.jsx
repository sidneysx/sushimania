import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { listarEnderecos, obterCliente } from '../services/conta'

const ContaContext = createContext(null)

// Conta do cliente na loja (opcional). Separada do AuthContext do painel:
// aqui interessa quem é o cliente e os endereços dele, não se é admin.
//   usuario: sessão do Supabase (null = sem login)
//   cliente: linha da tabela clientes (null com login = falta completar nome/celular, ex.: Google)
export function ContaProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [enderecos, setEnderecos] = useState([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async (user) => {
    setUsuario(user ?? null)
    if (!user) {
      setCliente(null)
      setEnderecos([])
      setCarregando(false)
      return
    }
    try {
      const dados = await obterCliente(user.id)
      setCliente(dados)
      setEnderecos(dados ? await listarEnderecos() : [])
    } catch (e) {
      console.error('Conta não carregada:', e.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => carregar(data.session?.user))
    const { data } = supabase.auth.onAuthStateChange((evento, sessao) => {
      // renovação do token a cada hora não muda nada na conta
      if (evento === 'TOKEN_REFRESHED') return
      // evita chamar o Supabase dentro do callback (recomendação da lib)
      setTimeout(() => carregar(sessao?.user), 0)
    })
    return () => data.subscription.unsubscribe()
  }, [carregar])

  const recarregar = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    await carregar(data.session?.user)
  }, [carregar])

  return <ContaContext.Provider value={{ usuario, cliente, enderecos, carregando, recarregar }}>{children}</ContaContext.Provider>
}

export const useConta = () => useContext(ContaContext)
