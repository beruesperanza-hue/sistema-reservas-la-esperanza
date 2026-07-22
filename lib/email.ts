import { google } from 'googleapis';
import { CONTACTO } from '@/lib/constants';

// Gmail API vía OAuth2 (usa HTTPS, no SMTP → funciona en Railway).
// Manda los correos desde la casilla real del restaurante.
const FROM = process.env.EMAIL_FROM || 'eventoslaesperanza@gmail.com';

const LOGO_URL = `${CONTACTO.SITIO}/logo-esperanza.png`;
const WHATSAPP_URL = `${CONTACTO.WHATSAPP_URL}?text=${encodeURIComponent(
  'Hola! Te escribo por mi reserva en La Esperanza.'
)}`;

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);
oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// Codifica el asunto para soportar acentos/ñ (MIME encoded-word).
function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;
}

// base64 en líneas de 76 caracteres, como pide el RFC 2045.
function base64Body(text: string): string {
  return (Buffer.from(text, 'utf-8').toString('base64').match(/.{1,76}/g) || []).join('\r\n');
}

// Arma un MIME multipart/alternative (texto plano + HTML) en base64url.
function buildRawMessage(to: string, subject: string, html: string, text: string): string {
  const boundary = `laespe_${Date.now().toString(36)}`;

  const message = [
    `From: La Esperanza de los Ascurra <${FROM}>`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body(text),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body(html),
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function enviarMail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  try {
    console.log('🔧 ENVIANDO EMAIL CON GMAIL API A:', to);
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: buildRawMessage(to, subject, html, text) },
    });
    console.log('✅ EMAIL ENVIADO EXITOSAMENTE A:', to, '- id:', res.data.id);
    return true;
  } catch (error) {
    console.error('❌ ERROR AL ENVIAR EMAIL:', error);
    return false;
  }
}

