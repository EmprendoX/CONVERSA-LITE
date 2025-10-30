import { Router } from "express";
import crypto from "crypto";
import runSingleAgent from "../orchestrator/singleAgent.js";
import { getProviderCredentials } from "../services/credentialsStore.js";
import { sendText, sendMedia, sendTemplate } from "../services/metaWhatsappService.js";
import { appendSendLog } from "../services/sendLog.js";
import { sanitizeText } from "../utils/validators.js";

const router = Router();

// Verificación (GET) para suscripción de webhook en Meta
router.get("/webhook", async (req, res) => {
  const creds = await getProviderCredentials("meta");
  const mode = req.query["hub.mode"]; // subscribe
  const token = req.query["hub.verify_token"]; // debe coincidir con creds.verifyToken
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token && token === creds.verifyToken) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send("Forbidden");
});

// Recepción (POST) con firma X-Hub-Signature-256
router.post("/webhook", async (req, res) => {
  try {
    const creds = await getProviderCredentials("meta");
    const signature = req.get("X-Hub-Signature-256") || "";
    const bodyRaw = JSON.stringify(req.body || {});
    if (creds.appSecret) {
      const hmac = crypto.createHmac("sha256", creds.appSecret).update(bodyRaw).digest("hex");
      const expected = `sha256=${hmac}`;
      if (signature !== expected) {
        console.warn("Meta signature invalid");
        return res.status(403).send("Forbidden");
      }
    }

    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;
    if (!messages || !messages.length) return res.status(200).send("OK");

    const m = messages[0];
    const from = m.from; // phone number
    let text = "";
    if (m.type === "text") text = m.text?.body || "";
    // otros tipos: image/document/location pueden enriquecer más adelante
    text = sanitizeText(text, 4000);
    if (!from || !text) return res.status(200).send("OK");

    const sessionId = `wa-meta-${from}`;
    const result = await runSingleAgent({ userMessage: text, sessionId, topK: 3, useCatalog: true });
    const reply = result.reply || "";
    await sendText({ to: from, text: reply });
    return res.status(200).send("OK");
  } catch (e) {
    console.error("/api/meta/webhook error:", e);
    return res.status(200).send("OK");
  }
});

export default router;

// Envío manual (debug/admin)
router.post("/send", async (req, res) => {
  const { to, text, mediaUrl, caption, type, template } = req.body || {};
  if (!to) return res.status(400).json({ error: "to requerido" });
  try {
    let out;
    if (mediaUrl) out = await sendMedia({ to, mediaUrl, caption, type });
    else if (template && template.name) out = await sendTemplate({ to, name: template.name, language: template.language, components: template.components });
    else if (text) out = await sendText({ to, text });
    else return res.status(400).json({ error: "Proporciona text o mediaUrl o template" });
    await appendSendLog({ provider: "meta-wa", to, type: mediaUrl ? "media" : template ? "template" : "text", ok: true });
    res.json(out);
  } catch (e) {
    await appendSendLog({ provider: "meta-wa", to, type: mediaUrl ? "media" : template ? "template" : "text", ok: false, error: e.message });
    res.status(500).json({ error: e.message });
  }
});


