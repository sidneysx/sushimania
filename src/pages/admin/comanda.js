import { mascaraTelefone } from '../../services/conta'
import { dinheiro, formatarData } from './ui'

// Mensagem para o motoboy: o essencial da entrega (sem número fixo, o WhatsApp pede o contato)
export function linkMotoboy(p) {
  const linhas = [
    `🛵 *Entrega #${p.codigo}*`,
    '',
    `*Cliente:* ${p.cliente_nome}`,
    p.cliente_telefone ? `*Celular:* ${mascaraTelefone(p.cliente_telefone)}` : null,
    `*Bairro:* ${p.bairro}`,
    `*Endereço:* ${p.endereco}`,
    p.localizacao ? `*Mapa:* https://www.google.com/maps?q=${p.localizacao}` : null,
    '',
    '*Pedido:*',
    ...p.itens.flatMap((i) => [`${i.qtd}x ${i.nome}`, ...(i.obs ? [`   _Obs.: ${i.obs}_`] : [])]),
    '',
    `*Pagamento:* ${p.pagamento}`,
    p.troco ? `*Troco para:* ${p.troco}` : null,
    `*Cobrar:* ${dinheiro.format(p.total)}${p.taxa_entrega === null ? ' + entrega (a combinar)' : ''}`,
  ]
  const texto = linhas.filter((l) => l !== null).join('\n')
  return `https://wa.me/?text=${encodeURIComponent(texto)}`
}

const esc = (t = '') => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// Comanda em 80mm para impressora térmica. Imprime por um iframe escondido (não abre pop-up).
// Na janela de impressão, escolha a impressora térmica, margens "Nenhuma" e desmarque cabeçalhos.
export function imprimirComanda(p, nomeLoja) {
  const itens = p.itens
    .map(
      (i) => `
      <tr><td>${i.qtd}x ${esc(i.nome)}</td><td class="d">${dinheiro.format(i.preco * i.qtd)}</td></tr>
      ${i.obs ? `<tr><td colspan="2" class="obs">Obs.: ${esc(i.obs)}</td></tr>` : ''}`,
    )
    .join('')

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>#${esc(p.codigo)}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body { width: 72mm; margin: 0 auto; padding: 3mm 0; font: 12px/1.35 'Courier New', monospace; color: #000; }
  h1 { font-size: 16px; text-align: center; margin: 0; }
  .c { text-align: center; }
  .cod { font-size: 20px; font-weight: bold; text-align: center; margin: 2mm 0; }
  hr { border: 0; border-top: 1px dashed #000; margin: 2mm 0; }
  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; padding: 0.5mm 0; }
  .d { text-align: right; white-space: nowrap; padding-left: 2mm; }
  .obs { font-style: italic; padding-left: 3mm; }
  .tot td { font-weight: bold; font-size: 14px; }
  p { margin: 0.5mm 0; }
</style></head><body>
  <h1>${esc(nomeLoja)}</h1>
  <p class="c">${esc(formatarData(p.criado_em))}</p>
  <div class="cod">PEDIDO #${esc(p.codigo)}</div>
  <hr>
  <p><b>Cliente:</b> ${esc(p.cliente_nome)}</p>
  ${p.cliente_telefone ? `<p><b>Celular:</b> ${esc(mascaraTelefone(p.cliente_telefone))}</p>` : ''}
  <p><b>Bairro:</b> ${esc(p.bairro)}</p>
  <p><b>Endereço:</b> ${esc(p.endereco)}</p>
  ${p.cep ? `<p><b>CEP:</b> ${esc(p.cep)}</p>` : ''}
  <hr>
  <table>${itens}</table>
  <hr>
  <table>
    <tr><td>Subtotal</td><td class="d">${dinheiro.format(p.subtotal)}</td></tr>
    <tr><td>Entrega</td><td class="d">${p.taxa_entrega === null ? 'a combinar' : dinheiro.format(p.taxa_entrega)}</td></tr>
    <tr class="tot"><td>TOTAL</td><td class="d">${dinheiro.format(p.total)}</td></tr>
  </table>
  <hr>
  <p><b>Pagamento:</b> ${esc(p.pagamento)}</p>
  ${p.troco ? `<p><b>Troco para:</b> ${esc(p.troco)}</p>` : ''}
  <hr>
  <p class="c">Obrigado pela preferência!</p>
</body></html>`

  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(frame)
  const doc = frame.contentWindow.document
  doc.open()
  doc.write(html)
  doc.close()
  frame.contentWindow.onafterprint = () => frame.remove()
  setTimeout(() => {
    frame.contentWindow.focus()
    frame.contentWindow.print()
    // garantia caso o navegador não dispare afterprint
    setTimeout(() => frame.remove(), 60000)
  }, 100)
}
