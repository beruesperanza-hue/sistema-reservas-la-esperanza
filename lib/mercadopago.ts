import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { createHmac, timingSafeEqual } from 'crypto';
import { SITE_URL } from '@/lib/site';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

interface ItemParaPreferencia {
  nombre: string;
  precioUnitario: number;
  cantidad: number;
}

/**
 * Crea la preferencia de pago (Checkout Pro) para un pedido ya guardado en la
 * base. Devuelve el init_point al que se redirige al cliente para pagar con
 * el monto final ya calculado.
 */
export async function crearPreferencia(orderId: string, items: ItemParaPreferencia[]) {
  const preference = new Preference(client);

  const result = await preference.create({
    body: {
      items: items.map((it) => ({
        id: it.nombre,
        title: it.nombre,
        unit_price: it.precioUnitario,
        quantity: it.cantidad,
        currency_id: 'ARS',
      })),
      external_reference: orderId,
      back_urls: {
        success: `${SITE_URL}/pedidos/confirmacion?order=${orderId}`,
        pending: `${SITE_URL}/pedidos/confirmacion?order=${orderId}`,
        failure: `${SITE_URL}/pedidos/confirmacion?order=${orderId}`,
      },
      auto_return: 'approved',
      notification_url: `${SITE_URL}/api/pedidos/webhook`,
    },
  });

  return { preferenceId: result.id, initPoint: result.init_point };
}

/** Consulta el estado real de un pago directo a la API de MP — nunca se confía en el payload del webhook. */
export async function consultarPago(paymentId: string) {
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}

/**
 * Valida la firma x-signature que manda Mercado Pago en cada notificación de
 * webhook, siguiendo su esquema documentado (HMAC-SHA256 sobre
 * "id:<dataId>;request-id:<xRequestId>;ts:<ts>;"). Si no hay
 * MERCADOPAGO_WEBHOOK_SECRET configurado, rechaza — nunca se procesa un
 * webhook sin poder verificar quién lo mandó.
 */
export function validarFirmaWebhook(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !xSignature) return false;

  const partes = Object.fromEntries(
    xSignature.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k?.trim(), v?.trim()];
    })
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};${xRequestId ? `request-id:${xRequestId};` : ''}ts:${ts};`;
  const esperado = createHmac('sha256', secret).update(manifest).digest('hex');

  const a = Buffer.from(v1);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}
