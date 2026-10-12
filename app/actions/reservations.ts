'use server';

import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import {
  sendReservationConfirmation,
  sendReservationCancellation,
  sendReservationCancelledAlertEmail,
  sendCancelLinkEmail,
} from '@/lib/email';
import { MENSAJES, ESTADOS_RESERVA, UBICACIONES } from '@/lib/constants';
import { dateAFechaISO, diaSemanaDe, esTurnoPasado, fechaISOaDate, formatearFechaLarga, hoyEnBA } from '@/lib/fechas';
import { firmaValida, linkCancelarReserva } from '@/lib/marketing';
import { getEstadoTurno, sectorDe } from '@/lib/turnos';
import { revalidatePath } from 'next/cache';

interface CreateReservationData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  personas: number;
  /** 'YYYY-MM-DD' — se compara siempre en hora de Buenos Aires. */
  fecha: string;
  hora: string;
  ubicacion?: string;
  comentarios?: string;
  /** Checkbox de opt-in del formulario. Nunca marcado por defecto. */
  aceptaMarketing?: boolean;
}

/**
 * Busca o crea el Customer de esta reserva (por email, o por teléfono si no
 * hay match de email) y linkea la reserva. Si tildó el opt-in, registra el
 * consentimiento — nunca se crea un registro si no lo tildó explícitamente
 * (no marcarlo no revoca un consentimiento previo, simplemente no suma uno).
 */
async function vincularClienteYConsentimiento(
  reservationId: string,
  data: { nombre: string; apellido: string; email: string; telefono: string; aceptaMarketing?: boolean }
) {
  const email = data.email.trim().toLowerCase();
  const telefono = data.telefono.trim();

  let cliente = await prisma.customer.findFirst({ where: { email } });
  if (!cliente) cliente = await prisma.customer.findFirst({ where: { telefono } });

  if (!cliente) {
    cliente = await prisma.customer.create({
      data: { nombre: data.nombre, apellido: data.apellido, email, telefono, origen: 'web' },
    });
  }

  await prisma.reservation.update({ where: { id: reservationId }, data: { customerId: cliente.id } });

  if (data.aceptaMarketing) {
    await prisma.consentRecord.create({
      data: { customerId: cliente.id, canal: 'email', estado: 'autorizado', fuente: 'formulario_reserva' },
    });
  }
}

export async function createReservation(data: CreateReservationData) {
  try {
    // El turno se compara contra la hora de Buenos Aires, no la del servidor:
    // reservar hoy a las 22:00 tiene que funcionar hasta que sean las 22:00 acá.
    if (esTurnoPasado(data.fecha, data.hora)) {
      return { success: false, error: MENSAJES.TURNO_PASADO };
    }

    const fecha = fechaISOaDate(data.fecha);
    const ubicacion =
      data.ubicacion === UBICACIONES.VEREDA ? UBICACIONES.VEREDA : UBICACIONES.ADENTRO;

    // Buscar si ya existe una reserva para ese horario y email
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        email: data.email,
        fecha,
        hora: data.hora,
      },
    });

    if (existingReservation) {
      return { success: false, error: MENSAJES.RESERVA_DUPLICADA };
    }

    // Capacidad y cierres del turno, por sector (salón y vereda son cupos
    // independientes, definidos en Schedule).
    const horario = await prisma.schedule.findUnique({
      where: { dia_hora: { dia: diaSemanaDe(data.fecha), hora: data.hora } },
    });
    const capacidadSalon = horario?.capacidad ?? 20;
    const capacidadVereda = horario?.capacidadVereda ?? 0;

    const estado = await getEstadoTurno(
      data.fecha,
      data.hora,
      capacidadSalon,
      capacidadVereda,
      data.personas
    );
    const sector = sectorDe(estado, ubicacion);

    if (sector.cerradoManual) {
      return { success: false, error: MENSAJES.TURNO_CERRADO };
    }
    if (!sector.disponible) {
      return { success: false, error: MENSAJES.SECTOR_LLENO };
    }

    // Crear la reserva
    const reservation = await prisma.reservation.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono,
        personas: data.personas,
        fecha,
        hora: data.hora,
        ubicacion,
        comentarios: data.comentarios || null,
        estado: ESTADOS_RESERVA.CONFIRMADA,
      },
    });

    // Enviar email de confirmación, con el link para que se cancele solo.
    await sendReservationConfirmation(
      data.email,
      data.nombre,
      formatearFechaLarga(data.fecha),
      data.hora,
      data.personas,
      data.telefono,
      ubicacion,
      linkCancelarReserva(reservation.id)
    );

    // No bloqueante: si falla el link a Customer, la reserva ya está hecha y
    // el mail ya salió — no tiene sentido devolver error por esto.
    try {
      await vincularClienteYConsentimiento(reservation.id, {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono,
        aceptaMarketing: data.aceptaMarketing,
      });
    } catch (e) {
      console.error('Error vinculando cliente/consentimiento:', e);
    }

    revalidatePath('/admin');
    revalidatePath('/reservas');

    return {
      success: true,
      message: MENSAJES.RESERVA_EXITOSA,
      reservationId: reservation.id,
    };
  } catch (error) {
    // Dos submits casi simultáneos (doble-click, reintento de red) pueden
    // pasar ambos el chequeo findFirst antes de que el primero confirme:
    // la constraint única [fecha, hora, email] de la base frena al segundo acá.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: MENSAJES.RESERVA_DUPLICADA };
    }
    console.error('Error creating reservation:', error);
    return { success: false, error: MENSAJES.ERROR_GENERICO };
  }
}

