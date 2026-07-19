
// Configuración de nodemailer
let transporter: any = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('⚠️ SMTP no configurado. Los emails no se enviarán.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

export async function sendReservationConfirmation(
  email: string,
  nombre: string,
  fecha: string,
  hora: string,
  personas: number,
  telefono: string
) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('📧 Email de confirmación simulado (SMTP no configurado)');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 28px; color: #a0826d; font-weight: bold; }
          .content { background: #faf8f5; padding: 20px; border-radius: 8px; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; color: #8b6e5d; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⭐ La Esperanza</div>
            <p style="color: #999; margin-top: 5px;">Desde 2011</p>
          </div>

          <h2 style="color: #a0826d;">¡Reserva Confirmada!</h2>

          <p>Estimado/a ${nombre},</p>

          <p>Nos complace confirmar que tu reserva ha sido realizada correctamente.</p>

          <div class="content">
            <div class="detail-row">
              <span class="label">Fecha:</span>
              <span>${fecha}</span>
            </div>
            <div class="detail-row">
              <span class="label">Hora:</span>
              <span>${hora}</span>
            </div>
            <div class="detail-row">
              <span class="label">Personas:</span>
              <span>${personas}</span>
            </div>
            <div class="detail-row">
              <span class="label">Teléfono de contacto:</span>
              <span>${telefono}</span>
            </div>
          </div>

          <p style="margin-top: 20px;">
            Si necesitas hacer cambios en tu reserva, por favor contactanos con anticipación llamando al número que aparece en la confirmación.
          </p>

          <p>¡Esperamos verte pronto en La Esperanza!</p>

          <div class="footer">
            <p>© 2011 - 2024 La Esperanza. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Confirmación de Reserva - La Esperanza',
      html: htmlContent,
    });
    console.log('✅ Email de confirmación enviado a:', email);
  } catch (error) {
    console.error('❌ Error enviando email:', error);
  }
}

export async function sendReservationCancellation(email: string, nombre: string) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('📧 Email de cancelación simulado (SMTP no configurado)');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 28px; color: #a0826d; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⭐ La Esperanza</div>
          </div>

          <h2 style="color: #a0826d;">Reserva Cancelada</h2>

          <p>Estimado/a ${nombre},</p>

          <p>Te confirmamos que tu reserva ha sido cancelada.</p>

          <p>Si deseas hacer una nueva reserva, visítanos en cualquier momento en nuestro sitio web.</p>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #a0826d; font-style: italic;">¡Esperamos tu próxima visita!</p>
          </div>

          <div class="footer">
            <p>© 2011 - 2024 La Esperanza. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Cancelación de Reserva - La Esperanza',
      html: htmlContent,
    });
    console.log('✅ Email de cancelación enviado a:', email);
  } catch (error) {
    console.error('❌ Error enviando email:', error);
  }
}
