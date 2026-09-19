import { randomBytes } from 'node:crypto';
import prisma from '@/lib/db';
import { CONTACTO } from '@/lib/constants';
import { obtenerClientesConCampos } from '@/lib/segmentos';
import { normalizarTelefono } from '@/lib/telefono';

export const TAMANIO_TANDA_WHATSAPP = 50;

export function nuevoSlug(): string {
  return randomBytes(5).toString('hex');
}

export function urlPromo(slug: string): string {
  return new URL(`/p/${slug}`, CONTACTO.SITIO).toString();
}

export function urlImagenPromo(slug: string, version: string | number = ''): string {
  return new URL(`/api/promo/${slug}/imagen${version ? `?v=${version}` : ''}`, CONTACTO.SITIO).toString();
}

export interface DestinatarioWhatsapp {
  customerId: string;
  nombre: string;
  telefono: string;
}

/**
 * A quién se le manda: todo cliente con un teléfono utilizable que no haya
 * pedido la baja de WhatsApp. Una sola persona por número, y primero los que
 * vinieron hace menos y más veces: si en algún momento se corta la campaña,
 * los mejores clientes ya la recibieron.
 */
export async function calcularDestinatariosWhatsapp(): Promise<DestinatarioWhatsapp[]> {
  const todos = await obtenerClientesConCampos();

  const candidatos = todos
    .filter(({ campos }) => campos.consentimiento.whatsapp !== 'revocado')
    .map(({ cliente, campos }) => ({
      cliente,
      campos,
      tel: normalizarTelefono(cliente.telefono, cliente.telefonoPais),
    }))
    .filter((c) => c.tel !== null)
    .sort((a, b) => {
      const da = a.campos.diasDesdeUltimaVisita ?? Number.MAX_SAFE_INTEGER;
      const db = b.campos.diasDesdeUltimaVisita ?? Number.MAX_SAFE_INTEGER;
      if (da !== db) return da - db;
      return b.campos.visitasTotales - a.campos.visitasTotales;
    });

  // Un número dado de baja en cualquiera de sus fichas no recibe.
  const bajas = new Set(
    todos
      .filter(({ campos }) => campos.consentimiento.whatsapp === 'revocado')
      .map(({ cliente }) => normalizarTelefono(cliente.telefono, cliente.telefonoPais)?.numero)
      .filter(Boolean)
  );

  const vistos = new Set<string>();
  const resultado: DestinatarioWhatsapp[] = [];
  for (const c of candidatos) {
    const numero = c.tel!.numero;
    if (vistos.has(numero) || bajas.has(numero)) continue;
    vistos.add(numero);
    resultado.push({
      customerId: c.cliente.id,
      nombre: [c.cliente.nombre, c.cliente.apellido].filter(Boolean).join(' ').trim(),
      telefono: numero,
    });
  }
  return resultado;
}

/** Resumen de cada tanda de una promo: cuántos van, cuántos se mandaron, etc. */
export async function resumenTandas(promoId: string) {
  const filas = await prisma.envioWhatsapp.groupBy({
    by: ['tanda', 'estado'],
    where: { promoId },
    _count: true,
  });

  const tandas = new Map<number, { tanda: number; total: number; enviados: number; salteados: number; bajas: number }>();
  for (const f of filas) {
    const t = tandas.get(f.tanda) ?? { tanda: f.tanda, total: 0, enviados: 0, salteados: 0, bajas: 0 };
    t.total += f._count;
    if (f.estado === 'enviado') t.enviados += f._count;
    if (f.estado === 'salteado') t.salteados += f._count;
    if (f.estado === 'baja') t.bajas += f._count;
    tandas.set(f.tanda, t);
  }
  return [...tandas.values()]
    .sort((a, b) => a.tanda - b.tanda)
    .map((t) => ({ ...t, pendientes: t.total - t.enviados - t.salteados - t.bajas }));
}