interface CreateReservationAdminData {
  nombre: string;
  apellido: string;
  /** Opcional: si no se carga, no se manda mail y se guarda un placeholder único. */
  email?: string;
  telefono: string;
  personas: number;
  fecha: string;
  hora: string;
  ubicacion?: string;
  comentarios?: string;
}

/**
 * Carga una reserva desde el panel de admin (walk-in, teléfono, etc).
 * A diferencia de createReservation, NO bloquea por turno pasado ni por
 * cierre manual (el restaurante puede anotar gente igual), y el cupo es solo
 * informativo: si se pasa de capacidad, avisa pero igual la crea.
 */
export async function createReservationAdmin(data: CreateReservationAdminData) {
  try {
    const fecha = fechaISOaDate(data.fecha);
    const ubicacion =
      data.ubicacion === UBICACIONES.VEREDA ? UBICACIONES.VEREDA : UBICACIONES.ADENTRO;
    const tieneEmail = !!data.email && data.email.trim().length > 0;
    const email = tieneEmail
      ? data.email!.trim()
      : `walkin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@sin-email.laesperanza`;

    const horario = await prisma.schedule.findUnique({
      where: { dia_hora: { dia: diaSemanaDe(data.fecha), hora: data.hora } },
    });
    const capacidadSalon = horario?.capacidad ?? 20;
    const capacidadVereda = horario?.capacidadVereda ?? 0;

    const estado = await getEstadoTurno(
      data.fecha,
      data.hora,
      capacidadSalon,
      capacidadVereda,
      data.personas
    );
    const sector = sectorDe(estado, ubicacion);

    const reservation = await prisma.reservation.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        email,
        telefono: data.telefono,
        personas: data.personas,
        fecha,
        hora: data.hora,
        ubicacion,
        comentarios: data.comentarios || null,
        estado: ESTADOS_RESERVA.CONFIRMADA,
        creadaPorAdmin: true,
      },
    });

    if (tieneEmail) {
      await sendReservationConfirmation(
        email,
        data.nombre,
        formatearFechaLarga(data.fecha),
        data.hora,
        data.personas,
        data.telefono,
        ubicacion
      );
    }

    revalidatePath('/admin');
    revalidatePath('/reservas');

    return {
      success: true,
      message: MENSAJES.RESERVA_EXITOSA,
      reservationId: reservation.id,
      // Avisos no bloqueantes para que el admin sepa que forzó algo.
      avisos: [
        estado.pasado ? 'El turno ya había pasado.' : null,
        sector.cerradoManual ? 'El sector estaba cerrado manualmente.' : null,
        !sector.disponible && !sector.cerradoManual
          ? `Se pasó del cupo (quedaban ${sector.libres} lugares).`
          : null,
      ].filter((a): a is string => !!a),
    };
  } catch (error) {
    console.error('Error creating admin reservation:', error);
    return { success: false, error: MENSAJES.ERROR_GENERICO };
  }
}

