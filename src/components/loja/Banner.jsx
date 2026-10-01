import { FaClock, FaPhone, FaInstagram, FaFacebookF, FaWhatsapp } from 'react-icons/fa6'
import { useConfig } from '../../context/ConfigContext'
import { linkSeguro, linkWhatsapp, soNumeros } from '../../lib/config'
import { textoFechado } from '../../lib/horario'
import { useLojaAberta } from '../../lib/useLojaAberta'

export function RedesSociais({ className = 'bg-white shadow-sm' }) {
  const { config } = useConfig()
  const redes = [
    linkSeguro(config.instagram) && { href: linkSeguro(config.instagram), rotulo: 'Instagram', Icone: FaInstagram },
    linkSeguro(config.facebook) && { href: linkSeguro(config.facebook), rotulo: 'Facebook', Icone: FaFacebookF },
    config.whatsapp && { href: linkWhatsapp(config.whatsapp), rotulo: 'WhatsApp', Icone: FaWhatsapp },
  ].filter(Boolean)

  return (
    <div className="flex gap-3 text-lg">
      {redes.map(({ href, rotulo, Icone }) => (
        <a key={rotulo} href={href} target="_blank" rel="noreferrer" aria-label={rotulo} className={`rounded-full p-3 hover:text-marca ${className}`}>
          <Icone />
        </a>
      ))}
    </div>
  )
}

export default function Banner() {
  const { config } = useConfig()
  const { aberta, abreQuando } = useLojaAberta()

  return (
    <section className="container mx-auto grid min-h-[calc(100svh-4.5rem)] content-center items-center gap-10 px-4 py-10 md:min-h-0 md:grid-cols-2 md:py-20">
      <div>
        {!aberta && (
          <p className="mb-6 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-200">
            <FaClock className="shrink-0 text-amber-500" />
            {textoFechado(abreQuando)} Você já pode ver o cardápio.
          </p>
        )}
        <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
          {config.banner_titulo} {config.banner_destaque && <span className="text-marca">{config.banner_destaque}</span>}
        </h1>
        {config.banner_texto && <p className="mt-4 text-gray-600">{config.banner_texto}</p>}

        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#cardapio" className="rounded-full bg-marca px-6 py-3 font-semibold text-white hover:opacity-90">
            Ver cardápio
          </a>
          {config.telefone && (
            <a
              href={`tel:${soNumeros(config.telefone)}`}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 font-semibold"
            >
              <FaPhone className="text-marca" /> {config.telefone}
            </a>
          )}
        </div>

        <div className="mt-6">
          <RedesSociais />
        </div>
      </div>

      {/* No celular a foto some (igual ao Menu original) */}
      {config.destaque_url && (
        <div className="relative mx-auto hidden w-full max-w-md md:block">
          <div className="absolute inset-6 -z-10 rotate-6 rounded-[2.5rem] bg-marca/15" />
          <img src={config.destaque_url} alt="" className="aspect-square w-full rounded-[2.5rem] object-cover shadow-2xl" />
        </div>
      )}
    </section>
  )
}
