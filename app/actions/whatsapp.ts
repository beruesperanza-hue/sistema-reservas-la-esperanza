'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { verifySessionToken } from '@/lib/adminSession';
import { linkWhatsapp, mensajeWhatsapp } from '@/lib/textoMarketing';
import {
  TAMANIO_TANDA_WHATSAPP,
  calcularDestinatariosWhatsapp,
  nuevoSlug,
  resumenTandas,
  urlPromo,
} from '@/lib/whatsappPromo';

// Igual que en marketing.ts: las server actions se pueden invocar desde fuera
// de /admin, así que cada una verifica la sesión por su cuenta.
async function exigirAdmin() {
  const token = (await cookies()).get('admin_token')?.value;
  if (!(await verifySessionToken(token))) throw new Error('No autorizado');
}

function fallo(error: unknown, contexto: string): { success: false; error: string } {
  console.error(`WhatsApp — ${contexto}:`, error);
  const mensaje = error instanceof Error ? error.message : 'Error inesperado';
  return { success: false, error: mensaje === 'No autorizado' ? 'Tu sesión venció. Volvé a entrar.' : mensaje };
}

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGEN = 2 * 1024 * 1024;

export interface DatosPromo {
  id?: string;
  nombre: string;
  titulo: string;
  mensaje: string;
  /** Imagen nueva en base64 (sin el prefijo data:). null = sacar la foto; undefined = no tocarla. */
  imagenBase64?: string | null;
  imagenTipo?: string | null;
}

// ---------------------------------------------------------------------------

export async function listarPromosWhatsapp() {
  try {
    await exigirAdmin();
    const promos = await prisma.promoWhatsapp.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, nombre: true, titulo: true, estado: true, destinatarios: true, createdAt: true },
    });
    const enviados = await prisma.envioWhatsapp.groupBy({
      by: ['promoId'],
      where: { estado: 'enviado' },
      _count: true,
    });
    const disponibles = (await calcularDestinatariosWhatsapp()).length;
    return {
      success: true as const,
      disponibles,
      tamanioTanda: TAMANIO_TANDA_WHATSAPP,
      promos: promos.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        enviados: enviados.find((e) => e.promoId === p.id)?._count ?? 0,
      })),
    };
  } catch (error) {
    return fallo(error, 'listar');
  }
}

export async function obtenerPromoWhatsapp(id: string) {
  try {
    await exigirAdmin();
    const promo = await prisma.promoWhatsapp.findUnique({
      where: { id },
      select: {
        id: true, slug: true, nombre: true, titulo: true, mensaje: true, estado: true,
        destinatarios: true, tamanioTanda: true, imagenTipo: true, updatedAt: true,
      },
    });
    if (!promo) return { success: false as const, error: 'La promo no existe.' };

    const tandas = promo.estado === 'activa' ? await resumenTandas(id) : [];
    const previstos =
      promo.estado === 'borrador' ? (await calcularDestinatariosWhatsapp()).length : promo.destinatarios;

    return {
      success: true as const,
      promo: { ...promo, updatedAt: promo.updatedAt.toISOString(), tieneImagen: !!promo.imagenTipo },
      urlPromo: urlPromo(promo.slug),
      previstos,
      tandas,
    };
  } catch (error) {
    return fallo(error, 'detalle');
  }
}

export async function guardarPromoWhatsapp(
  datos: DatosPromo
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    await exigirAdmin();
    if (!datos.nombre.trim()) return { success: false, error: 'Poné un nombre para identificar la promo.' };
    if (!datos.titulo.trim()) return { success: false, error: 'Falta el título de la promo.' };
    if (!datos.mensaje.trim()) return { success: false, error: 'Falta el mensaje.' };

    let imagen: { imagen: Buffer | null; imagenTipo: string | null } | undefined;
    if (datos.imagenBase64 === null) {
      imagen = { imagen: null, imagenTipo: null };
    } else if (datos.imagenBase64) {
      if (!TIPOS_IMAGEN.includes(datos.imagenTipo ?? '')) {
        return { success: false, error: 'La foto tiene que ser JPG, PNG o WebP.' };
      }
      const buffer = Buffer.from(datos.imagenBase64, 'base64');
      if (buffer.length > MAX_IMAGEN) return { success: false, error: 'La foto pesa demasiado (máximo 2 MB).' };
      imagen = { imagen: buffer, imagenTipo: datos.imagenTipo! };
    }

    const data = {
      nombre: datos.nombre.trim(),
      titulo: datos.titulo.trim(),
      mensaje: datos.mensaje,
      ...(imagen ?? {}),
    };

    if (datos.id) {
      // Se puede editar aunque ya haya tandas: el mensaje se arma al abrir cada
      // WhatsApp, así que un cambio vale para los que todavía no se mandaron.
      await prisma.promoWhatsapp.update({ where: { id: datos.id }, data });
      revalidatePath('/admin/marketing/whatsapp');
      return { success: true, id: datos.id };
    }

    const creada = await prisma.promoWhatsapp.create({
      data: { ...data, slug: nuevoSlug(), tamanioTanda: TAMANIO_TANDA_WHATSAPP },
    });
    revalidatePath('/admin/marketing/whatsapp');
    return { success: true, id: creada.id };
  } catch (error) {
    return fallo(error, 'guardar');
  }
}

