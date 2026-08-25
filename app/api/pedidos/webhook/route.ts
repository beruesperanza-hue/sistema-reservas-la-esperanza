import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { consultarPago, validarFirmaWebhook } from '@/lib/mercadopago';
import { sendOrderConfirmation } from '@/lib/email';
import { sumarMinutosAHoraActualEnBA } from '@/lib/fechas';

/**
 * Webhook de Mercado Pago (Checkout Pro). Nunca se confía en el payload
 * entrante: se valida la firma x-signature y, además, se vuelve a consultar
 * el estado real del pago a la API de MP antes de tocar la base. El estado
 * del pedido solo avanza desde "pendiente_pago" acá — si el admin ya lo pasó
 * a en_preparacion/listo/entregado, una notificación tardía o duplicada de MP
 * nunca lo hace retroceder.
 */
export async function POST(request: NextRequest) {
  let body: { data?: { id?: string }; type?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const url = new URL(request.url);
  const dataId = body?.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id');
  const type = body?.type || url.searchParams.get('type') || url.searchParams.get('topic');

  if (!dataId || type !== 'payment') {
    return NextResponse.json({ received: true });
  }

  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');
  if (!validarFirmaWebhook(xSignature, xRequestId, String(dataId))) {
    console.error('Webhook de Mercado Pago con firma inválida, ignorado');
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  try {
    const payment = await consultarPago(String(dataId));
    const orderId = payment.external_reference;
    if (!orderId) return NextResponse.json({ received: true });

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) {
      console.error('Webhook de MP: pedido no encontrado', orderId);
      return NextResponse.json({ received: true });
    }

    const seApruebaAhora = payment.status === 'approved' && order.estado === 'pendiente_pago';
    const seRechazaAhora = payment.status === 'rejected' && order.estado === 'pendiente_pago';
    const nuevoEstado = seApruebaAhora ? 'pagado' : seRechazaAhora ? 'cancelado' : order.estado;

    let horaListoEstimada = order.horaListoEstimada;
    if (seApruebaAhora) {
      const settings = await prisma.settings.findFirst();
      horaListoEstimada = sumarMinutosAHoraActualEnBA(settings?.tiempoPreparacionMin ?? 25);
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        estado: nuevoEstado,
        mpPaymentId: String(dataId),
        mpStatus: payment.status || null,
        horaListoEstimada,
      },
    });

    if (seApruebaAhora) {
      await sendOrderConfirmation(
        order.email,
        order.nombre,
        order.numero,
        order.items.map((it) => ({ nombre: it.nombre, cantidad: it.cantidad, precioUnitario: it.precioUnitario })),
        order.subtotal,
        horaListoEstimada
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook de Mercado Pago:', error);
    // 200 igual: si el error es nuestro, reintentar no ayuda y evita que MP
    // bombardee de reintentos por un bug transitorio.
    return NextResponse.json({ received: true });
  }
}
