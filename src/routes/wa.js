import { Router } from "express";
import twilio from "twilio";
import runSingleAgent from "../orchestrator/singleAgent.js";
import { sendText, sendMedia, sendTemplate } from "../services/whatsappService.js";
import { appendSendLog } from "../services/sendLog.js";
import { sanitizeText } from "../utils/validators.js";
import { getProviderCredentials } from "../services/credentialsStore.js";

const router = Router();

// Webhook inbound de Twilio WhatsApp (content-type: application/x-www-form-urlencoded)
router.post("/webhook", async (req, res) => {
  try {
    // Validación de firma Twilio
    const creds = await getProviderCredentials("twilio");
    if (!creds.authToken) throw new Error("Twilio authToken no configurado");
    const signature = req.get("X-Twilio-Signature") || "";
    const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const isValid = twilio.validateRequest(creds.authToken, signature, url, req.body || {});
    if (!isValid) {
      console.warn("Twilio signature invalid");
      return res.status(403).send("Forbidden");
    }

    // Twilio envía campos como Body, From, WaId, Media*, etc.
    const body = req.body || {};
    const from = String(body.From || body.WaId || "");
    const baseText = sanitizeText(String(body.Body || ""), 4000);

    // Enriquecimiento: adjuntos y ubicación
    let enriched = baseText;
    const numMedia = Number(body.NumMedia || 0);
    if (numMedia > 0) {
      const lines = [];
      for (let i = 0; i < numMedia; i += 1) {
        const url = body[`MediaUrl${i}`];
        const type = body[`MediaContentType${i}`];
        if (url) lines.push(`Adjunto: ${url} (${type || "desconocido"})`);
      }
      if (lines.length) enriched = [baseText, ...lines].filter(Boolean).join("\n");
    }
    if (body.Latitude && body.Longitude) {
      const lat = body.Latitude, lon = body.Longitude;
      enriched = [enriched, `Ubicación: lat=${lat}, lon=${lon}`].filter(Boolean).join("\n");
    }

    const text = enriched;
    if (!from || !text) return res.status(400).send("OK");

    const sessionId = `wa-${from}`;
    const result = await runSingleAgent({ userMessage: text, sessionId, topK: 3, useCatalog: true });
    const reply = result.reply || "";

    await sendText({ to: from.replace("whatsapp:", ""), text: reply });
    res.status(200).send("OK");
  } catch (e) {
    console.error("/api/wa/webhook error:", e);
    res.status(200).send("OK"); // Twilio espera 200 siempre para no reintentar infinito
  }
});

// Envío manual (debug/admin)
router.post("/send", async (req, res) => {
  const { to, text, mediaUrl, caption, templateText } = req.body || {};
  if (!to) return res.status(400).json({ error: "to requerido" });
  try {
    let out;
    if (mediaUrl) out = await sendMedia({ to, mediaUrl, caption });
    else if (templateText) out = await sendTemplate({ to, templateText });
    else if (text) out = await sendText({ to, text });
    else return res.status(400).json({ error: "Proporciona text o mediaUrl o templateText" });
    await appendSendLog({ provider: "twilio-wa", to, type: mediaUrl ? "media" : templateText ? "template" : "text", ok: true });
    res.json(out);
  } catch (e) {
    await appendSendLog({ provider: "twilio-wa", to, type: mediaUrl ? "media" : templateText ? "template" : "text", ok: false, error: e.message });
    res.status(500).json({ error: e.message });
  }
});

export default router;


