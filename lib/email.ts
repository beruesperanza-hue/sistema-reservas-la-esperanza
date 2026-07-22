import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Remitente. Para producción real usá una dirección de un dominio verificado
// en Resend (ej. reservas@tudominio.com). Para pruebas, Resend permite
// 'onboarding@resend.dev' (solo envía al email de la cuenta).
const FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

export async function sendReservationConfirmation(
  email: string,
  nombre: string,
  fecha: string,
  hora: string,
  personas: number,
  telefono: string
) {
  try {
    console.log('🔧 ENVIANDO EMAIL CON RESEND A:', email);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Confirmación de tu reserva en La Esperanza',
      html: `
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
      `,
    });

    if (error) {
      console.error('❌ ERROR AL ENVIAR EMAIL:', error);
      return false;
    }

    console.log('✅ EMAIL ENVIADO EXITOSAMENTE A:', email, '- id:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ ERROR AL ENVIAR EMAIL:', error);
    return false;
  }
}

export async function sendReservationCancellation(email: string, _details: any) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Cancelación de tu reserva en La Esperanza',
      html: `
        <h2>Reserva cancelada</h2>
        <p>Tu reserva ha sido cancelada exitosamente.</p>
        <p>Si tienes preguntas, contáctanos.</p>
      `,
    });

    if (error) {
      console.error('✗ Error al enviar email:', error);
      return false;
    }

    console.log('✓ Cancelación enviada a:', email, '- id:', data?.id);
    return true;
  } catch (error) {
    console.error('✗ Error al enviar email:', error);
    return false;
  }
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
