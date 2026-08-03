import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { fechaISOaDate, hoyEnBA } from '@/lib/fechas';
import { ESTADOS_RESERVA } from '@/lib/constants';

export type Operador = 'AND' | 'OR';
export type OperadorCondicion = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'contiene';

export interface Condicion {
  campo: string;
  op: OperadorCondicion;
  valor: unknown;
}

export interface NodoFiltro {
  operador: Operador;
  condiciones: (Condicion | NodoFiltro)[];
}

function esNodo(x: Condicion | NodoFiltro): x is NodoFiltro {
  return 'operador' in x && 'condiciones' in x;
}

// Estado de consentimiento por canal, calculado del ConsentRecord más
// reciente — nunca se persiste un "estado actual", siempre se deriva.
export type EstadoConsentimiento = 'autorizado' | 'revocado' | 'nunca_solicitado';

export interface CamposCliente {
  origen: string;
  visitasTotales: number;
  diasDesdeUltimaVisita: number | null;
  noShows: number;
  cancelacionesHistoricas: number;
  vip: boolean;
  tags: string[];
  consentimiento: {
    email: EstadoConsentimiento;
    whatsapp: EstadoConsentimiento;
  };
  tieneProximaReserva: boolean;
  cumpleañosEsteMes: boolean;
}

export const CUSTOMER_INCLUDE_PARA_SEGMENTOS = {
  reservas: true,
  consentimientos: true,
} satisfies Prisma.CustomerInclude;

export type ClienteConRelaciones = Prisma.CustomerGetPayload<{
  include: typeof CUSTOMER_INCLUDE_PARA_SEGMENTOS;
}>;

function estadoConsentimientoActual(
  consentimientos: ClienteConRelaciones['consentimientos'],
  canal: string
): EstadoConsentimiento {
  const delCanal = consentimientos
    .filter((c) => c.canal === canal)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return (delCanal[0]?.estado as EstadoConsentimiento) ?? 'nunca_solicitado';
}

