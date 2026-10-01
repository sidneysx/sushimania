import { useEffect } from 'react'
import { CarrinhoProvider } from '../context/CarrinhoContext'
import { useConfig } from '../context/ConfigContext'
import TopoLoja from '../components/loja/TopoLoja'
import Cardapio from '../components/loja/Cardapio'
import Footer from '../components/loja/Footer'
import BarraInferior from '../components/loja/BarraInferior'
import ModalCarrinho from '../components/carrinho/ModalCarrinho'

export default function Loja() {
  const { config } = useConfig()

  useEffect(() => {
    document.title = `${config.nome} - Delivery`
  }, [config.nome])

  return (
    <CarrinhoProvider>
      <TopoLoja />
      <main>
        <Cardapio />
      </main>
      <Footer />
      <BarraInferior />
      <ModalCarrinho />
    </CarrinhoProvider>
  )
}
