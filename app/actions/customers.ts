'use server';

import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { sendCampaignEmail } from '@/lib/email';
import { MENSAJES } from '@/lib/constants';
import { fechaISOaDate } from '@/lib/fechas';
import {
  type NodoFiltro,
  evaluarSegmento,
  contarSegmento,
  obtenerClientesConCampos,
} from '@/lib/segmentos';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------------------------
// Edición de cliente y consentimiento
// ---------------------------------------------------------------------------

interface UpdateCustomerData {
  nombre?: string;
  apellido?: string | null;
  email?: string | null;
  telefono?: string | null;
  vip?: boolean;
  tags?: string[];
  notas?: string | null;
  fechaNacimiento?: string | null; // 'YYYY-MM-DD' o null para borrar
}

export async function updateCustomer(id: string, data: UpdateCustomerData) {
  try {
    await prisma.customer.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.apellido !== undefined && { apellido: data.apellido || null }),
        ...(data.email !== undefined && {
          email: data.email ? data.email.trim().toLowerCase() : null,
        }),
        ...(data.telefono !== undefined && { telefono: data.telefono || null }),
        ...(data.vip !== undefined && { vip: data.vip }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.notas !== undefined && { notas: data.notas || null }),
        ...(data.fechaNacimiento !== undefined && {
          fechaNacimiento: data.fechaNacimiento ? fechaISOaDate(data.fechaNacimiento) : null,
        }),
      },
    });

    revalidatePath(`/admin/clientes/${id}`);
    revalidatePath('/admin/clientes');
    return { success: true };
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    return { success: false, error: MENSAJES.ERROR_GENERICO };
  }
}

interface ActualizarConsentimientoData {
  customerId: string;
  canal: 'email' | 'whatsapp';
  estado: 'autorizado' | 'revocado';
  fuente?: string;
  metodoObtencion?: string;
  evidencia?: string;
}

// Append-only por diseño: nunca actualiza un ConsentRecord existente, siempre
// crea uno nuevo — así queda la auditoría completa de altas/bajas por canal.
export async function actualizarConsentimiento(data: ActualizarConsentimientoData) {
  try {
    await prisma.consentRecord.create({
      data: {
        customerId: data.customerId,
        canal: data.canal,
        estado: data.estado,
        fuente: data.fuente || 'admin_manual',
        metodoObtencion: data.metodoObtencion || null,
        evidencia: data.evidencia || null,
      },
    });

    revalidatePath(`/admin/clientes/${data.customerId}`);
    return { success: true };
  } catch (error) {
    console.error('Error actualizando consentimiento:', error);
    return { success: false, error: MENSAJES.ERROR_GENERICO };
  }
}

// ---------------------------------------------------------------------------
// Importación de clientes (CSV/Excel)
// ---------------------------------------------------------------------------

const CAMPOS_NUMERICOS = new Set([
  'visitasHistoricas',
  'noShows',
  'cancelacionesHistoricas',
  'eliminacionesHistoricas',
  'gastoPromedio',
]);
const CAMPOS_FECHA = new Set(['ultimaVisitaHistorica', 'primeraVisitaHistorica', 'fechaNacimiento']);

