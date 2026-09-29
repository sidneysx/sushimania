import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CONFIG_PADRAO, obterConfig } from '../services/config'

const ConfigContext = createContext(null)

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(CONFIG_PADRAO)
  const [carregada, setCarregada] = useState(false)

  const recarregar = useCallback(async () => {
    try {
      const dados = await obterConfig()
      if (dados) {
        // campos vazios no banco caem no padrão (ex.: WhatsApp do .env)
        const preenchidos = Object.fromEntries(Object.entries(dados).filter(([, v]) => v !== null && v !== ''))
        setConfig({ ...CONFIG_PADRAO, ...preenchidos })
      }
    } catch (e) {
      console.error('Config não carregada:', e.message)
    } finally {
      setCarregada(true)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  useEffect(() => {
    document.documentElement.style.setProperty('--cor-marca', config.cor)
  }, [config.cor])

  return <ConfigContext.Provider value={{ config, carregada, recarregar }}>{children}</ConfigContext.Provider>
}

export const useConfig = () => useContext(ConfigContext)