/**
 * Marca (o desmarca) que el cliente ya se sentó. A diferencia del cierre de
 * turno, esto es por reserva individual y no toca el cupo ni a nadie más.
 */
export async function marcarAsistio(reservationId: string, asistio: boolean) {
  try {
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { asistio },
    });
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error marcando asistencia:', error);
    return { success: false, error: MENSAJES.ERROR_GENERICO };
  }
}

export async function cancelReservation(reservationId: string) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return { success: false, error: MENSAJES.RESERVA_NO_ENCONTRADA };
    }

    // Actualizar estado a cancelada
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { estado: ESTADOS_RESERVA.CANCELADA },
    });

    // Enviar email de cancelación
    await sendReservationCancellation(reservation.email, reservation.nombre, {
      fecha: formatearFechaLarga(dateAFechaISO(reservation.fecha)),
      hora: reservation.hora,
      personas: reservation.personas,
    });

    revalidatePath('/admin');
    return { success: true, message: MENSAJES.CANCELA_EXITOSA };
  } catch (error) {
    console.error('Error canceling reservation:', error);
    return { success: false, error: MENSAJES.ERROR_GENERICO };
  }
}

export async function updateReservation(reservationId: string, data: Partial<CreateReservationData>) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return { success: false, error: MENSAJES.RESERVA_NO_ENCONTRADA };
    }

    // Actualizar la reserva
    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.apellido && { apellido: data.apellido }),
        ...(data.email && { email: data.email }),
        ...(data.telefono && { telefono: data.telefono }),
        ...(data.personas && { personas: data.personas }),
        ...(data.ubicacion && { ubicacion: data.ubicacion }),
        ...(data.comentarios !== undefined && { comentarios: data.comentarios }),
      },
    });

    revalidatePath('/admin');
    return { success: true, message: 'Reserva actualizada', reservation: updated };
  } catch (error) {
    console.error('Error updating reservation:', error);
    return { success: false, error: MENSAJES.ERROR_GENERICO };
  }
}

export async function deleteReservation(reservationId: string) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return { success: false, error: MENSAJES.RESERVA_NO_ENCONTRADA };
    }

    await prisma.reservation.delete({
      where: { id: reservationId },
    });

    revalidatePath('/admin');
    return { success: true, message: 'Reserva eliminada' };
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return { success: false, error: MENSAJES.ERROR_GENERICO };
  }
}

// ---------------------------------------------------------------------------
// Cancelación por el propio cliente (link firmado del mail de confirmación)
// ---------------------------------------------------------------------------

export type MotivoNoCancelable = 'link_invalido' | 'no_encontrada' | 'ya_cancelada' | 'ya_paso';

/**
 * Trae la reserva de un link de cancelación, validando la firma. Devuelve el
 * motivo cuando no se puede cancelar, para que la página muestre qué pasó.
 */