export async function eliminarPromoWhatsapp(id: string) {
  try {
    await exigirAdmin();
    const enviados = await prisma.envioWhatsapp.count({ where: { promoId: id, estado: 'enviado' } });
    if (enviados > 0) {
      return { success: false as const, error: 'Ya se mandó a clientes: no se puede borrar (se perdería el registro).' };
    }
    await prisma.promoWhatsapp.delete({ where: { id } });
    revalidatePath('/admin/marketing/whatsapp');
    return { success: true as const };
  } catch (error) {
    return fallo(error, 'eliminar');
  }
}

/** Reparte a los destinatarios en tandas de 50 y las deja fijas. */
export async function armarTandas(id: string) {
  try {
    await exigirAdmin();
    const promo = await prisma.promoWhatsapp.findUnique({ where: { id }, select: { estado: true, tamanioTanda: true } });
    if (!promo) return { success: false as const, error: 'La promo no existe.' };
    if (promo.estado === 'activa') return { success: true as const };

    const destinatarios = await calcularDestinatariosWhatsapp();
    if (!destinatarios.length) return { success: false as const, error: 'No hay clientes con teléfono para esta promo.' };

    await prisma.$transaction([
      prisma.envioWhatsapp.createMany({
        data: destinatarios.map((d, i) => ({
          promoId: id,
          customerId: d.customerId,
          nombre: d.nombre,
          telefono: d.telefono,
          tanda: Math.floor(i / promo.tamanioTanda) + 1,
          orden: i,
        })),
        skipDuplicates: true,
      }),
      prisma.promoWhatsapp.update({
        where: { id },
        data: { estado: 'activa', destinatarios: destinatarios.length },
      }),
    ]);
    revalidatePath(`/admin/marketing/whatsapp/${id}`);
    return { success: true as const };
  } catch (error) {
    return fallo(error, 'armar tandas');
  }
}

export async function obtenerTanda(id: string, tanda: number) {
  try {
    await exigirAdmin();
    const promo = await prisma.promoWhatsapp.findUnique({
      where: { id },
      select: { id: true, slug: true, nombre: true, mensaje: true, imagenTipo: true, updatedAt: true },
    });
    if (!promo) return { success: false as const, error: 'La promo no existe.' };

    const [envios, totalTandas] = await Promise.all([
      prisma.envioWhatsapp.findMany({
        where: { promoId: id, tanda },
        orderBy: { orden: 'asc' },
      }),
      prisma.envioWhatsapp.aggregate({ where: { promoId: id }, _max: { tanda: true } }),
    ]);

    const url = urlPromo(promo.slug);
    return {
      success: true as const,
      promo: { id: promo.id, slug: promo.slug, nombre: promo.nombre, tieneImagen: !!promo.imagenTipo, version: promo.updatedAt.getTime() },
      tanda,
      totalTandas: totalTandas._max.tanda ?? 0,
      clientes: envios.map((e) => ({
        id: e.id,
        customerId: e.customerId,
        nombre: e.nombre,
        telefono: e.telefono,
        estado: e.estado,
        link: linkWhatsapp(e.telefono, mensajeWhatsapp(promo.mensaje, e.nombre, url)),
      })),
    };
  } catch (error) {
    return fallo(error, 'tanda');
  }
}

/**
 * Marca cómo quedó un cliente de la tanda. "baja" además deja asentado en el
 * CRM que no quiere más WhatsApp, así no entra en ninguna promo futura.
 */
export async function marcarEnvioWhatsapp(envioId: string, estado: 'pendiente' | 'enviado' | 'salteado' | 'baja') {
  try {
    await exigirAdmin();
    const envio = await prisma.envioWhatsapp.update({
      where: { id: envioId },
      data: { estado, enviadoEn: estado === 'enviado' ? new Date() : null },
    });

    if (estado === 'baja') {
      const ultimo = await prisma.consentRecord.findFirst({
        where: { customerId: envio.customerId, canal: 'whatsapp' },
        orderBy: { createdAt: 'desc' },
      });
      if (ultimo?.estado !== 'revocado') {
        await prisma.consentRecord.create({
          data: {
            customerId: envio.customerId,
            canal: 'whatsapp',
            estado: 'revocado',
            fuente: 'respuesta_baja_whatsapp',
            metodoObtencion: 'respondio_BAJA_a_promo',
            evidencia: `promo:${envio.promoId}`,
          },
        });
      }
    }
    return { success: true as const };
  } catch (error) {
    return fallo(error, 'marcar');
  }
}
