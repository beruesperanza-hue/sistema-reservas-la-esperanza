import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import DiscountBanner from '@/components/common/DiscountBanner';
import RecommendedSection from '@/components/common/RecommendedSection';
import ReviewsSection from '@/components/common/ReviewsSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <DiscountBanner />

      {/* Hero Section with Background Image */}
      <section className="relative h-[600px] bg-cover bg-center" style={{backgroundImage: 'url(/hero-platos.jpg)'}}>
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative h-full flex items-center justify-center">
          <div className="container mx-auto px-4 max-w-6xl text-center text-white">
            <div className="mb-8 animate-fade-in">
              <span className="text-7xl">✦</span>
            </div>

            <h1 className="text-7xl md:text-8xl font-serif font-bold mb-3 italic">La Esperanza</h1>
            <p className="text-3xl md:text-4xl font-serif mb-4 italic">De los Ascurra</p>
            <p className="italic text-xl md:text-2xl mb-10 font-serif">Desde 2011</p>

            <p className="text-lg md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed font-serif italic">
              La taberna de España en Buenos Aires ⭐
            </p>

            <div className="flex gap-6 justify-center flex-wrap">
              <Link href="/reservas" className="btn btn-primary px-10 py-4 text-xl md:text-2xl bg-accent-gold hover:bg-yellow-500 text-black font-bold shadow-2xl">
                📅 Hacé tu Reserva
              </Link>
            </div>
          </div>
        </div>
      </section>

      <RecommendedSection />

      <ReviewsSection />

      {/* Historia Section */}
      <section className="py-20 bg-esperanza-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold text-esperanza-700 mb-2">Nuestra Historia</h2>
          </div>

          <div className="bg-white p-10 rounded-lg border-l-4 border-esperanza-600">
            <div className="space-y-6 text-gray-700 font-body leading-relaxed text-lg">
              <p>
                <span className="text-2xl">📖</span> <span className="font-semibold">El Origen</span> — La Esperanza de los Ascurra nació en 2011 tras varios viajes a Madrid y una simple pregunta: <span className="italic">¿por qué no había una propuesta similar en Buenos Aires?</span>
              </p>

              <p>
                <span className="text-2xl">🌟</span> <span className="font-semibold">Pioneros</span> — Aunque hoy muchos restaurantes ofrecen platitos compartidos, sabemos que <span className="italic">fuimos pioneros en la idea de compartir distintos platos</span>. Una propuesta que revolucionó la forma de disfrutar la gastronomía en Buenos Aires.
              </p>

              <p>
                <span className="text-2xl">🗺️</span> <span className="font-semibold">Nuestro Viaje</span> — Nuestra historia ha recorrido varios barrios de Buenos Aires y ciudades de España. <span className="italic">Hoy, volvemos a nuestros orígenes en Villa Crespo</span>, reafirmando nuestra identidad de cocina española auténtica.
              </p>

              <p className="text-base text-esperanza-700 italic pt-4 border-t border-esperanza-200">
                Los invitamos a disfrutar de un viaje gastronómico a España con nosotros. Cada plato, cada momento, cuenta nuestra pasión por la buena mesa y la compañía.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-esperanza-600 to-esperanza-700 py-20">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <h2 className="text-4xl font-serif font-bold text-white mb-4">¿Listo para tu próxima experiencia?</h2>
          <p className="text-esperanza-100 mb-8 text-lg font-body">
            Reserva tu mesa ahora y disfruta de un momento especial en La Esperanza.
          </p>
          <Link href="/reservas" className="btn btn-lg bg-white text-esperanza-700 hover:bg-esperanza-50 font-semibold">
            📅 Hacé tu reserva
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
