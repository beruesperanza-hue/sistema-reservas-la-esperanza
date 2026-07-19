import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ReservationForm from '@/components/reservas/ReservationForm';

export const metadata = {
  title: 'Reserva tu Mesa | La Esperanza de los Ascurra | Tapas Españolas Buenos Aires',
  description: 'Reserva tu mesa online en La Esperanza. Auténticas tapas españolas en Villa Crespo. Disponibilidad en tiempo real, hasta 60 días de anticipación.',
  keywords: 'reservar restaurante, reserva online, La Esperanza, tapas españolas, restaurant Villa Crespo',
};

export default function ReservasPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-esperanza-700 mb-3 italic">Hacé tu Reserva</h1>
            <p className="text-gray-600 text-lg">
              Completa el formulario para reservar tu mesa en La Esperanza. Te enviaremos un email de confirmación.
            </p>
          </div>

          <div className="card shadow-lg">
            <ReservationForm />
          </div>

          {/* Info */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">💡 Tip</h3>
              <p className="text-blue-800 text-sm">
                Asegúrate de proporcionar un email y teléfono válido para poder confirmar tu reserva.
              </p>
            </div>

            <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
              <h3 className="font-bold text-amber-900 mb-2">⏰ Importante</h3>
              <p className="text-amber-800 text-sm">
                Puedes reservar con hasta 60 días de anticipación. Por favor, cancela con tiempo si no puedas asistir.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
