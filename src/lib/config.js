export const ITENS_POR_PAGINA = 8

// "(99) 98123-4567" -> "5599981234567"
export const soNumeros = (texto = '') => texto.replace(/\D/g, '')
// Só aceita links http(s): bloqueia "javascript:..." e afins em links vindos do banco
export const linkSeguro = (url = '') => (/^https?:\/\//i.test(url.trim()) ? url.trim() : null)

export const linkWhatsapp = (numero, texto) =>
  `https://wa.me/${soNumeros(numero)}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`
