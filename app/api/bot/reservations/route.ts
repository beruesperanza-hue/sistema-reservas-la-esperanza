import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import prisma from '@/lib/db';
import { ESTADOS_RESERVA } from '@/lib/constants';
import { dateAFechaISO, fechaISOaDate } from '@/lib/fechas';
import {
  createReservationAdmin,
  cancelReservation,
} from '@/app/actions/reservations';

/**
 * Endpoint interno para el asistente de Telegram. No pasa por la sesión de admin normal:
 * usa un Bearer secret propio (BOT_RESERVATIONS_SECRET), distinto de cualquier otra
 * credencial del sistema. El bot nunca tiene DATABASE_URL ni Prisma directo — todo pasa
 * por acá, reusando la misma lógica de negocio que el panel de admin.
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.BOT_RESERVATIONS_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

function serializeReserva(r: {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  personas: number;
  fecha: Date;
  hora: string;
  ubicacion: string;
  comentarios: string | null;
  estado: string;
}) {
  return {
    id: r.id,
    nombre: r.nombre,
    apellido: r.apellido,
    email: r.email,
    telefono: r.telefono,
    personas: r.personas,
    fecha: dateAFechaISO(r.fecha),
    hora: r.hora,
    ubicacion: r.ubicacion,
    comentarios: r.comentarios,
    estado: r.estado,
  };
}

interface LookupBody {
  action: 'lookup';
  nombre?: string;
  fecha?: string;
  telefono?: string;
  email?: string;
}

interface CreateBody {
  action: 'create';
  nombre: string;
  apellido: string;
  email?: string;
  telefono: string;
  personas: number;
  fecha: string;
  hora: string;
  ubicacion?: string;
  comentarios?: string;
}

interface CancelBody {
  action: 'cancel';
  reservationId: string;
}

type RequestBody = LookupBody | CreateBody | CancelBody;

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (body.action === 'lookup') {
    if (!body.nombre && !body.fecha && !body.telefono && !body.email) {
      return NextResponse.json(
        { error: 'Se necesita al menos un criterio de búsqueda' },
        { status: 400 }
      );
    }
    const where: Record<string, unknown> = {
      estado: { not: ESTADOS_RESERVA.CANCELADA },
    };
    if (body.nombre) {
      where.OR = [
        { nombre: { contains: body.nombre, mode: 'insensitive' } },
        { apellido: { contains: body.nombre, mode: 'insensitive' } },
      ];
    }
    if (body.fecha) where.fecha = fechaISOaDate(body.fecha);
    if (body.telefono) where.telefono = { contains: body.telefono };
    if (body.email) where.email = { contains: body.email, mode: 'insensitive' };

    const reservas = await prisma.reservation.findMany({
      where,
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      take: 5,
    });

    return NextResponse.json({ reservas: reservas.map(serializeReserva) });
  }

  if (body.action === 'create') {
    if (!body.nombre || !body.apellido || !body.telefono || !body.personas || !body.fecha || !body.hora) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }
    const result = await createReservationAdmin({
      nombre: body.nombre,
      apellido: body.apellido,
      email: body.email,
      telefono: body.telefono,
      personas: body.personas,
      fecha: body.fecha,
      hora: body.hora,
      ubicacion: body.ubicacion,
      comentarios: body.comentarios,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  if (body.action === 'cancel') {
    if (!body.reservationId) {
      return NextResponse.json({ error: 'Falta reservationId' }, { status: 400 });
    }
    const result = await cancelReservation(body.reservationId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  return NextResponse.json({ error: 'action inválida' }, { status: 400 });
}
