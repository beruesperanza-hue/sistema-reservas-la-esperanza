import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ESTADOS_RESERVA, UBICACIONES } from '@/lib/constants';
import { diaSemanaDe, esTurnoPasado, fechaISOaDate } from '@/lib/fechas';

// Tablero operativo de un día: para cada turno de la plantilla semanal,
// cruza capacidad (Schedule), cierres manuales (TurnoCierre) y reservas
// reales de esa fecha, separado por sector. Lo usa el Dashboard del admin.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaStr = searchParams.get('fecha');

    if (!fechaStr || !/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
      return NextResponse.json({ error: 'fecha requerida (YYYY-MM-DD)' }, { status: 400 });
    }

    const fecha = fechaISOaDate(fechaStr);
    const diaNombre = diaSemanaDe(fechaStr);

    const [horarios, reservas, cierres] = await Promise.all([
      prisma.schedule.findMany({ where: { dia: diaNombre, activo: true }, orderBy: { hora: 'asc' } }),
      prisma.reservation.findMany({
        where: { fecha, estado: ESTADOS_RESERVA.CONFIRMADA },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.turnoCierre.findMany({ where: { fecha } }),
    ]);

    const turnos = horarios.map((horario) => {
      const reservasDelTurno = reservas.filter((r) => r.hora === horario.hora);
      const reservasSalon = reservasDelTurno.filter((r) => r.ubicacion !== UBICACIONES.VEREDA);
      const reservasVereda = reservasDelTurno.filter((r) => r.ubicacion === UBICACIONES.VEREDA);

      const cierreGeneral = cierres.find((c) => c.hora === horario.hora && c.sector === null);
      const cierreSalon = cierres.find(
        (c) => c.hora === horario.hora && c.sector === UBICACIONES.ADENTRO
      );
      const cierreVereda = cierres.find(
        (c) => c.hora === horario.hora && c.sector === UBICACIONES.VEREDA
      );

      const ocupadoSalon = reservasSalon.reduce((sum, r) => sum + r.personas, 0);
      const ocupadoVereda = reservasVereda.reduce((sum, r) => sum + r.personas, 0);

      const sector = (
        reservasSector: typeof reservasSalon,
        ocupado: number,
        capacidad: number,
        cierre: (typeof cierres)[number] | undefined
      ) => ({
        capacidad,
        reservado: ocupado,
        libres: Math.max(0, capacidad - ocupado),
        cerrado: !!cierre || !!cierreGeneral,
        cierreId: cierre?.id || cierreGeneral?.id || null,
        motivoCierre: cierre?.motivo || cierreGeneral?.motivo || null,
        reservas: reservasSector.map((r) => ({
          id: r.id,
          nombre: r.nombre,
          apellido: r.apellido,
          personas: r.personas,
          telefono: r.telefono,
          email: r.email,
          comentarios: r.comentarios,
          creadaPorAdmin: r.creadaPorAdmin,
        })),
      });

      return {
        hora: horario.hora,
        pasado: esTurnoPasado(fechaStr, horario.hora),
        salon: sector(reservasSalon, ocupadoSalon, horario.capacidad, cierreSalon),
        vereda: sector(reservasVereda, ocupadoVereda, horario.capacidadVereda, cierreVereda),
      };
    });

    return NextResponse.json({ fecha: fechaStr, dia: diaNombre, turnos });
  } catch (error) {
    console.error('Error en tablero de turnos:', error);
    return NextResponse.json({ error: 'Error al obtener el tablero' }, { status: 500 });
  }
}
