import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import CartaPedidos, { type SeccionPedible } from '@/components/pedidos/CartaPedidos';
import CartBar from '@/components/pedidos/CartBar';
import prisma from '@/lib/db';
import { obtenerItemsInactivos, estaActivo } from '@/lib/menuDisponibilidad';
import { CATALOGO_PEDIDOS } from '@/lib/pedidosCarta';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pedí online para retirar · La Esperanza de los Ascurra',
  description: 'Pedí tu comida online y retirala en el local. Pagá con Mercado Pago.',
  alternates: { canonical: '/pedidos' },
};

const TITULOS: Record<string, string> = {
  tortillas: '★ Nuestras Tortillas',
  tapas_raciones: 'Tapas y Raciones',
  clasicos_mar: 'Nuestros Clásicos de Mar',
  arroces: 'Arroces del Mes',
  postres: 'Postres',
  hora_vermut: 'Hora del Vermut',
  de_grifo: 'De Grifo',
  vermut_cubatas: 'Vermut y Cubatas',
  sin_alcohol: 'Sin Alcohol',
  vinitos: 'Vinitos',
  espe_combos: 'Espe Combos',
};

export default async function PedidosPage() {
  const [settings, inactivos] = await Promise.all([
    prisma.settings.findFirst(),
    obtenerItemsInactivos(),
  ]);

  const aceptaPedidos = settings?.aceptaPedidosOnline ?? true;

  const secciones: SeccionPedible[] = Object.entries(CATALOGO_PEDIDOS).map(([slug, items]) => ({
    slug,
    titulo: TITULOS[slug] || slug,
    items: items.filter((it) => estaActivo(inactivos, slug, it.nombre)),
  }));

  return (
    <div className="min-h-screen bg-night text-sand font-body flex flex-col">
      <Header />

      <main className="flex-1 pt-32 pb-32 md:pt-40">
        <div className="mx-auto px-5 max-w-2xl">
          <div className="mb-10">
            <span className="font-mono text-[11px] tracking-widest uppercase text-brand-gold block mb-3">
              Pedí online
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-sand mb-3">Hacé tu Pedido</h1>
            <p className="text-sand-dim text-lg">Elegí tus platos, pagá online y retiralo en el local.</p>
          </div>

          {!aceptaPedidos ? (
            <div className="border border-white/10 rounded-sm p-8 text-center">
              <p className="text-sand text-lg font-semibold mb-2">No estamos tomando pedidos en este momento</p>
              <p className="text-sand-dim text-sm mb-6">
                Podés reservar una mesa o escribirnos por WhatsApp para consultar.
              </p>
              <Link
                href="/reservas"
                className="inline-flex items-center gap-2 font-semibold text-sm px-8 py-3.5 rounded-sm bg-sand text-night hover:bg-brand-amber transition-colors"
              >
                Reservá tu mesa →
              </Link>
            </div>
          ) : (
            <CartaPedidos secciones={secciones} />
          )}
        </div>
      </main>

      {aceptaPedidos && <CartBar />}
      <Footer />
    </div>
  );
}
