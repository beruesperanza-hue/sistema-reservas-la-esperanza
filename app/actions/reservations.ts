'use server';

import prisma from '@/lib/db';
import { sendReservationConfirmation, sendReservationCancellation } from '@/lib/email';
import { MENSAJES, ESTADOS_RESERVA, UBICACIONES } from '@/lib/constants';
import { diaSemanaDe, esTurnoPasado, fechaISOaDate, formatearFechaLarga } from '@/lib/fechas';
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

    // Enviar email de confirmación
    await sendReservationConfirmation(
      data.email,
      data.nombre,
      formatearFechaLarga(data.fecha),
      data.hora,
      data.personas,
      data.telefono,
      ubicacion
    );

    revalidatePath('/admin');
    revalidatePath('/reservas');

    return {
      success: true,
      message: MENSAJES.RESERVA_EXITOSA,
      reservationId: reservation.id,
    };
  } catch (error) {
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
    await sendReservationCancellation(reservation.email, reservation.nombre);

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
