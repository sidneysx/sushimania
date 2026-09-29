import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const verificar = async (novaSessao) => {
      setSessao(novaSessao)
      if (novaSessao) {
        const { data } = await supabase.rpc('is_admin')
        setIsAdmin(data === true)
      } else {
        setIsAdmin(false)
      }
      setCarregando(false)
    }

    supabase.auth.getSession().then(({ data }) => verificar(data.session))

    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      // evita chamar o Supabase dentro do callback (recomendação da lib)
      setTimeout(() => verificar(novaSessao), 0)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  const entrar = (email, senha) => supabase.auth.signInWithPassword({ email, password: senha })
  const sair = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ sessao, isAdmin, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