function parsearValorImportado(campo: string, valorCrudo: string | undefined): unknown {
  const valor = (valorCrudo ?? '').trim();
  if (!valor) return null;

  if (CAMPOS_NUMERICOS.has(campo)) {
    const n = Number(valor.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  if (CAMPOS_FECHA.has(campo)) {
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return valor;
}

export interface ImportarClientesInput {
  /** 'importado_excel' | 'importado_woki' | 'importado_bigbox' | 'importado_mozrest' | ... */
  fuente: string;
  nombreArchivo: string;
  /** columna original del archivo -> campo de Customer ('' = ignorar esa columna) */
  columnMapping: Record<string, string>;
  /** filas ya parseadas del archivo: { columnaOriginal: valorCrudo } */
  filas: Record<string, string>[];
  /** 'fusionar' = actualizar si ya existe un cliente con el mismo email/teléfono. */
  duplicados: 'fusionar' | 'crear_nuevo';
}

export type ImportarClientesResultado =
  | {
      success: true;
      importId: string;
      filasTotales: number;
      filasImportadas: number;
      filasConError: number;
      errores: { fila: number; motivo: string }[];
    }
  | { success: false; error: string };

export async function importarClientes(
  input: ImportarClientesInput
): Promise<ImportarClientesResultado> {
  try {
    const mapeo = Object.entries(input.columnMapping).filter(([, campo]) => campo);
    const errores: { fila: number; motivo: string }[] = [];
    let filasImportadas = 0;

    const importLote = await prisma.customerImport.create({
      data: {
        fuente: input.fuente,
        nombreArchivo: input.nombreArchivo,
        columnMapping: input.columnMapping,
        filasTotales: input.filas.length,
        filasImportadas: 0,
        filasConError: 0,
      },
    });

    for (let i = 0; i < input.filas.length; i++) {
      const filaOriginal = input.filas[i];
      const datos: Record<string, unknown> = {};
      for (const [columna, campo] of mapeo) {
        datos[campo] = parsearValorImportado(campo, filaOriginal[columna]);
      }

      const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
      const email =
        typeof datos.email === 'string' && datos.email.trim()
          ? datos.email.trim().toLowerCase()
          : null;
      const telefono =
        typeof datos.telefono === 'string' && datos.telefono.trim()
          ? datos.telefono.trim()
          : null;

      // Fila del Excel viejo sin ningún dato que permita identificar a la
      // persona — no se inventa un nombre, se lista como error.
      if (!nombre && !email && !telefono) {
        errores.push({
          fila: i + 2, // +2: fila 1 es el header del archivo original
          motivo: 'Sin nombre, email ni teléfono — no se puede identificar a la persona',
        });
        continue;
      }

      const dataCustomer = {
        nombre: nombre || email || telefono || 'Sin nombre',
        apellido: typeof datos.apellido === 'string' ? datos.apellido.trim() || null : null,
        email,
        telefono,
        telefonoPais: typeof datos.telefonoPais === 'string' ? datos.telefonoPais.trim() || null : null,
        origen: input.fuente,
        importId: importLote.id,
        visitasHistoricas: (datos.visitasHistoricas as number) ?? 0,
        ultimaVisitaHistorica: (datos.ultimaVisitaHistorica as Date | null) ?? null,
        primeraVisitaHistorica: (datos.primeraVisitaHistorica as Date | null) ?? null,
        gastoPromedio: (datos.gastoPromedio as number | null) ?? null,
        gastoPromedioMoneda:
          typeof datos.gastoPromedioMoneda === 'string' ? datos.gastoPromedioMoneda.trim() || null : null,
        noShows: (datos.noShows as number) ?? 0,
        cancelacionesHistoricas: (datos.cancelacionesHistoricas as number) ?? 0,
        eliminacionesHistoricas: (datos.eliminacionesHistoricas as number) ?? 0,
        notasHistoricas:
          typeof datos.notasHistoricas === 'string' ? datos.notasHistoricas.trim() || null : null,
      };

      try {
        let existente = null;
        if (input.duplicados === 'fusionar') {
          if (email) existente = await prisma.customer.findFirst({ where: { email } });
          if (!existente && telefono) {
            existente = await prisma.customer.findFirst({ where: { telefono } });
          }
        }

        if (existente) {
          // Se actualiza en vez de duplicar: los contadores históricos se
          // refrescan con el dato más nuevo del export; el contacto solo se
          // completa si faltaba, para no pisar algo ya verificado a mano.
          await prisma.customer.update({
            where: { id: existente.id },
            data: {
              telefono: existente.telefono ?? dataCustomer.telefono,
              telefonoPais: existente.telefonoPais ?? dataCustomer.telefonoPais,
              email: existente.email ?? dataCustomer.email,
              visitasHistoricas: dataCustomer.visitasHistoricas,
              ultimaVisitaHistorica: dataCustomer.ultimaVisitaHistorica,
              primeraVisitaHistorica: dataCustomer.primeraVisitaHistorica,
              gastoPromedio: dataCustomer.gastoPromedio,
              gastoPromedioMoneda: dataCustomer.gastoPromedioMoneda,
              noShows: dataCustomer.noShows,
              cancelacionesHistoricas: dataCustomer.cancelacionesHistoricas,
              eliminacionesHistoricas: dataCustomer.eliminacionesHistoricas,
              notasHistoricas: dataCustomer.notasHistoricas ?? existente.notasHistoricas,
            },
          });
        } else {
          await prisma.customer.create({ data: dataCustomer });
        }
        filasImportadas++;
      } catch (rowError) {
        console.error(`Error importando fila ${i + 2}:`, rowError);
        errores.push({ fila: i + 2, motivo: 'Error al guardar la fila' });
      }
    }

    await prisma.customerImport.update({
      where: { id: importLote.id },
      data: {
        filasImportadas,
        filasConError: errores.length,
        errores: errores.length ? (errores as unknown as Prisma.InputJsonValue) : undefined,
      },
    });

    revalidatePath('/admin/clientes');
    return {
      success: true,
      importId: importLote.id,
      filasTotales: input.filas.length,
      filasImportadas,
      filasConError: errores.length,
      errores,
    };
  } catch (error) {
    console.error('Error importando clientes:', error);
    return { success: false, error: MENSAJES.ERROR_GENERICO };
  }
}

// ---------------------------------------------------------------------------
// Segmentos
// ---------------------------------------------------------------------------

export async function crearSegmento(nombre: string, filtro: NodoFiltro, descripcion?: string) {
  try {
    const segmento = await prisma.segment.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        filtro: filtro as unknown as Prisma.InputJsonValue,
      },
    });
    revalidatePath('/admin/clientes/segmentos');
    return { success: true, id: segmento.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'Ya existe un segmento con ese nombre' };
    }
    console.error('Error creando segmento:', error);
    return { success: false, error: MENSAJES.ERROR_GENERICO };
  }
}

