import { createHmac, timingSafeEqual } from 'node:crypto';
import prisma from '@/lib/db';
import { CONTACTO } from '@/lib/constants';
import { type NodoFiltro, evaluarSegmento, obtenerClientesConCampos } from '@/lib/segmentos';
import { personalizar, primerNombre } from '@/lib/textoMarketing';

export { personalizar, primerNombre };

// ---------------------------------------------------------------------------
// Límites
// ---------------------------------------------------------------------------

/**
 * Gmail gratis permite 500 mails por día y esa casilla también manda las
 * confirmaciones de reservas y pedidos. Marketing usa 400 y deja 100 de margen
 * para que un envío grande nunca deje a un cliente sin su confirmación.
 */
export const LIMITE_MARKETING_DIARIO = 400;

/** Mails por llamada de envío: corto para que ninguna request se acerque al timeout. */
export const TAMANIO_TANDA = 20;

export const TIPOS_CAMPANIA = { CAMPANIA: 'campania', INVITACION: 'invitacion' } as const;
export type TipoCampania = (typeof TIPOS_CAMPANIA)[keyof typeof TIPOS_CAMPANIA];

export const ESTADOS_CAMPANIA = { BORRADOR: 'borrador', ENVIANDO: 'enviando', ENVIADA: 'enviada' } as const;

// ---------------------------------------------------------------------------
// Links firmados (baja y suscripción)
// ---------------------------------------------------------------------------

function secreto(): string {
  const s = process.env.MARKETING_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error('Falta MARKETING_SECRET o ADMIN_SESSION_SECRET para firmar los links de los mails.');
  return s;
}

/**
 * Los links de baja y suscripción van firmados: sin la firma, cualquiera podría
 * dar de baja (o suscribir) a otro cliente cambiando el id en la URL.
 */
export function firmar(customerId: string, accion: 'baja' | 'suscribir'): string {
  return createHmac('sha256', secreto()).update(`${accion}:${customerId}`).digest('hex').slice(0, 32);
}

