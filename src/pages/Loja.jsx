import { useEffect } from 'react'
import { CarrinhoProvider } from '../context/CarrinhoContext'
import { useConfig } from '../context/ConfigContext'
import Header from '../components/loja/Header'
import Banner from '../components/loja/Banner'
import Cardapio from '../components/loja/Cardapio'
import Servicos from '../components/loja/Servicos'
import Footer from '../components/loja/Footer'
import BotaoCarrinho from '../components/loja/BotaoCarrinho'
import ModalCarrinho from '../components/carrinho/ModalCarrinho'

export default function Loja() {
  const { config } = useConfig()

  useEffect(() => {
    document.title = `${config.nome} - Delivery`
  }, [config.nome])

  return (
    <CarrinhoProvider>
      <Header />
      <main>
        <Banner />
        <Cardapio />
        <Servicos />
      </main>
      <Footer />
      <BotaoCarrinho />
      <ModalCarrinho />
    </CarrinhoProvider>
  )
}
