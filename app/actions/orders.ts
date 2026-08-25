'use server';

import prisma from '@/lib/db';
import { obtenerItemsInactivos, estaActivo } from '@/lib/menuDisponibilidad';
import { buscarItemPedible, precioDeItem, nombreConVariante, type Variante } from '@/lib/pedidosCarta';
import { revalidatePath } from 'next/cache';

const MENSAJES_PEDIDO = {
  NO_ACEPTA_PEDIDOS: 'En este momento no estamos aceptando pedidos online.',
  CARRITO_VACIO: 'Tu carrito está vacío.',
  ITEM_INVALIDO: 'Uno de los ítems de tu pedido ya no está disponible. Revisá tu carrito.',
  PEDIDO_MINIMO: (min: number) => `El pedido mínimo es de $${min.toLocaleString('es-AR')}.`,
  ERROR_GENERICO: 'Ocurrió un error al procesar tu pedido. Por favor intentá de nuevo.',
  PEDIDO_NO_ENCONTRADO: 'El pedido no fue encontrado.',
};

interface CartLineInput {
  seccion: string;
  nombre: string;
  variante?: Variante;
  cantidad: number;
}

interface CreateOrderData {
  nombre: string;
  telefono: string;
  email: string;
  notas?: string;
  items: CartLineInput[];
}

async function vincularClientePedido(orderId: string, data: { nombre: string; email: string; telefono: string }) {
  const email = data.email.trim().toLowerCase();
  const telefono = data.telefono.trim();

  let cliente = await prisma.customer.findFirst({ where: { email } });
  if (!cliente) cliente = await prisma.customer.findFirst({ where: { telefono } });

  if (!cliente) {
    cliente = await prisma.customer.create({
      data: { nombre: data.nombre, email, telefono, origen: 'web' },
    });
  }

  await prisma.order.update({ where: { id: orderId }, data: { customerId: cliente.id } });
}

/**
 * Crea el pedido y la preferencia de Mercado Pago. Recalcula precios y
 * disponibilidad desde lib/carta.ts en el servidor — nunca confía en lo que
 * mandó el navegador (podría haber sido manipulado).
 */
export async function createOrder(data: CreateOrderData) {
  try {
    if (!data.items || data.items.length === 0) {
      return { success: false, error: MENSAJES_PEDIDO.CARRITO_VACIO };
    }

    const settings = await prisma.settings.findFirst();
    if (settings && !settings.aceptaPedidosOnline) {
      return { success: false, error: MENSAJES_PEDIDO.NO_ACEPTA_PEDIDOS };
    }

    const inactivos = await obtenerItemsInactivos();
    const itemsValidados: { seccion: string; nombre: string; precioUnitario: number; cantidad: number }[] = [];

    for (const linea of data.items) {
      if (!linea.cantidad || linea.cantidad < 1) continue;
      if (!estaActivo(inactivos, linea.seccion, linea.nombre)) {
        return { success: false, error: MENSAJES_PEDIDO.ITEM_INVALIDO };
      }
      const item = buscarItemPedible(linea.seccion, linea.nombre);
      if (!item) {
        return { success: false, error: MENSAJES_PEDIDO.ITEM_INVALIDO };
      }
      const precioUnitario = precioDeItem(item, linea.variante);
      if (precioUnitario === null) {
        return { success: false, error: MENSAJES_PEDIDO.ITEM_INVALIDO };
      }
      itemsValidados.push({
        seccion: linea.seccion,
        nombre: nombreConVariante(linea.nombre, linea.variante),
        precioUnitario,
        cantidad: linea.cantidad,
      });
    }

    if (itemsValidados.length === 0) {
      return { success: false, error: MENSAJES_PEDIDO.CARRITO_VACIO };
    }

    const subtotal = itemsValidados.reduce((acc, it) => acc + it.precioUnitario * it.cantidad, 0);

    if (settings && settings.pedidoMinimo > 0 && subtotal < settings.pedidoMinimo) {
      return { success: false, error: MENSAJES_PEDIDO.PEDIDO_MINIMO(settings.pedidoMinimo) };
    }

    const order = await prisma.order.create({
      data: {
        nombre: data.nombre,
        telefono: data.telefono,
        email: data.email,
        notas: data.notas || null,
        subtotal,
        items: { create: itemsValidados },
      },
    });

    try {
      await vincularClientePedido(order.id, { nombre: data.nombre, email: data.email, telefono: data.telefono });
    } catch (e) {
      console.error('Error vinculando cliente/pedido:', e);
    }

    const { crearPreferencia } = await import('@/lib/mercadopago');
    const { preferenceId, initPoint } = await crearPreferencia(
      order.id,
      itemsValidados.map((it) => ({ nombre: it.nombre, precioUnitario: it.precioUnitario, cantidad: it.cantidad }))
    );

    await prisma.order.update({ where: { id: order.id }, data: { mpPreferenceId: preferenceId } });

    revalidatePath('/admin/pedidos');

    return { success: true, orderId: order.id, initPoint };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: MENSAJES_PEDIDO.ERROR_GENERICO };
  }
}

const ESTADOS_VALIDOS = ['pendiente_pago', 'pagado', 'en_preparacion', 'listo_para_retirar', 'entregado', 'cancelado'];

export async function actualizarEstadoPedido(orderId: string, estado: string) {
  try {
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return { success: false, error: 'Estado inválido' };
    }
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { success: false, error: MENSAJES_PEDIDO.PEDIDO_NO_ENCONTRADO };
    }
    await prisma.order.update({ where: { id: orderId }, data: { estado } });
    revalidatePath('/admin/pedidos');
    return { success: true };
  } catch (error) {
    console.error('Error actualizando estado de pedido:', error);
    return { success: false, error: MENSAJES_PEDIDO.ERROR_GENERICO };
  }
}
