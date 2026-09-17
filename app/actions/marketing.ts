'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { verifySessionToken } from '@/lib/adminSession';
import { enviarMailMarketing, htmlMailMarketing } from '@/lib/email';
import {
  ESTADOS_CAMPANIA,
  LIMITE_MARKETING_DIARIO,
  TAMANIO_TANDA,
  TIPOS_CAMPANIA,
  armarMail,
  calcularDestinatarios,
  emailValido,
  enviadosUltimas24h,
  resumenAudiencia,
} from '@/lib/marketing';

// Las server actions se pueden invocar por POST desde cualquier ruta, no solo
// desde /admin, así que el middleware no alcanza: cada acción verifica la sesión.
async function exigirAdmin() {
  const token = (await cookies()).get('admin_token')?.value;
  if (!(await verifySessionToken(token))) throw new Error('No autorizado');
}

type Resultado<T> = ({ success: true } & T) | { success: false; error: string };

function fallo(error: unknown, contexto: string): { success: false; error: string } {
  console.error(`Marketing — ${contexto}:`, error);
  const mensaje = error instanceof Error ? error.message : 'Error inesperado';
  return { success: false, error: mensaje === 'No autorizado' ? 'Tu sesión venció. Volvé a entrar.' : mensaje };
}

export interface DatosCampania {
  tipo: string;
  nombre: string;
  asunto: string;
  cuerpoTexto: string;
  botonTexto?: string | null;
  botonUrl?: string | null;
  segmentId?: string | null;
}

