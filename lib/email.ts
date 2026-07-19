// Email configuration (commented out - using console logging instead)
/*
let transporter: any = null;

if (
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}
*/

export async function sendReservationEmail(email: string, reservationDetails: any) {
  console.log('📧 Email enviado (mock):', email, reservationDetails);
  // In production, replace with actual email sending logic
  return true;
}

export async function sendConfirmationEmail(email: string, details: any) {
  console.log('📧 Confirmación enviada (mock):', email, details);
  return true;
}
