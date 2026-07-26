import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ReservationForm from '@/components/reservas/ReservationForm';

export const metadata = {
  title: 'Reservar mesa · La Esperanza de los Ascurra · Villa Crespo',
  description: 'Reservá tu mesa online en La Esperanza. Auténticas tapas españolas en Villa Crespo. Disponibilidad en tiempo real, hasta 60 días de anticipación.',
  keywords: 'reservar restaurante, reserva online, La Esperanza, tapas españolas, restaurant Villa Crespo',
  alternates: { canonical: '/reservas' },
};

export default function ReservasPage() {
  return (
    <div className="min-h-screen bg-night text-sand font-body flex flex-col">
      <Header />

      <main className="flex-1 pt-32 pb-20 md:pt-40">
        <div className="mx-auto px-5 max-w-2xl">
          <div className="mb-8">
            <span className="font-mono text-[11px] tracking-widest uppercase text-brand-gold block mb-3">Reservá tu mesa</span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-sand mb-3">Hacé tu Reserva</h1>
            <p className="text-sand-dim text-lg">
              Completá el formulario para reservar tu mesa en La Esperanza. Te enviaremos un email de confirmación.
            </p>
          </div>

          <div className="border border-white/10 rounded-sm p-6 md:p-8 bg-night-2">
            <ReservationForm />
          </div>

          {/* Info */}
          <div className="mt-10 grid md:grid-cols-2 gap-5">
            <div className="border border-white/10 rounded-sm p-5">
              <h3 className="font-display font-semibold text-sand mb-2">💡 Tip</h3>
              <p className="text-sand-dim text-sm">
                Asegurate de proporcionar un email y teléfono válido para poder confirmar tu reserva.
              </p>
            </div>

            <div className="border border-brand-gold/25 bg-brand-gold/[.05] rounded-sm p-5">
              <h3 className="font-display font-semibold text-sand mb-2">⏰ Importante</h3>
              <p className="text-sand-dim text-sm">
                Podés reservar con hasta 60 días de anticipación. Por favor, cancelá con tiempo si no podés asistir.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