// Botón "bulletproof" (tabla en vez de <a> con padding) para que se vea igual en Outlook.
function boton(href: string, label: string, bg: string, color = '#ffffff'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td align="center" bgcolor="${bg}" style="border-radius:6px;">
          <a href="${href}" target="_blank"
             style="display:inline-block;padding:14px 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:bold;color:${color};text-decoration:none;border-radius:6px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

// Layout compartido por todos los mails: header con logo + contenido + footer.
function layout(preheader: string, titulo: string, contenido: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background-color:#f2f2f0;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f2f0;">
    <tr>
      <td align="center" style="padding:24px 12px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="width:100%;max-width:600px;background-color:#ffffff;border-radius:10px;overflow:hidden;">

          <!-- Header con el logo -->
          <tr>
            <td align="center" style="background-color:#ffffff;padding:32px 24px 24px 24px;">
              <a href="${CONTACTO.SITIO}" target="_blank">
                <img src="${LOGO_URL}" width="300" alt="La Esperanza de los Ascurra — Desde 2011"
                     style="display:block;width:100%;max-width:300px;height:auto;border:0;">
              </a>
            </td>
          </tr>

          <!-- Banda con el título -->
          <tr>
            <td align="center" style="background-color:#0f2235;padding:16px 24px;">
              <h1 style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:18px;line-height:24px;letter-spacing:2px;text-transform:uppercase;color:#d4af37;font-weight:bold;">
                ${titulo}
              </h1>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding:32px 32px 8px 32px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:24px;color:#2b2b2b;">
              ${contenido}
            </td>
          </tr>

          <!-- Accesos rápidos -->
          <tr>
            <td style="padding:8px 32px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    ${boton(WHATSAPP_URL, '💬 Escribinos por WhatsApp', '#25D366')}
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    ${boton(CONTACTO.MAPS_URL, '📍 Cómo llegar', '#0f2235')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0f2235;padding:28px 32px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#d4dde8;" align="center">
              <p style="margin:0 0 6px 0;">
                <a href="${CONTACTO.MAPS_URL}" target="_blank" style="color:#ffffff;text-decoration:underline;">
                  ${CONTACTO.DIRECCION}
                </a>
              </p>
              <p style="margin:0 0 6px 0;">
                WhatsApp:
                <a href="${WHATSAPP_URL}" target="_blank" style="color:#ffffff;text-decoration:underline;">
                  ${CONTACTO.TELEFONO}
                </a>
              </p>
              <p style="margin:0 0 6px 0;">
                <a href="${CONTACTO.INSTAGRAM}" target="_blank" style="color:#ffffff;text-decoration:underline;">
                  ${CONTACTO.INSTAGRAM_USER}
                </a>
                &nbsp;·&nbsp;
                <a href="${CONTACTO.SITIO}" target="_blank" style="color:#ffffff;text-decoration:underline;">
                  Ver el sitio
                </a>
              </p>
              <p style="margin:16px 0 0 0;font-size:11px;color:#8fa8c9;">
                La Esperanza de los Ascurra · Desde 2011
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Pie de los mails en texto plano (mismos datos que el footer HTML).
const PIE_TEXTO = [
  `WhatsApp: ${CONTACTO.TELEFONO} → ${WHATSAPP_URL}`,
  `Cómo llegar: ${CONTACTO.MAPS_URL}`,
  `Dirección: ${CONTACTO.DIRECCION}`,
  `Instagram: ${CONTACTO.INSTAGRAM_USER}`,
  '',
  'La Esperanza de los Ascurra · Desde 2011',
].join('\n');

export async function sendReservationConfirmation(
  email: string,
  nombre: string,
  fecha: string,
  hora: string,
  personas: number,
  telefono: string
) {
  const fila = (label: string, valor: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e8ecf5;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#6b7c8f;">${label}</td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid #e8ecf5;font-family:Helvetica,Arial,sans-serif;font-size:16px;color:#0f2235;font-weight:bold;">${valor}</td>
    </tr>`;

  const contenido = `
    <p style="margin:0 0 16px 0;">Hola <strong>${nombre}</strong>,</p>
    <p style="margin:0 0 24px 0;">¡Tu mesa quedó reservada! Estos son los datos:</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      ${fila('Fecha', fecha)}
      ${fila('Hora', hora)}
      ${fila('Personas', String(personas))}
      ${fila('Teléfono', telefono)}
    </table>

    <p style="margin:0 0 8px 0;">Si necesitás cambiar o cancelar la reserva, escribinos por WhatsApp y lo resolvemos al toque.</p>
    <p style="margin:0 0 8px 0;">¡Te esperamos! 🌟</p>
  `;

  const texto = [
    `Hola ${nombre},`,
    '',
    '¡Tu reserva en La Esperanza de los Ascurra está confirmada!',
    '',
    `Fecha: ${fecha}`,
    `Hora: ${hora}`,
    `Personas: ${personas}`,
    `Teléfono: ${telefono}`,
    '',
    'Si necesitás cambiar o cancelar la reserva, escribinos por WhatsApp.',
    '',
    PIE_TEXTO,
  ].join('\n');

  return enviarMail(
    email,
    'Confirmación de tu reserva en La Esperanza',
    layout(
      `Reserva confirmada para el ${fecha} a las ${hora}.`,
      'Reserva confirmada',
      contenido
    ),
    texto
  );
}

export async function sendReservationCancellation(email: string, nombre?: string) {
  const saludo = nombre ? `Hola <strong>${nombre}</strong>,` : 'Hola,';

  const contenido = `
    <p style="margin:0 0 16px 0;">${saludo}</p>
    <p style="margin:0 0 16px 0;">Tu reserva en La Esperanza fue cancelada.</p>
    <p style="margin:0 0 8px 0;">Si fue un error o querés reservar para otro día, escribinos por WhatsApp o entrá al sitio y elegí un nuevo horario.</p>
    <p style="margin:0 0 8px 0;">¡Nos vemos pronto!</p>
  `;

  const texto = [
    nombre ? `Hola ${nombre},` : 'Hola,',
    '',
    'Tu reserva en La Esperanza fue cancelada.',
    'Si fue un error o querés reservar para otro día, escribinos por WhatsApp.',
    '',
    PIE_TEXTO,
  ].join('\n');

  return enviarMail(
    email,
    'Cancelación de tu reserva en La Esperanza',
    layout('Tu reserva fue cancelada.', 'Reserva cancelada', contenido),
    texto
  );
}

export async function sendReservationEmail(email: string, reservationDetails: any) {
  return sendReservationConfirmation(
    email,
    reservationDetails.nombre,
    reservationDetails.fecha,
    reservationDetails.hora,
    reservationDetails.personas,
    reservationDetails.telefono
  );
}

export async function sendConfirmationEmail(email: string, details: any) {
  return sendReservationConfirmation(
    email,
    details.nombre,
    details.fecha,
    details.hora,
    details.personas,
    details.telefono
  );
}
