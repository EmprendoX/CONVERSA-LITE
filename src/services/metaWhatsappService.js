import fetch from "node-fetch";
import { getProviderCredentials } from "./credentialsStore.js";

export async function sendText({ to, text }) {
  const creds = await getProviderCredentials("meta");
  if (!creds.accessToken || !creds.phoneNumberId) {
    throw new Error("Meta WhatsApp no configurado: accessToken/phoneNumberId requeridos");
  }
  const url = `https://graph.facebook.com/v20.0/${creds.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${creds.accessToken}`
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text }
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Meta send error ${res.status}: ${t}`);
  }
  return res.json();
}

export default { sendText };

export async function sendMedia({ to, mediaUrl, caption, type = "image" }) {
  const creds = await getProviderCredentials("meta");
  if (!creds.accessToken || !creds.phoneNumberId) {
    throw new Error("Meta WhatsApp no configurado: accessToken/phoneNumberId requeridos");
  }
  const url = `https://graph.facebook.com/v20.0/${creds.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${creds.accessToken}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type,
      [type]: { link: mediaUrl, caption }
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Meta media error ${res.status}: ${t}`);
  }
  return res.json();
}

export async function sendTemplate({ to, name, language = "en_US", components }) {
  const creds = await getProviderCredentials("meta");
  if (!creds.accessToken || !creds.phoneNumberId) {
    throw new Error("Meta WhatsApp no configurado: accessToken/phoneNumberId requeridos");
  }
  const url = `https://graph.facebook.com/v20.0/${creds.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${creds.accessToken}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name, language: { code: language }, components: components || [] }
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Meta template error ${res.status}: ${t}`);
  }
  return res.json();
}

export const metaApi = { sendText, sendMedia, sendTemplate };


