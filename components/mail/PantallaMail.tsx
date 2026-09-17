import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

/** Marco compartido de las páginas a las que se llega desde un mail (baja y suscripción). */
export default function PantallaMail({
  icono,
  titulo,
  children,
}: {
  icono: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-night text-sand font-body flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-20 md:pt-40">
        <div className="mx-auto px-5 max-w-lg">
          <div className="border border-white/10 rounded-sm p-8 md:p-10 text-center bg-night-2">
            <p className="text-4xl mb-4" aria-hidden="true">
              {icono}
            </p>
            <h1 className="font-display font-bold text-2xl text-sand mb-3">{titulo}</h1>
            <div className="text-sand-dim text-[15px] leading-relaxed space-y-4">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function BotonMail({ children, secundario = false }: { children: React.ReactNode; secundario?: boolean }) {
  return (
    <button
      type="submit"
      className={`w-full inline-flex items-center justify-center font-semibold text-sm px-8 py-4 rounded-sm transition-colors ${
        secundario ? 'border border-white/20 text-sand hover:bg-white/5' : 'bg-sand text-night hover:bg-brand-amber'
      }`}
    >
      {children}
    </button>
  );
}

export function VolverAlSitio() {
  return (
    <Link href="/" className="inline-block text-sm text-sand-faint underline hover:text-sand">
      Ir a La Esperanza
    </Link>
  );
}