export function firmaValida(customerId: string, accion: 'baja' | 'suscribir', firma: string | null): boolean {
  if (!customerId || !firma) return false;
  const esperada = Buffer.from(firmar(customerId, accion));
  const recibida = Buffer.from(firma);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

function urlPublica(ruta: string): string {
  return new URL(ruta, CONTACTO.SITIO).toString();
}

/** Link visible en el pie del mail: abre una página que pide confirmar la baja. */
export function linkBaja(customerId: string): string {
  return urlPublica(`/mail/baja?c=${customerId}&t=${firmar(customerId, 'baja')}`);
}

/**
 * Link del encabezado List-Unsubscribe. Gmail le hace POST directo (baja en un
 * click desde su propio botón), así que apunta al endpoint, no a la página.
 * Un GET nunca da de baja: los antivirus de mail abren todos los links.
 */
export function linkBajaUnClick(customerId: string): string {
  return urlPublica(`/api/mail/baja?c=${customerId}&t=${firmar(customerId, 'baja')}`);
}

export function linkSuscribir(customerId: string, campaniaId: string): string {
  return urlPublica(`/mail/suscribir?c=${customerId}&t=${firmar(customerId, 'suscribir')}&k=${campaniaId}`);
}

// ---------------------------------------------------------------------------
// Contenido del mail
// ---------------------------------------------------------------------------

function escapar(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


/**
 * Texto del admin -> HTML del mail. Admite párrafos (línea en blanco),
 * **negrita** y links pegados tal cual. Todo lo demás se escapa.
 */
export function textoAHtml(texto: string): string {
  return texto
    .trim()
    .split(/\n{2,}/)
    .map((parrafo) => {
      const html = escapar(parrafo)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(
          /(https?:\/\/[^\s<]+)/g,
          '<a href="$1" target="_blank" style="color:#7a2233;text-decoration:underline;">$1</a>'
        )
        .replace(/\n/g, '<br>');
      return `<p style="margin:0 0 16px 0;">${html}</p>`;
    })
    .join('');
}

function botonHtml(href: string, texto: string, fondo = '#171310', color = '#c9a961'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 24px auto;">
      <tr>
        <td align="center" bgcolor="${fondo}" style="border-radius:6px;">
          <a href="${escapar(href)}" target="_blank"
             style="display:inline-block;padding:15px 30px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;color:${color};text-decoration:none;border-radius:6px;">
            ${escapar(texto)}
          </a>
        </td>
      </tr>
    </table>`;
}

export interface ContenidoCampania {
  tipo: string;
  asunto: string;
  cuerpoTexto: string;
  botonTexto?: string | null;
  botonUrl?: string | null;
}

export const TITULO_MAIL: Record<string, string> = {
  [TIPOS_CAMPANIA.CAMPANIA]: 'Novedades',
  [TIPOS_CAMPANIA.INVITACION]: 'Seguimos en contacto',
};

/** Arma asunto, cuerpo HTML y cuerpo de texto para un destinatario concreto. */
export function armarMail(
  campania: ContenidoCampania,
  destinatario: { nombre: string | null; customerId: string },
  campaniaId: string
) {
  const nombre = primerNombre(destinatario.nombre);
  const cuerpo = personalizar(campania.cuerpoTexto, nombre);
  const asunto = personalizar(campania.asunto, nombre);

  let cuerpoHtml = textoAHtml(cuerpo);
  let cuerpoTexto = cuerpo;

  if (campania.tipo === TIPOS_CAMPANIA.INVITACION) {
    const link = linkSuscribir(destinatario.customerId, campaniaId);
    cuerpoHtml += botonHtml(link, 'Sí, quiero recibir novedades');
    cuerpoTexto += `\n\nPara recibir novedades: ${link}`;
  } else if (campania.botonTexto?.trim() && campania.botonUrl?.trim()) {
    cuerpoHtml += botonHtml(campania.botonUrl.trim(), campania.botonTexto.trim());
    cuerpoTexto += `\n\n${campania.botonTexto.trim()}: ${campania.botonUrl.trim()}`;
  }

  return {
    asunto,
    titulo: TITULO_MAIL[campania.tipo] ?? 'Novedades',
    cuerpoHtml,
    cuerpoTexto,
    linkBaja: linkBaja(destinatario.customerId),
    linkBajaUnClick: linkBajaUnClick(destinatario.customerId),
  };
}

// ---------------------------------------------------------------------------
// Destinatarios
// ---------------------------------------------------------------------------

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailValido(email: string | null | undefined): email is string {
  return !!email && EMAIL_VALIDO.test(email.trim());
}

export interface Destinatario {
  customerId: string;
  email: string;
  nombre: string | null;
}

/** Último estado de consentimiento de email por cliente, en una sola consulta. */
async function clientesConConsentimientoEmail() {
  const clientes = await prisma.customer.findMany({
    select: {
      id: true,
      nombre: true,
      email: true,
      consentimientos: {
        where: { canal: 'email' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { estado: true },
      },
    },
  });

  return clientes.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    email: c.email?.trim().toLowerCase() ?? null,
    consentimiento: (c.consentimientos[0]?.estado ?? 'nunca_solicitado') as
      | 'autorizado'
      | 'revocado'
      | 'nunca_solicitado',
  }));
}

/** Una sola persona por email: en la base hay clientes repetidos con el mismo mail. */
function unoPorEmail(lista: Destinatario[]): Destinatario[] {
  const vistos = new Set<string>();
  return lista.filter((d) => {
    if (vistos.has(d.email)) return false;
    vistos.add(d.email);
    return true;
  });
}

export async function calcularDestinatarios(opciones: {
  tipo: string;
  segmentId?: string | null;
}): Promise<Destinatario[]> {
  const clientes = await clientesConConsentimientoEmail();

  if (opciones.tipo === TIPOS_CAMPANIA.INVITACION) {
    // Un email que ya decidió algo (sí o no) en cualquiera de sus fichas no se invita.
    const emailsConDecision = new Set(
      clientes.filter((c) => c.email && c.consentimiento !== 'nunca_solicitado').map((c) => c.email!)
    );

    // La invitación es única: quien ya la recibió (o la tiene en cola) no entra de nuevo.
    const yaInvitados = new Set(
      (
        await prisma.envioCampania.findMany({
          where: { campania: { tipo: TIPOS_CAMPANIA.INVITACION } },
          select: { customerId: true, email: true },
        })
      ).flatMap((e) => [e.customerId, e.email.toLowerCase()])
    );

    return unoPorEmail(
      clientes
        .filter(
          (c) =>
            c.consentimiento === 'nunca_solicitado' &&
            emailValido(c.email) &&
            !emailsConDecision.has(c.email!) &&
            !yaInvitados.has(c.id) &&
            !yaInvitados.has(c.email!)
        )
        .map((c) => ({ customerId: c.id, email: c.email!, nombre: c.nombre }))
    );
  }

  // Campaña normal: siempre solo a quien autorizó, sin excepción.
  let autorizados = clientes.filter((c) => c.consentimiento === 'autorizado' && emailValido(c.email));

  if (opciones.segmentId) {
    const segmento = await prisma.segment.findUnique({ where: { id: opciones.segmentId } });
    if (!segmento) throw new Error('El segmento ya no existe.');
    const filtro = segmento.filtro as unknown as NodoFiltro;
    const delSegmento = new Set(
      (await obtenerClientesConCampos())
        .filter(({ campos }) => evaluarSegmento(filtro, campos))
        .map(({ cliente }) => cliente.id)
    );
    autorizados = autorizados.filter((c) => delSegmento.has(c.id));
  }

  // Un email dado de baja en alguna de sus fichas no recibe, aunque otra ficha diga que sí.
  const emailsDadosDeBaja = new Set(
    clientes.filter((c) => c.email && c.consentimiento === 'revocado').map((c) => c.email!)
  );

  return unoPorEmail(
    autorizados
      .filter((c) => !emailsDadosDeBaja.has(c.email!))
      .map((c) => ({ customerId: c.id, email: c.email!, nombre: c.nombre }))
  );
}

// ---------------------------------------------------------------------------
// Números de la sección
// ---------------------------------------------------------------------------

export async function enviadosUltimas24h(): Promise<number> {
  return prisma.envioCampania.count({
    where: { estado: 'enviado', enviadoEn: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
}

export async function resumenAudiencia() {
  const clientes = await clientesConConsentimientoEmail();
  const conEmail = clientes.filter((c) => emailValido(c.email));
  const invitables = await calcularDestinatarios({ tipo: TIPOS_CAMPANIA.INVITACION });
  const enviadosHoy = await enviadosUltimas24h();

  return {
    clientes: clientes.length,
    conEmail: new Set(conEmail.map((c) => c.email)).size,
    suscriptos: new Set(conEmail.filter((c) => c.consentimiento === 'autorizado').map((c) => c.email)).size,
    dadosDeBaja: new Set(conEmail.filter((c) => c.consentimiento === 'revocado').map((c) => c.email)).size,
    invitables: invitables.length,
    enviadosHoy,
    cupoRestanteHoy: Math.max(0, LIMITE_MARKETING_DIARIO - enviadosHoy),
  };
}

// ---------------------------------------------------------------------------
// Decisiones del cliente desde el mail
// ---------------------------------------------------------------------------

export async function estadoEmailDe(customerId: string) {
  const ultimo = await prisma.consentRecord.findFirst({
    where: { customerId, canal: 'email' },
    orderBy: { createdAt: 'desc' },
    select: { estado: true },
  });
  return (ultimo?.estado ?? 'nunca_solicitado') as 'autorizado' | 'revocado' | 'nunca_solicitado';
}

/**
 * Deja asentada la baja o la suscripción. El historial de consentimientos es
 * append-only (ver ConsentRecord): nunca se pisa, se agrega una fila.
 * Si el estado ya es ese, no se repite el registro.
 */
export async function registrarDecisionEmail(opciones: {
  customerId: string;
  estado: 'autorizado' | 'revocado';
  fuente: string;
  metodoObtencion: string;
  evidencia?: string | null;
}): Promise<'registrado' | 'sin_cambios' | 'cliente_inexistente'> {
  const existe = await prisma.customer.findUnique({ where: { id: opciones.customerId }, select: { id: true } });
  if (!existe) return 'cliente_inexistente';
  if ((await estadoEmailDe(opciones.customerId)) === opciones.estado) return 'sin_cambios';

  await prisma.consentRecord.create({
    data: {
      customerId: opciones.customerId,
      canal: 'email',
      estado: opciones.estado,
      fuente: opciones.fuente,
      metodoObtencion: opciones.metodoObtencion,
      evidencia: opciones.evidencia ?? null,
    },
  });
  return 'registrado';
}
