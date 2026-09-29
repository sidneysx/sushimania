import { FaMapLocationDot, FaImage, FaWallet } from 'react-icons/fa6'
import { useCarrinho } from '../../context/CarrinhoContext'
import { formatarPreco } from '../../lib/formatar'

export default function EtapaResumo({ endereco }) {
  const { itens } = useCarrinho()

  return (
    <div>
      <p className="mb-3 font-bold">Itens do pedido:</p>
      <div className="flex flex-col gap-2">
        {itens.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
              {item.imagem_url ? (
                <img src={item.imagem_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <FaImage className="text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold">{item.nome}</p>
              <p className="text-sm text-marca">{formatarPreco(item.preco)}</p>
            </div>
            <p>
              x <b>{item.qntd}</b>
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 mb-3 font-bold">Local da entrega:</p>
      <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
        <FaMapLocationDot className="text-3xl text-marca" />
        <div>
          <p className="font-bold">
            {endereco.endereco}, {endereco.numero}, {endereco.bairro}
          </p>
          <p className="text-sm text-gray-600">
            {endereco.cidade}-{endereco.uf} / {endereco.cep} {endereco.complemento}
          </p>
        </div>
      </div>

      <p className="mt-6 mb-3 font-bold">Pagamento:</p>
      <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
        <FaWallet className="text-3xl text-marca" />
        <div>
          <p className="font-bold">{endereco.pagamento}</p>
          <p className="text-sm text-gray-600">
            Pedido em nome de {endereco.nome}
            {endereco.pagamento === 'Dinheiro' && endereco.troco && ` · troco para ${endereco.troco}`}
          </p>
        </div>
      </div>
    </div>
  )
}
