// Envío de WhatsApp vía Meta Cloud API (API oficial de WhatsApp Business).
// Requiere WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID (Railway).
// Nota: fuera de la ventana de 24hs de conversación, Meta puede exigir un
// template aprobado en vez de texto libre — si el envío falla, revisar esto
// primero en el panel de Meta Business.
export async function enviarWhatsApp(to: string, mensaje: string): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error('WhatsApp no configurado: falta WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID');
    return false;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: mensaje },
      }),
    });

    if (!res.ok) {
      console.error('Error enviando WhatsApp:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    return false;
  }
}
