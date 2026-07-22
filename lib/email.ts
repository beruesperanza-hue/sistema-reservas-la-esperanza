import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendReservationConfirmation(
  email: string,
  nombre: string,
  fecha: string,
  hora: string,
  personas: number,
  telefono: string
) {
  try {
    console.log('🔧 ENVIANDO EMAIL REAL CON NODEMAILER A:', email);
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
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
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ EMAIL ENVIADO EXITOSAMENTE A:', email);
    return true;
  } catch (error) {
    console.error('❌ ERROR AL ENVIAR EMAIL:', error);
    return false;
  }
}

export async function sendReservationCancellation(email: string, _details: any) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Cancelación de tu reserva en La Esperanza',
      html: `
        <h2>Reserva cancelada</h2>
        <p>Tu reserva ha sido cancelada exitosamente.</p>
        <p>Si tienes preguntas, contáctanos.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✓ Cancelación enviada a:', email);
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