export async function reservaDeLinkCancelacion(reservationId: string, firma: string) {
  if (!firmaValida(reservationId, 'cancelar-reserva', firma)) {
    return { ok: false as const, motivo: 'link_invalido' as MotivoNoCancelable };
  }

  const reserva = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reserva) return { ok: false as const, motivo: 'no_encontrada' as MotivoNoCancelable };

  const fechaISO = dateAFechaISO(reserva.fecha);
  const datos = {
    id: reserva.id,
    nombre: reserva.nombre,
    apellido: reserva.apellido,
    fechaISO,
    fecha: formatearFechaLarga(fechaISO),
    hora: reserva.hora,
    personas: reserva.personas,
    ubicacion: reserva.ubicacion,
    estado: reserva.estado,
  };

  if (reserva.estado === ESTADOS_RESERVA.CANCELADA) {
    return { ok: false as const, motivo: 'ya_cancelada' as MotivoNoCancelable, datos };
  }
  if (esTurnoPasado(fechaISO, reserva.hora)) {
    return { ok: false as const, motivo: 'ya_paso' as MotivoNoCancelable, datos };
  }

  return { ok: true as const, datos };
}

/**
 * Cancela la reserva desde el link del mail. Vuelve a validar la firma del
 * lado del servidor: la página ya lo hizo, pero esta acción se puede llamar
 * directo, así que no se confía en lo que llega del navegador.
 */
export async function cancelarReservaDesdeLink(reservationId: string, firma: string) {
  try {
    const encontrada = await reservaDeLinkCancelacion(reservationId, firma);
    if (!encontrada.ok) return { success: false as const, motivo: encontrada.motivo };

    const reserva = await prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reserva) return { success: false as const, motivo: 'no_encontrada' as MotivoNoCancelable };

    await prisma.reservation.update({
      where: { id: reservationId },
      data: { estado: ESTADOS_RESERVA.CANCELADA },
    });

    const fecha = formatearFechaLarga(dateAFechaISO(reserva.fecha));

    // Los mails no deben voltear la cancelación: ya está hecha en la base.
    try {
      await sendReservationCancellation(reserva.email, reserva.nombre, {
        fecha,
        hora: reserva.hora,
        personas: reserva.personas,
      });
    } catch (e) {
      console.error('Error mandando el mail de cancelación al cliente:', e);
    }

    try {
      await sendReservationCancelledAlertEmail({
        nombre: reserva.nombre,
        apellido: reserva.apellido,
        fecha,
        hora: reserva.hora,
        personas: reserva.personas,
        telefono: reserva.telefono,
        email: reserva.email,
        ubicacion: reserva.ubicacion,
      });
    } catch (e) {
      console.error('Error avisando al local de la cancelación:', e);
    }

    revalidatePath('/admin');
    return { success: true as const };
  } catch (error) {
    console.error('Error cancelando la reserva desde el link:', error);
    return { success: false as const, motivo: 'error' as const };
  }
}

/**
 * El cliente pide desde la web el link para cancelar. Se le manda por mail a
 * la dirección de la reserva: así nadie puede cancelar la mesa de otro con
 * solo saberle el mail. La respuesta es siempre la misma, exista o no la
 * reserva — si no, el formulario serviría para averiguar quién tiene mesa.
 */
export async function pedirLinkDeCancelacion(email: string) {
  const limpio = email.trim().toLowerCase();
  if (!limpio || !limpio.includes('@')) {
    return { success: false as const, error: 'Escribí el mail con el que hiciste la reserva.' };
  }

  try {
    const reservas = await prisma.reservation.findMany({
      where: {
        email: { equals: limpio, mode: 'insensitive' },
        estado: ESTADOS_RESERVA.CONFIRMADA,
        fecha: { gte: fechaISOaDate(hoyEnBA()) },
      },
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      take: 10,
    });

    const proximas = reservas.filter((r) => !esTurnoPasado(dateAFechaISO(r.fecha), r.hora));

    if (proximas.length > 0) {
      await sendCancelLinkEmail(
        proximas[0].email,
        proximas[0].nombre,
        proximas.map((r) => ({
          fecha: formatearFechaLarga(dateAFechaISO(r.fecha)),
          hora: r.hora,
          personas: r.personas,
          link: linkCancelarReserva(r.id),
        }))
      );
    }

    return { success: true as const };
  } catch (error) {
    console.error('Error mandando el link de cancelación:', error);
    return { success: false as const, error: MENSAJES.ERROR_GENERICO };
  }
}
