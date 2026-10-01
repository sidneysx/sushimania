import { FaInstagram, FaFacebookF, FaWhatsapp } from 'react-icons/fa6'
import { useConfig } from '../../context/ConfigContext'
import { linkSeguro, linkWhatsapp } from '../../lib/config'

const ANO = new Date().getFullYear()

// className: aparência de cada botão (fundo, tamanho)
export function RedesSociais({ className = 'bg-white p-3 text-lg shadow-sm' }) {
  const { config } = useConfig()
  const redes = [
    linkSeguro(config.instagram) && { href: linkSeguro(config.instagram), rotulo: 'Instagram', Icone: FaInstagram },
    linkSeguro(config.facebook) && { href: linkSeguro(config.facebook), rotulo: 'Facebook', Icone: FaFacebookF },
    config.whatsapp && { href: linkWhatsapp(config.whatsapp), rotulo: 'WhatsApp', Icone: FaWhatsapp },
  ].filter(Boolean)

  return (
    <div className="flex gap-2">
      {redes.map(({ href, rotulo, Icone }) => (
        <a key={rotulo} href={href} target="_blank" rel="noreferrer" aria-label={rotulo} className={`rounded-full hover:text-marca ${className}`}>
          <Icone />
        </a>
      ))}
    </div>
  )
}

export default function Footer() {
  const { config } = useConfig()

  return (
    <footer className="bg-white py-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
        {config.logo_url ? (
          <img src={config.logo_url} alt={config.nome} className="h-10 w-auto object-contain" />
        ) : (
          <span className="text-2xl font-extrabold text-marca">{config.nome}</span>
        )}
        <p className="text-sm text-gray-600">
          <b>{config.nome}</b> &copy; {ANO} Todos os direitos reservados
        </p>
        <RedesSociais className="bg-gray-100 p-3 text-lg" />
      </div>
    </footer>
  )
}
