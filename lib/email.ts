// Email configuration (commented out - using console logging instead)

export async function sendReservationConfirmation(email: string, reservationDetails: any) {
  console.log('📧 Confirmación de reserva enviada (mock):', email, reservationDetails);
  return true;
}

export async function sendReservationCancellation(email: string, details: any) {
  console.log('📧 Cancelación de reserva enviada (mock):', email, details);
  return true;
}

export async function sendReservationEmail(email: string, reservationDetails: any) {
  console.log('📧 Email enviado (mock):', email, reservationDetails);
  return true;
}

export async function sendConfirmationEmail(email: string, details: any) {
  console.log('📧 Confirmación enviada (mock):', email, details);
  return true;
}
