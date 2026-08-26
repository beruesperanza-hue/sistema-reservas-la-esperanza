import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import prisma from '@/lib/db';
import { formatearPrecio } from '@/lib/carta';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tu pedido · La Esperanza de los Ascurra',
  robots: 'noindex, nofollow',
};

const ESTADO_INFO: Record<string, { titulo: string; detalle: string; icono: string; tono: string }> = {
  pendiente_pago: {
    titulo: 'Estamos confirmando tu pago',
    detalle: 'Esto puede tardar unos segundos. Actualizá esta página en un momento.',
    icono: '⏳',
    tono: 'border-white/10',
  },
  pagado: {
    titulo: '¡Pago confirmado!',
    detalle: 'Ya estamos preparando tu pedido. Te enviamos un email con los detalles.',
    icono: '✅',
    tono: 'border-green-500/30 bg-green-500/10',
  },
  en_preparacion: {
    titulo: 'Estamos preparando tu pedido',
    detalle: 'Te va a estar esperando pronto en el local.',
    icono: '👨‍🍳',
    tono: 'border-green-500/30 bg-green-500/10',
  },
  listo_para_retirar: {
    titulo: '¡Tu pedido está listo!',
    detalle: 'Ya podés pasar a retirarlo por el local.',
    icono: '🎉',
    tono: 'border-brand-gold/30 bg-brand-gold/10',
  },
  entregado: {
    titulo: 'Pedido entregado',
    detalle: '¡Gracias por elegirnos!',
    icono: '🙌',
    tono: 'border-white/10',
  },
  cancelado: {
    titulo: 'El pago no se completó',
    detalle: 'Tu pedido fue cancelado. Si creés que es un error, escribinos por WhatsApp.',
    icono: '⚠️',
    tono: 'border-red-500/30 bg-red-500/10',
  },
};

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  const order = orderId ? await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } }) : null;

  const info = order ? ESTADO_INFO[order.estado] || ESTADO_INFO.pendiente_pago : null;

  return (
    <div className="min-h-screen bg-night text-sand font-body flex flex-col">
      <Header />

      <main className="flex-1 pt-32 pb-20 md:pt-40">
        <div className="mx-auto px-5 max-w-2xl">
          {!order ? (
            <div className="border border-white/10 rounded-sm p-8 text-center">
              <p className="text-sand-dim mb-6">No encontramos ese pedido.</p>
              <Link href="/pedidos" className="inline-flex items-center gap-2 font-semibold text-sm px-8 py-3.5 rounded-sm bg-sand text-night hover:bg-brand-amber transition-colors">
                Volver a pedidos →
              </Link>
            </div>
          ) : (
            <>
              <div className={`border rounded-sm p-8 text-center mb-8 ${info!.tono}`}>
                <p className="text-4xl mb-3">{info!.icono}</p>
                <h1 className="font-display font-bold text-2xl text-sand mb-2">{info!.titulo}</h1>
                <p className="text-sand-dim text-sm">{info!.detalle}</p>
                {order.horaListoEstimada && order.estado !== 'cancelado' && (
                  <p className="text-sand text-sm mt-3">
                    Estimado para retirar: <strong>{order.horaListoEstimada}</strong>
                  </p>
                )}
              </div>

              <div className="border border-white/10 rounded-sm p-6 bg-night-2">
                <p className="text-xs font-mono uppercase tracking-wide text-sand-dim mb-4">Pedido #{order.numero}</p>
                {order.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0 text-sm">
                    <span className="text-sand-dim">{it.cantidad}× {it.nombre}</span>
                    <span className="font-mono text-sand">{formatearPrecio(it.precioUnitario * it.cantidad)}</span>
                  </div>
                ))}
                {order.costoEnvio > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-white/10 last:border-0 text-sm">
                    <span className="text-sand-dim">Envío a domicilio</span>
                    <span className="font-mono text-sand">{formatearPrecio(order.costoEnvio)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-4 mt-2">
                  <span className="font-semibold text-sand">Total</span>
                  <span className="font-mono text-lg text-sand font-semibold">{formatearPrecio(order.subtotal + order.costoEnvio)}</span>
                </div>
                {order.tipoEntrega !== 'retiro' && (
                  <p className="text-xs text-sand-faint mt-3">
                    Envío a: {order.direccionEnvio}{order.pisoEnvio ? `, piso/depto ${order.pisoEnvio}` : ''}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
