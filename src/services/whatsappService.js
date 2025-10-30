import twilio from "twilio";
import { getProviderCredentials } from "./credentialsStore.js";

function normalizeToWhatsApp(number) {
  // Asegura prefijo 'whatsapp:' si no lo tiene
  if (!number) return number;
  return number.startsWith("whatsapp:") ? number : `whatsapp:${number}`;
}

export async function sendText({ to, text }) {
  const creds = await getProviderCredentials("twilio");
  if (!creds.accountSid || !creds.authToken) {
    throw new Error("Twilio no configurado: accountSid/authToken requeridos");
  }
  const client = twilio(creds.accountSid, creds.authToken);
  const params = {
    to: normalizeToWhatsApp(to),
    body: text
  };
  if (creds.messagingServiceSid) {
    params.messagingServiceSid = creds.messagingServiceSid;
  } else if (creds.fromNumber) {
    params.from = normalizeToWhatsApp(creds.fromNumber);
  } else {
    throw new Error("Configura fromNumber o messagingServiceSid para WhatsApp");
  }
  const msg = await client.messages.create(params);
  return { sid: msg.sid };
}

export default { sendText };

export async function sendMedia({ to, mediaUrl, caption }) {
  const creds = await getProviderCredentials("twilio");
  if (!creds.accountSid || !creds.authToken) {
    throw new Error("Twilio no configurado: accountSid/authToken requeridos");
  }
  if (!mediaUrl) throw new Error("mediaUrl requerido");
  const client = twilio(creds.accountSid, creds.authToken);
  const params = {
    to: normalizeToWhatsApp(to),
    mediaUrl: [mediaUrl]
  };
  if (caption) params.body = caption;
  if (creds.messagingServiceSid) {
    params.messagingServiceSid = creds.messagingServiceSid;
  } else if (creds.fromNumber) {
    params.from = normalizeToWhatsApp(creds.fromNumber);
  } else {
    throw new Error("Configura fromNumber o messagingServiceSid para WhatsApp");
  }
  const msg = await client.messages.create(params);
  return { sid: msg.sid };
}

// Nota: en Twilio, los templates aprobados se envían como texto inicial
// (el contenido debe coincidir con la plantilla aprobada por WhatsApp).
export async function sendTemplate({ to, templateText }) {
  if (!templateText) throw new Error("templateText requerido");
  return sendText({ to, text: templateText });
}

export const twilioApi = { sendText, sendMedia, sendTemplate };


