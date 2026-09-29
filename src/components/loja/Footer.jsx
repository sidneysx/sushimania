import { useConfig } from '../../context/ConfigContext'
import { Logo } from './Header'
import { RedesSociais } from './Banner'

const ANO = new Date().getFullYear()

export default function Footer() {
  const { config } = useConfig()

  return (
    <footer className="bg-white py-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
        <Logo className="h-10" />
        <p className="text-sm text-gray-600">
          <b>{config.nome}</b> &copy; {ANO} Todos os direitos reservados
        </p>
        <RedesSociais className="bg-gray-100" />
      </div>
    </footer>
  )
}
