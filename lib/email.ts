import { google } from 'googleapis';

// Gmail API vía OAuth2 (usa HTTPS, no SMTP → funciona en Railway).
// Manda los correos desde la casilla real del restaurante.
const FROM = process.env.EMAIL_FROM || 'eventoslaesperanza@gmail.com';

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

// Arma el mensaje MIME y lo codifica en base64url para la Gmail API.
function buildRawMessage(to: string, subject: string, html: string): string {
  const message = [
    `From: La Esperanza <${FROM}>`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
  ].join('\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function enviarMail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    console.log('🔧 ENVIANDO EMAIL CON GMAIL API A:', to);
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: buildRawMessage(to, subject, html) },
    });
    console.log('✅ EMAIL ENVIADO EXITOSAMENTE A:', to, '- id:', res.data.id);
    return true;
  } catch (error) {
    console.error('❌ ERROR AL ENVIAR EMAIL:', error);
    return false;
  }
}

export async function sendReservationConfirmation(
  email: string,
  nombre: string,
  fecha: string,
  hora: string,
  personas: number,
  telefono: string
) {
  const html = `
    <h2>¡Reserva confirmada!</h2>
    <p>Hola ${nombre},</p>
    <p>Tu reserva en La Esperanza ha sido confirmada con los siguientes detalles:</p>
    <ul>
      <li><strong>Fecha:</strong> ${fecha}</li>
      <li><strong>Hora:</strong> ${hora}</li>
      <li><strong>Personas:</strong> ${personas}</li>
      <li><strong>Teléfono:</strong> ${telefono}</li>
    </ul>
    <p>Si necesitas hacer cambios, contáctanos.</p>
    <p>¡Te esperamos!</p>
  `;
  return enviarMail(email, 'Confirmación de tu reserva en La Esperanza', html);
}

export async function sendReservationCancellation(email: string, _details: any) {
  const html = `
    <h2>Reserva cancelada</h2>
    <p>Tu reserva ha sido cancelada exitosamente.</p>
    <p>Si tienes preguntas, contáctanos.</p>
  `;
  return enviarMail(email, 'Cancelación de tu reserva en La Esperanza', html);
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
