// Índice = dia da semana do JavaScript (0 = domingo ... 6 = sábado)
export const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

// Terça a domingo, 18:30 às 23:00 (segunda fechado)
export const HORARIOS_PADRAO = DIAS.map((_, dia) => ({ aberto: dia !== 1, abre: '18:30', fecha: '23:00' }))

// Horário da loja (Imperatriz-MA), não o do aparelho: um cliente com o celular
// em outro fuso não pode ver a loja aberta/fechada na hora errada.
const FUSO = 'America/Fortaleza'
const SEMANA = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

function agoraNaLoja(agora = new Date()) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: FUSO, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(agora)
      .map((p) => [p.type, p.value]),
  )
  return { dia: SEMANA[partes.weekday], minutos: Number(partes.hour) * 60 + Number(partes.minute) }
}

const emMinutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// fecha <= abre: passa da meia-noite (ex.: 18:00 às 02:00)
const viraNoite = (h) => emMinutos(h.fecha) <= emMinutos(h.abre)

function estaAberta(horarios, { dia, minutos }) {
  const hoje = horarios[dia]
  if (hoje?.aberto) {
    const abre = emMinutos(hoje.abre)
    // fecha incluído: "00:00 às 23:59" fica aberto o dia inteiro
    if (viraNoite(hoje) ? minutos >= abre : minutos >= abre && minutos <= emMinutos(hoje.fecha)) return true
  }
  // resto do expediente de ontem que passou da meia-noite
  const ontem = horarios[(dia + 6) % 7]
  return !!ontem?.aberto && viraNoite(ontem) && minutos < emMinutos(ontem.fecha)
}

// "hoje às 18:30", "amanhã às 18:30", "terça às 18:30" ou null se não abre nenhum dia
function proximaAbertura(horarios, { dia, minutos }) {
  for (let d = 0; d <= 7; d++) {
    const h = horarios[(dia + d) % 7]
    if (!h?.aberto || (d === 0 && emMinutos(h.abre) <= minutos)) continue
    const quando = d === 0 ? 'hoje' : d === 1 ? 'amanhã' : DIAS[(dia + d) % 7].toLowerCase()
    return `${quando} às ${h.abre}`
  }
  return null
}

// horarios inválido (coluna vazia ou formato errado no banco) cai no padrão
const valido = (horarios) => Array.isArray(horarios) && horarios.length === 7

export function situacaoDaLoja(horarios, agora) {
  if (!valido(horarios)) horarios = HORARIOS_PADRAO
  const momento = agoraNaLoja(agora)
  const aberta = estaAberta(horarios, momento)
  return { aberta, abreQuando: aberta ? null : proximaAbertura(horarios, momento) }
}

export const textoFechado = (abreQuando) =>
  abreQuando ? `Estamos fechados agora. Abrimos ${abreQuando}.` : 'Estamos fechados no momento.'
