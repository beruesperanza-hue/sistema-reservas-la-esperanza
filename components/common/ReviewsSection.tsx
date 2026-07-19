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
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-esperanza-700 mb-2">Lo que dicen nuestros clientes</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-2xl">⭐⭐⭐⭐</span>
            <span className="text-lg font-bold text-esperanza-700">4.0</span>
            <span className="text-sm text-gray-600">(207 opiniones en Google)</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {reviews.map((review, i) => (
            <div key={i} className="bg-esperanza-50 border border-esperanza-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="mb-2">
                <p className="font-semibold text-sm text-gray-900">{review.name}</p>
                <p className="text-xs text-gray-500">{review.date}</p>
              </div>

              <div className="mb-2">
                <p className="text-sm">{renderStars(review.rating)}</p>
              </div>

              <p className="text-gray-700 text-xs mb-3 leading-relaxed">"{review.text}"</p>

              <div className="flex gap-3 text-xs text-center">
                <div className="flex-1">
                  <p className="text-esperanza-600 font-semibold">{review.categories.comida}★</p>
                  <p className="text-gray-600 text-xs">Comida</p>
                </div>
                <div className="flex-1">
                  <p className="text-esperanza-600 font-semibold">{review.categories.ambiente}★</p>
                  <p className="text-gray-600 text-xs">Ambiente</p>
                </div>
                <div className="flex-1">
                  <p className="text-esperanza-600 font-semibold">{review.categories.servicio}★</p>
                  <p className="text-gray-600 text-xs">Servicio</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
