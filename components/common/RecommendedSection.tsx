'use client';

export default function RecommendedSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-esperanza-700 via-esperanza-600 to-esperanza-800 text-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center">
          <h2 className="text-5xl font-serif font-bold mb-6 italic">Nuestros Recomendados</h2>

          <div className="space-y-6 mb-10">
            <p className="text-xl font-serif italic">
              Prueba una experiencia gastronómica sin límites
            </p>

            <div className="bg-white bg-opacity-10 backdrop-blur border border-white border-opacity-20 rounded-lg p-8 space-y-4">
              <p className="text-lg leading-relaxed font-body">
                🍽️ <span className="font-semibold">Prueba muchas cosas</span> — Nuestras tapas españolas están diseñadas para compartir. Tortillas, gambas al ajillo, rabas, jamón ibérico... Cada plato es una pequeña obra maestra que suma a la experiencia colectiva.
              </p>

              <p className="text-lg leading-relaxed font-body">
                ✦ <span className="font-semibold">Aprovecha el tamaño de tapa</span> — Pensadas en porciones perfectas, permite probar variedad sin comprometer calidad. La idea es disfrutar de la diversidad de la gastronomía española en Buenos Aires.
              </p>

              <p className="text-lg leading-relaxed font-body">
                ✈️ <span className="font-semibold">Déjate llevar por la experiencia</span> — Un verdadero viaje gastronómico a España desde Villa Crespo. Vinos de pequeñas bodegas argentinas, sidra española, cerveza tirada y la calidez de la cocina española en cada bocado.
              </p>
            </div>

            <p className="text-base text-opacity-90 italic">
              En La Esperanza, compartir es el corazón de la experiencia.
            </p>
          </div>

          <a href="/reservas" className="inline-block btn btn-lg bg-white text-esperanza-700 hover:bg-gray-100 font-semibold">
            📅 Reserva tu experiencia
          </a>
        </div>
      </div>
    </section>
  );
}
