// Todo el sistema razona en hora de Buenos Aires, sin importar dónde corra el
// servidor (Railway usa UTC). Las fechas se guardan siempre como medianoche UTC
// del día reservado, así que "2026-07-23" es el mismo día en la base y en la UI.

export const TZ_AR = 'America/Argentina/Buenos_Aires';

const fmtFecha = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ_AR,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const fmtHora = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ_AR,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Hoy en Buenos Aires, como 'YYYY-MM-DD'. */
export function hoyEnBA(): string {
  return fmtFecha.format(new Date());
}

/** Hora actual en Buenos Aires, como 'HH:mm'. */
export function horaActualEnBA(): string {
  return fmtHora.format(new Date());
}

/** 'YYYY-MM-DD' → Date en medianoche UTC (formato canónico de guardado). */
export function fechaISOaDate(fechaISO: string): Date {
  return new Date(`${fechaISO}T00:00:00.000Z`);
}

/** Date guardado → 'YYYY-MM-DD' (se lee en UTC porque así se guardó). */
export function dateAFechaISO(fecha: Date): string {
  return fecha.toISOString().split('T')[0];
}

/** Suma (o resta) días a un 'YYYY-MM-DD' y devuelve otro 'YYYY-MM-DD'. */
export function sumarDias(fechaISO: string, dias: number): string {
  const d = fechaISOaDate(fechaISO);
  d.setUTCDate(d.getUTCDate() + dias);
  return dateAFechaISO(d);
}

/** Día de la semana en minúsculas ('lunes', 'sábado', ...) de un 'YYYY-MM-DD'. */
export function diaSemanaDe(fechaISO: string): string {
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return dias[fechaISOaDate(fechaISO).getUTCDay()];
}

/**
 * ¿Ese turno ya pasó, en hora de Buenos Aires?
 * Como fecha y hora son strings de ancho fijo, alcanza con compararlos.
 */
export function esTurnoPasado(fechaISO: string, hora: string): boolean {
  return `${fechaISO} ${hora}` < `${hoyEnBA()} ${horaActualEnBA()}`;
}

/** ¿La fecha es anterior a hoy en Buenos Aires? (ignora la hora) */
export function esFechaPasada(fechaISO: string): boolean {
  return fechaISO < hoyEnBA();
}

/** 'YYYY-MM-DD' → 'jueves 23 de julio de 2026'. */
export function formatearFechaLarga(fechaISO: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'UTC', // la fecha ya es medianoche UTC del día correcto
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fechaISOaDate(fechaISO));
}

/** 'YYYY-MM-DD' → '23/07/2026'. */
export function formatearFechaCorta(fechaISO: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(fechaISOaDate(fechaISO));
}