function validar(d: DatosCampania): string | null {
  if (!Object.values(TIPOS_CAMPANIA).includes(d.tipo as never)) return 'Tipo de campaña inválido.';
  if (!d.nombre.trim()) return 'Poné un nombre para identificar la campaña.';
  if (!d.asunto.trim()) return 'Falta el asunto.';
  if (!d.cuerpoTexto.trim()) return 'Falta el texto del mail.';
  if (d.botonTexto?.trim() && !/^https?:\/\//i.test(d.botonUrl?.trim() ?? '')) {
    return 'El link del botón tiene que empezar con http:// o https://';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

export async function obtenerPanelMarketing() {
  try {
    await exigirAdmin();
    const [audiencia, campanias, segmentos] = await Promise.all([
      resumenAudiencia(),
      prisma.campania.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.segment.findMany({ orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } }),
    ]);
    return {
      success: true as const,
      audiencia,
      limiteDiario: LIMITE_MARKETING_DIARIO,
      segmentos,
      campanias: campanias.map((c) => ({
        id: c.id,
        tipo: c.tipo,
        nombre: c.nombre,
        asunto: c.asunto,
        estado: c.estado,
        segmentNombre: c.segmentNombre,
        destinatarios: c.destinatarios,
        enviados: c.enviados,
        fallidos: c.fallidos,
        createdAt: c.createdAt.toISOString(),
        enviadaEn: c.enviadaEn?.toISOString() ?? null,
      })),
    };
  } catch (error) {
    return fallo(error, 'panel');
  }
}

export async function obtenerCampania(id: string) {
  try {
    await exigirAdmin();
    const campania = await prisma.campania.findUnique({ where: { id } });
    if (!campania) return { success: false as const, error: 'La campaña no existe.' };

    const [porEstado, fallidosDetalle, enviadosHoy] = await Promise.all([
      prisma.envioCampania.groupBy({ by: ['estado'], where: { campaniaId: id }, _count: true }),
      prisma.envioCampania.findMany({
        where: { campaniaId: id, estado: 'fallido' },
        select: { email: true, error: true },
        take: 50,
      }),
      enviadosUltimas24h(),
    ]);
    const cuenta = (estado: string) => porEstado.find((p) => p.estado === estado)?._count ?? 0;

    // Mientras es borrador los destinatarios se calculan en vivo; después quedan congelados.
    const destinatariosPrevistos =
      campania.estado === ESTADOS_CAMPANIA.BORRADOR
        ? (await calcularDestinatarios({ tipo: campania.tipo, segmentId: campania.segmentId })).length
        : campania.destinatarios;

    const muestra = armarMail(campania, { customerId: 'vista-previa', nombre: 'Martín' }, campania.id);

    return {
      success: true as const,
      campania: {
        ...campania,
        createdAt: campania.createdAt.toISOString(),
        updatedAt: campania.updatedAt.toISOString(),
        enviadaEn: campania.enviadaEn?.toISOString() ?? null,
      },
      destinatariosPrevistos,
      pendientes: cuenta('pendiente'),
      enviados: cuenta('enviado'),
      fallidos: cuenta('fallido'),
      omitidos: cuenta('omitido'),
      fallidosDetalle,
      cupoRestanteHoy: Math.max(0, LIMITE_MARKETING_DIARIO - enviadosHoy),
      limiteDiario: LIMITE_MARKETING_DIARIO,
      vistaPrevia: htmlMailMarketing({ ...muestra, linkBaja: '#' }),
    };
  } catch (error) {
    return fallo(error, 'detalle');
  }
}

/** Vista previa y conteo mientras se escribe, sin guardar nada. */
export async function previsualizarCampania(
  datos: DatosCampania
): Promise<Resultado<{ html: string; destinatarios: number }>> {
  try {
    await exigirAdmin();
    const muestra = armarMail(
      { ...datos, asunto: datos.asunto || '(sin asunto)', cuerpoTexto: datos.cuerpoTexto || ' ' },
      { customerId: 'vista-previa', nombre: 'Martín' },
      'vista-previa'
    );
    const destinatarios = (await calcularDestinatarios({ tipo: datos.tipo, segmentId: datos.segmentId })).length;
    return { success: true, html: htmlMailMarketing({ ...muestra, linkBaja: '#' }), destinatarios };
  } catch (error) {
    return fallo(error, 'vista previa');
  }
}

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

export async function guardarCampania(
  datos: DatosCampania & { id?: string }
): Promise<Resultado<{ id: string }>> {
  try {
    await exigirAdmin();
    const error = validar(datos);
    if (error) return { success: false, error };

    const segmento = datos.segmentId
      ? await prisma.segment.findUnique({ where: { id: datos.segmentId }, select: { nombre: true } })
      : null;

    const data = {
      tipo: datos.tipo,
      nombre: datos.nombre.trim(),
      asunto: datos.asunto.trim(),
      cuerpoTexto: datos.cuerpoTexto,
      botonTexto: datos.tipo === TIPOS_CAMPANIA.CAMPANIA ? datos.botonTexto?.trim() || null : null,
      botonUrl: datos.tipo === TIPOS_CAMPANIA.CAMPANIA ? datos.botonUrl?.trim() || null : null,
      // Las invitaciones van siempre a todos los que nunca decidieron: no usan segmentos.
      segmentId: datos.tipo === TIPOS_CAMPANIA.CAMPANIA ? datos.segmentId || null : null,
      segmentNombre: datos.tipo === TIPOS_CAMPANIA.CAMPANIA ? segmento?.nombre ?? null : null,
    };

    if (datos.id) {
      const actual = await prisma.campania.findUnique({ where: { id: datos.id }, select: { estado: true } });
      if (!actual) return { success: false, error: 'La campaña no existe.' };
      if (actual.estado !== ESTADOS_CAMPANIA.BORRADOR) {
        return { success: false, error: 'Una campaña que ya empezó a enviarse no se puede editar.' };
      }
      await prisma.campania.update({ where: { id: datos.id }, data });
      revalidatePath('/admin/marketing');
      return { success: true, id: datos.id };
    }

    const creada = await prisma.campania.create({ data });
    revalidatePath('/admin/marketing');
    return { success: true, id: creada.id };
  } catch (error) {
    return fallo(error, 'guardar');
  }
}

export async function eliminarBorrador(id: string): Promise<Resultado<object>> {
  try {
    await exigirAdmin();
    const actual = await prisma.campania.findUnique({ where: { id }, select: { estado: true } });
    if (!actual) return { success: false, error: 'La campaña no existe.' };
    if (actual.estado !== ESTADOS_CAMPANIA.BORRADOR) {
      return { success: false, error: 'Solo se pueden borrar campañas que todavía no se enviaron.' };
    }
    await prisma.campania.delete({ where: { id } });
    revalidatePath('/admin/marketing');
    return { success: true };
  } catch (error) {
    return fallo(error, 'eliminar');
  }
}

/** Manda la campaña a un solo mail, con [PRUEBA] en el asunto. No cuenta para nada. */
export async function enviarPrueba(
  datos: DatosCampania,
  email: string
): Promise<Resultado<object>> {
  try {
    await exigirAdmin();
    if (!emailValido(email)) return { success: false, error: 'Ese email no es válido.' };
    const error = validar({ ...datos, nombre: datos.nombre || 'prueba' });
    if (error) return { success: false, error };

    const mail = armarMail(datos, { customerId: 'prueba', nombre: 'Martín' }, 'prueba');
    const res = await enviarMailMarketing({
      ...mail,
      email: email.trim(),
      asunto: `[PRUEBA] ${mail.asunto}`,
      linkBaja: mail.linkBaja,
    });
    return res.ok ? { success: true } : { success: false, error: `No se pudo enviar: ${res.error}` };
  } catch (error) {
    return fallo(error, 'prueba');
  }
}

/**
 * Congela la lista de destinatarios y pasa la campaña a "enviando".
 * A partir de acá no se edita, y se puede enviar en varios días sin repetir a nadie.
 */
export async function iniciarEnvio(id: string): Promise<Resultado<{ destinatarios: number }>> {
  try {
    await exigirAdmin();
    const campania = await prisma.campania.findUnique({ where: { id } });
    if (!campania) return { success: false, error: 'La campaña no existe.' };
    if (campania.estado !== ESTADOS_CAMPANIA.BORRADOR) {
      return { success: true, destinatarios: campania.destinatarios };
    }

    const destinatarios = await calcularDestinatarios({ tipo: campania.tipo, segmentId: campania.segmentId });
    if (!destinatarios.length) return { success: false, error: 'Esta campaña no tiene a quién enviarle.' };

    await prisma.$transaction([
      prisma.envioCampania.createMany({
        data: destinatarios.map((d) => ({ campaniaId: id, customerId: d.customerId, email: d.email })),
        skipDuplicates: true,
      }),
      prisma.campania.update({
        where: { id },
        data: { estado: ESTADOS_CAMPANIA.ENVIANDO, destinatarios: destinatarios.length },
      }),
    ]);

    revalidatePath('/admin/marketing');
    return { success: true, destinatarios: destinatarios.length };
  } catch (error) {
    return fallo(error, 'iniciar envío');
  }
}

export interface ResultadoTanda {
  enviadosTanda: number;
  fallidosTanda: number;
  pendientes: number;
  enviados: number;
  fallidos: number;
  omitidos: number;
  cupoRestanteHoy: number;
  terminado: boolean;
  /** Se frenó por el tope diario: se retoma mañana desde donde quedó. */
  frenadoPorCupo: boolean;
}

/**
 * Manda una tanda corta de pendientes. La pantalla la llama en loop mostrando
 * el avance; si se cierra la pantalla, el envío queda pausado y se retoma.
 */
export async function enviarTanda(id: string): Promise<Resultado<ResultadoTanda>> {
  try {
    await exigirAdmin();
    const campania = await prisma.campania.findUnique({ where: { id } });
    if (!campania) return { success: false, error: 'La campaña no existe.' };
    if (campania.estado === ESTADOS_CAMPANIA.BORRADOR) {
      return { success: false, error: 'Primero hay que iniciar el envío.' };
    }

    const cupo = Math.max(0, LIMITE_MARKETING_DIARIO - (await enviadosUltimas24h()));
    let enviadosTanda = 0;
    let fallidosTanda = 0;
    let frenadoPorCupo = cupo === 0;

    if (cupo > 0) {
      const lote = await prisma.envioCampania.findMany({
        where: { campaniaId: id, estado: 'pendiente' },
        orderBy: { createdAt: 'asc' },
        take: Math.min(TAMANIO_TANDA, cupo),
      });

      const nombres = new Map(
        (
          await prisma.customer.findMany({
            where: { id: { in: lote.map((e) => e.customerId) } },
            select: { id: true, nombre: true },
          })
        ).map((c) => [c.id, c.nombre])
      );

      for (const envio of lote) {
        // Si se dio de baja mientras la campaña estaba en cola, no se le manda.
        const ultimo = await prisma.consentRecord.findFirst({
          where: { customerId: envio.customerId, canal: 'email' },
          orderBy: { createdAt: 'desc' },
          select: { estado: true },
        });
        const debeRecibir =
          campania.tipo === TIPOS_CAMPANIA.INVITACION ? !ultimo : ultimo?.estado === 'autorizado';
        if (!debeRecibir) {
          await prisma.envioCampania.update({
            where: { id: envio.id },
            data: { estado: 'omitido', error: 'Se dio de baja antes de que le llegara' },
          });
          continue;
        }

        const mail = armarMail(campania, { customerId: envio.customerId, nombre: nombres.get(envio.customerId) ?? null }, id);
        const res = await enviarMailMarketing({ ...mail, email: envio.email });

        if (res.cuotaAgotada) {
          // No lo marcamos como fallido: queda pendiente para mañana.
          frenadoPorCupo = true;
          break;
        }

        await prisma.envioCampania.update({
          where: { id: envio.id },
          data: res.ok
            ? { estado: 'enviado', enviadoEn: new Date(), error: null }
            : { estado: 'fallido', error: res.error ?? 'Error desconocido' },
        });
        if (res.ok) enviadosTanda++;
        else fallidosTanda++;
      }
    }

    const porEstado = await prisma.envioCampania.groupBy({ by: ['estado'], where: { campaniaId: id }, _count: true });
    const cuenta = (e: string) => porEstado.find((p) => p.estado === e)?._count ?? 0;
    const pendientes = cuenta('pendiente');
    const terminado = pendientes === 0;

    await prisma.campania.update({
      where: { id },
      data: {
        enviados: cuenta('enviado'),
        fallidos: cuenta('fallido'),
        ...(terminado && campania.estado !== ESTADOS_CAMPANIA.ENVIADA
          ? { estado: ESTADOS_CAMPANIA.ENVIADA, enviadaEn: new Date() }
          : {}),
      },
    });

    const cupoRestanteHoy = Math.max(0, LIMITE_MARKETING_DIARIO - (await enviadosUltimas24h()));

    return {
      success: true,
      enviadosTanda,
      fallidosTanda,
      pendientes,
      enviados: cuenta('enviado'),
      fallidos: cuenta('fallido'),
      omitidos: cuenta('omitido'),
      cupoRestanteHoy,
      terminado,
      frenadoPorCupo: !terminado && (frenadoPorCupo || cupoRestanteHoy === 0),
    };
  } catch (error) {
    return fallo(error, 'enviar tanda');
  }
}

/** Vuelve a poner en cola los que fallaron (no los omitidos por baja). */
export async function reintentarFallidos(id: string): Promise<Resultado<{ reencolados: number }>> {
  try {
    await exigirAdmin();
    const { count } = await prisma.envioCampania.updateMany({
      where: { campaniaId: id, estado: 'fallido' },
      data: { estado: 'pendiente', error: null },
    });
    if (count) {
      await prisma.campania.update({ where: { id }, data: { estado: ESTADOS_CAMPANIA.ENVIANDO } });
    }
    revalidatePath('/admin/marketing');
    return { success: true, reencolados: count };
  } catch (error) {
    return fallo(error, 'reintentar');
  }
}

export async function listarSegmentos(): Promise<Resultado<{ segmentos: { id: string; nombre: string }[] }>> {
  try {
    await exigirAdmin();
    const segmentos = await prisma.segment.findMany({ orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } });
    return { success: true, segmentos };
  } catch (error) {
    return fallo(error, 'segmentos');
  }
}