/** Calcula los campos derivados de un cliente contra "hoy" en hora de Buenos Aires. */
export function calcularCamposCliente(cliente: ClienteConRelaciones): CamposCliente {
  const hoy = fechaISOaDate(hoyEnBA());
  const reservasActivas = cliente.reservas.filter((r) => r.estado !== ESTADOS_RESERVA.CANCELADA);

  const visitasTotales = cliente.visitasHistoricas + reservasActivas.length;

  const fechasVisita = [
    ...reservasActivas.map((r) => r.fecha),
    ...(cliente.ultimaVisitaHistorica ? [cliente.ultimaVisitaHistorica] : []),
  ];
  const ultimaVisita =
    fechasVisita.length > 0
      ? new Date(Math.max(...fechasVisita.map((f) => f.getTime())))
      : null;
  const diasDesdeUltimaVisita = ultimaVisita
    ? Math.floor((hoy.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const tieneProximaReserva = reservasActivas.some((r) => r.fecha.getTime() >= hoy.getTime());

  let cumpleañosEsteMes = false;
  if (cliente.fechaNacimiento) {
    cumpleañosEsteMes = cliente.fechaNacimiento.getUTCMonth() === hoy.getUTCMonth();
  }

  return {
    origen: cliente.origen,
    visitasTotales,
    diasDesdeUltimaVisita,
    noShows: cliente.noShows,
    cancelacionesHistoricas: cliente.cancelacionesHistoricas,
    vip: cliente.vip,
    tags: cliente.tags,
    consentimiento: {
      email: estadoConsentimientoActual(cliente.consentimientos, 'email'),
      whatsapp: estadoConsentimientoActual(cliente.consentimientos, 'whatsapp'),
    },
    tieneProximaReserva,
    cumpleañosEsteMes,
  };
}

function obtenerValorCampo(campo: string, campos: CamposCliente): unknown {
  if (campo === 'consentimiento.email') return campos.consentimiento.email;
  if (campo === 'consentimiento.whatsapp') return campos.consentimiento.whatsapp;
  return (campos as unknown as Record<string, unknown>)[campo];
}

function evaluarCondicion(cond: Condicion, campos: CamposCliente): boolean {
  const valorCampo = obtenerValorCampo(cond.campo, campos);

  switch (cond.op) {
    case '=':
      return valorCampo === cond.valor;
    case '!=':
      return valorCampo !== cond.valor;
    case '>':
      return typeof valorCampo === 'number' && valorCampo > (cond.valor as number);
    case '>=':
      return typeof valorCampo === 'number' && valorCampo >= (cond.valor as number);
    case '<':
      return typeof valorCampo === 'number' && valorCampo < (cond.valor as number);
    case '<=':
      return typeof valorCampo === 'number' && valorCampo <= (cond.valor as number);
    case 'in':
      return Array.isArray(cond.valor) && (cond.valor as unknown[]).includes(valorCampo);
    case 'contiene':
      return Array.isArray(valorCampo) && valorCampo.includes(cond.valor);
    default:
      return false;
  }
}

/** Evalúa el árbol de condiciones AND/OR de un segmento contra un cliente. */
export function evaluarSegmento(filtro: NodoFiltro, campos: CamposCliente): boolean {
  const resultados = filtro.condiciones.map((c) =>
    esNodo(c) ? evaluarSegmento(c, campos) : evaluarCondicion(c, campos)
  );
  return filtro.operador === 'AND' ? resultados.every(Boolean) : resultados.some(Boolean);
}

/**
 * Trae todos los clientes con sus campos derivados ya calculados.
 * Para volúmenes chicos/medianos (miles, no millones) evaluar en memoria
 * es más simple y mantenible que traducir el árbol de filtro a SQL dinámico.
 */
export async function obtenerClientesConCampos(): Promise<
  { cliente: ClienteConRelaciones; campos: CamposCliente }[]
> {
  const clientes = await prisma.customer.findMany({
    include: CUSTOMER_INCLUDE_PARA_SEGMENTOS,
  });
  return clientes.map((cliente) => ({ cliente, campos: calcularCamposCliente(cliente) }));
}

/** Clientes que matchean un segmento (filtro completo evaluado en memoria). */
export async function obtenerClientesDeSegmento(filtro: NodoFiltro) {
  const todos = await obtenerClientesConCampos();
  return todos.filter(({ campos }) => evaluarSegmento(filtro, campos));
}

/** Cuenta rápida de cuántos clientes matchean un filtro (para previsualizar). */
export async function contarSegmento(filtro: NodoFiltro): Promise<number> {
  const matches = await obtenerClientesDeSegmento(filtro);
  return matches.length;
}

export type CampoSegmento = {
  campo: string;
  label: string;
  tipo: 'texto' | 'numero' | 'booleano' | 'select' | 'tags';
  ops: OperadorCondicion[];
  opciones?: string[];
};

// Metadata para construir el UI del constructor de segmentos (selects de
// campo/operador/valor) sin hardcodear esta lista en cada página.
export const CAMPOS_SEGMENTO: CampoSegmento[] = [
  {
    campo: 'origen',
    label: 'Origen',
    tipo: 'select',
    ops: ['=', 'in'],
    opciones: [
      'web',
      'admin',
      'importado_excel',
      'importado_woki',
      'importado_bigbox',
      'importado_mozrest',
      'instagram',
      'facebook',
    ],
  },
  { campo: 'visitasTotales', label: 'Visitas totales', tipo: 'numero', ops: ['=', '!=', '>', '>=', '<', '<='] },
  {
    campo: 'diasDesdeUltimaVisita',
    label: 'Días desde la última visita',
    tipo: 'numero',
    ops: ['=', '!=', '>', '>=', '<', '<='],
  },
  { campo: 'noShows', label: 'No-shows', tipo: 'numero', ops: ['=', '!=', '>', '>=', '<', '<='] },
  {
    campo: 'cancelacionesHistoricas',
    label: 'Cancelaciones históricas',
    tipo: 'numero',
    ops: ['=', '!=', '>', '>=', '<', '<='],
  },
  { campo: 'vip', label: 'VIP', tipo: 'booleano', ops: ['='] },
  { campo: 'tags', label: 'Tags', tipo: 'tags', ops: ['contiene'] },
  {
    campo: 'consentimiento.email',
    label: 'Consentimiento de email',
    tipo: 'select',
    ops: ['='],
    opciones: ['autorizado', 'revocado', 'nunca_solicitado'],
  },
  {
    campo: 'consentimiento.whatsapp',
    label: 'Consentimiento de WhatsApp',
    tipo: 'select',
    ops: ['='],
    opciones: ['autorizado', 'revocado', 'nunca_solicitado'],
  },
  { campo: 'tieneProximaReserva', label: 'Tiene próxima reserva', tipo: 'booleano', ops: ['='] },
  { campo: 'cumpleañosEsteMes', label: 'Cumpleaños este mes', tipo: 'booleano', ops: ['='] },
];