export async function actualizarSegmento(
  id: string,
  data: { nombre?: string; descripcion?: string; filtro?: NodoFiltro }
) {
  try {
    await prisma.segment.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion || null }),
        ...(data.filtro !== undefined && { filtro: data.filtro as unknown as Prisma.InputJsonValue }),
      },
    });
    revalidatePath('/admin/clientes/segmentos');
    revalidatePath(`/admin/clientes/segmentos/${id}`);
    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'Ya existe un segmento con ese nombre' };
    }
    console.error('Error actualizando segmento:', error);
    return { success: false, error: MENSAJES.ERROR_GENERICO };
  }
}

export async function eliminarSegmento(id: string) {
  try {
    await prisma.segment.delete({ where: { id } });
    revalidatePath('/admin/clientes/segmentos');
    return { success: true };
  } catch (error) {
    console.error('Error eliminando segmento:', error);
    return { success: false, error: MENSAJES.ERROR_GENERICO };
  }
}

type ResultadoConteo = { success: true; total: number } | { success: false; error: string };

/** Vista previa en vivo del conteo mientras se arma un filtro (aún no guardado). */
export async function previsualizarSegmento(filtro: NodoFiltro): Promise<ResultadoConteo> {
  try {
    const total = await contarSegmento(filtro);
    return { success: true, total };
  } catch (error) {
    console.error('Error previsualizando segmento:', error);
    return { success: false, error: MENSAJES.ERROR_GENERICO };
  }
}

/** Destinatarios elegibles de email de un segmento ya guardado (segmento ∩ consentimiento autorizado). */
export async function contarDestinatariosEmailDeSegmento(segmentId: string): Promise<ResultadoConteo> {
  try {
    const segmento = await prisma.segment.findUnique({ where: { id: segmentId } });
    if (!segmento) return { success: false, error: 'Segmento no encontrado' };

    const filtro = segmento.filtro as unknown as NodoFiltro;
    const todos = await obtenerClientesConCampos();
    const total = todos.filter(
      ({ cliente, campos }) =>
        evaluarSegmento(filtro, campos) && campos.consentimiento.email === 'autorizado' && !!cliente.email
    ).length;

    return { success: true, total };
  } catch (error) {
    console.error('Error contando destinatarios:', error);
    return { success: false, error: MENSAJES.ERROR_GENERICO };
  }
}

// ---------------------------------------------------------------------------
// Mailing (fase 1: envío manual real a un segmento)
// ---------------------------------------------------------------------------

function textoAHtml(texto: string): string {
  const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return texto
    .split(/\n{2,}/)
    .map((parrafo) => `<p style="margin:0 0 16px 0;">${escapar(parrafo).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

type ResultadoEnvioCampania =
  | { success: true; destinatarios: number; enviados: number; fallidos: number }
  | { success: false; error: string };

export async function enviarCampaniaEmail(input: {
  segmentId: string;
  asunto: string;
  cuerpoTexto: string;
  enviadoPor?: string;
}): Promise<ResultadoEnvioCampania> {
  try {
    const segmento = await prisma.segment.findUnique({ where: { id: input.segmentId } });
    if (!segmento) return { success: false, error: 'Segmento no encontrado' };

    const filtro = segmento.filtro as unknown as NodoFiltro;
    const todos = await obtenerClientesConCampos();
    // El filtro de consentimiento se aplica siempre como piso de cualquier
    // envío de email, no hace falta agregarlo a mano en cada segmento.
    const destinatarios = todos.filter(
      ({ cliente, campos }) =>
        evaluarSegmento(filtro, campos) && campos.consentimiento.email === 'autorizado' && !!cliente.email
    );

    const cuerpoHtml = textoAHtml(input.cuerpoTexto);
    let enviados = 0;
    let fallidos = 0;

    // Uno por uno, con manejo de error individual: si uno falla no aborta el resto.
    for (const { cliente } of destinatarios) {
      const ok = await sendCampaignEmail(cliente.email!, input.asunto, cuerpoHtml, input.cuerpoTexto);
      if (ok) enviados++;
      else fallidos++;
    }

    await prisma.emailCampaignLog.create({
      data: {
        segmentId: segmento.id,
        segmentNombre: segmento.nombre,
        asunto: input.asunto,
        cuerpoHtml,
        destinatarios: destinatarios.length,
        enviados,
        fallidos,
        enviadoPor: input.enviadoPor || null,
      },
    });

    revalidatePath(`/admin/clientes/segmentos/${segmento.id}/enviar`);
    return { success: true, destinatarios: destinatarios.length, enviados, fallidos };
  } catch (error) {
    console.error('Error enviando campaña de email:', error);
    return { success: false, error: MENSAJES.ERROR_GENERICO };
  }
}
