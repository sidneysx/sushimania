import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// divIcon em vez do ícone padrão: o PNG padrão do Leaflet se perde no build do Vite
const pino = L.divIcon({
  className: '',
  html: '<div style="font-size:32px;line-height:1;transform:translate(-50%,-100%)">📍</div>',
  iconSize: [0, 0],
})

// Mapa com o ponto da entrega. O cliente arrasta o pino (ou toca no mapa) para corrigir;
// aoMover recebe { lat, lng } quando o ponto muda.
export default function MapaLocalizacao({ lat, lng, aoMover }) {
  const divRef = useRef(null)
  const mapaRef = useRef(null)
  const marcadorRef = useRef(null)
  const aoMoverRef = useRef(aoMover)
  useEffect(() => {
    aoMoverRef.current = aoMover
  })

  useEffect(() => {
    const mapa = L.map(divRef.current, { scrollWheelZoom: false }).setView([lat, lng], 17)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapa)

    const marcador = L.marker([lat, lng], { draggable: true, icon: pino }).addTo(mapa)
    marcador.on('dragend', () => aoMoverRef.current(marcador.getLatLng()))
    mapa.on('click', (e) => {
      marcador.setLatLng(e.latlng)
      aoMoverRef.current(e.latlng)
    })

    mapaRef.current = mapa
    marcadorRef.current = marcador
    return () => mapa.remove()
  }, [])

  // novo "Usar minha localização" com o mapa já aberto: leva o pino e o mapa até lá
  useEffect(() => {
    const marcador = marcadorRef.current
    if (!marcador) return
    const atual = marcador.getLatLng()
    if (atual.lat.toFixed(6) === lat.toFixed(6) && atual.lng.toFixed(6) === lng.toFixed(6)) return
    marcador.setLatLng([lat, lng])
    mapaRef.current.setView([lat, lng])
  }, [lat, lng])

  return <div ref={divRef} className="relative z-0 h-56 w-full overflow-hidden rounded-lg ring-1 ring-gray-200" />
}
