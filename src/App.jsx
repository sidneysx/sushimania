import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { ConfigProvider } from './context/ConfigContext'
import Loja from './pages/Loja'

// o painel só é baixado quando alguém acessa /admin
const AdminApp = lazy(() => import('./pages/admin/AdminApp'))

export default function App() {
  return (
    <ConfigProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<p className="p-8 text-center text-gray-500">Carregando...</p>}>
            <Routes>
              <Route path="/" element={<Loja />} />
              <Route path="/admin/*" element={<AdminApp />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ConfigProvider>
  )
}
