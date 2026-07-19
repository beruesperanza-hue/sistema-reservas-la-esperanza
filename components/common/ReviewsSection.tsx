'use client';

export default function ReviewsSection() {
  const reviews = [
    {
      name: 'Alejandro Kogan',
      date: '09/07/2026',
      rating: 5,
      text: 'Todo estuvo realmente bien. Comida excelente, ambiente perfecto.',
      categories: { comida: 5, ambiente: 4, servicio: 4 }
    },
    {
      name: 'Abel Quintero',
      date: '28/06/2026',
      rating: 5,
      text: 'Muy rica la comida. Se componía de 4 platos. Los serviría en 2 etapas. Perfecto para disfrutar.',
      categories: { comida: 5, ambiente: 5, servicio: 5 }
    },
    {
      name: 'Diego Platero',
      date: '26/06/2026',
      rating: 5,
      text: 'Muy buenos todos los fritos que comimos. Calidad garantizada.',
      categories: { comida: 5, ambiente: 5, servicio: 5 }
    }
  ];

  const renderStars = (rating: number) => {
    return Array(rating).fill('⭐').join('');
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold text-esperanza-700 mb-2">Lo que dicen nuestros clientes</h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-3xl">⭐⭐⭐⭐⭐</span>
            <span className="text-2xl font-bold text-esperanza-700">4.4</span>
            <span className="text-gray-600">(125 reseñas)</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <div key={i} className="bg-gradient-to-br from-esperanza-50 to-white border border-esperanza-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{review.name}</p>
                  <p className="text-xs text-gray-500">{review.date}</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-lg">{renderStars(review.rating)}</p>
              </div>

              <p className="text-gray-700 text-sm mb-4 leading-relaxed">"{review.text}"</p>

              <div className="flex gap-4 text-xs text-center">
                <div>
                  <p className="text-esperanza-600 font-semibold">{review.categories.comida}★</p>
                  <p className="text-gray-600">Comida</p>
                </div>
                <div>
                  <p className="text-esperanza-600 font-semibold">{review.categories.ambiente}★</p>
                  <p className="text-gray-600">Ambiente</p>
                </div>
                <div>
                  <p className="text-esperanza-600 font-semibold">{review.categories.servicio}★</p>
                  <p className="text-gray-600">Servicio</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href="/reservas" className="btn btn-primary btn-lg">
            📅 Hacé tu reserva ahora
          </a>
        </div>
      </div>
    </section>
  );
}
