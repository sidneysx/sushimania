import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { ConfigProvider } from './context/ConfigContext'
import { ContaProvider } from './context/ContaContext'
import Loja from './pages/Loja'

// o painel só é baixado quando alguém acessa /admin
const AdminApp = lazy(() => import('./pages/admin/AdminApp'))
const Conta = lazy(() => import('./pages/Conta'))
const Privacidade = lazy(() => import('./pages/Privacidade'))

export default function App() {
  return (
    <ConfigProvider>
      <ToastProvider>
        <ContaProvider>
          <BrowserRouter>
            <Suspense fallback={<p className="p-8 text-center text-gray-500">Carregando...</p>}>
              <Routes>
                <Route path="/" element={<Loja />} />
                <Route path="/conta" element={<Conta />} />
                <Route path="/privacidade" element={<Privacidade />} />
                <Route path="/admin/*" element={<AdminApp />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ContaProvider>
      </ToastProvider>
    </ConfigProvider>
  )
}
