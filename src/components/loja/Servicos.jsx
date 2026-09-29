const servicos = [
  { img: '/img/icone-pedido.svg', titulo: 'Fácil de pedir', texto: 'Você só precisa de alguns passos para pedir sua comida.' },
  { img: '/img/icone-delivery.svg', titulo: 'Entrega rápida', texto: 'Nossa entrega é sempre pontual, rápida e segura.' },
  { img: '/img/icone-qualidade.svg', titulo: 'Melhor qualidade', texto: 'Não só a rapidez na entrega, a qualidade também é o nosso forte.' },
]

export default function Servicos() {
  return (
    <section id="servicos" className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <span className="font-bold text-marca">Serviços</span>
          <h2 className="text-3xl font-extrabold">Como são nossos serviços?</h2>
        </div>

        <div className="grid gap-10 md:grid-cols-3">
          {servicos.map((s) => (
            <div key={s.titulo} className="text-center">
              <img src={s.img} alt="" className="mx-auto h-40" />
              <p className="mt-4 font-bold">{s.titulo}</p>
              <p className="text-gray-600">{s.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
