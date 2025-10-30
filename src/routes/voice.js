import { Router } from "express";
import twilio from "twilio";
import runSingleAgent from "../orchestrator/singleAgent.js";
import { sanitizeText } from "../utils/validators.js";
import { getProviderCredentials } from "../services/credentialsStore.js";

const router = Router();

function twimlResponse(cb) {
  const vr = new twilio.twiml.VoiceResponse();
  cb(vr);
  return vr.toString();
}

// Entrada de llamada
router.post("/incoming", async (req, res) => {
  try {
    const creds = await getProviderCredentials("twilio");
    if (!creds.authToken) throw new Error("Twilio authToken no configurado");
    const signature = req.get("X-Twilio-Signature") || "";
    const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const valid = twilio.validateRequest(creds.authToken, signature, url, req.body || {});
    if (!valid) {
      return res.status(403).type("text/xml").send(twimlResponse((vr) => vr.hangup()));
    }

    const gatherAction = "/api/voice/gather";
    const xml = twimlResponse((vr) => {
      const g = vr.gather({ input: "speech", speechTimeout: "auto", action: gatherAction, method: "POST" });
      g.say({ language: "es-MX", voice: "Polly.Mia" }, "Hola. Dime en qué puedo ayudarte.");
      vr.pause({ length: 1 });
      vr.redirect(gatherAction);
    });
    res.type("text/xml").send(xml);
  } catch (e) {
    res.type("text/xml").send(twimlResponse((vr) => vr.hangup()));
  }
});

// Resultado del reconocimiento de voz
router.post("/gather", async (req, res) => {
  try {
    const creds = await getProviderCredentials("twilio");
    if (!creds.authToken) throw new Error("Twilio authToken no configurado");
    const signature = req.get("X-Twilio-Signature") || "";
    const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const valid = twilio.validateRequest(creds.authToken, signature, url, req.body || {});
    if (!valid) {
      return res.status(403).type("text/xml").send(twimlResponse((vr) => vr.hangup()));
    }

    const speech = sanitizeText(String(req.body?.SpeechResult || ""), 4000);
    const caller = String(req.body?.From || "");
    if (!speech) {
      return res.type("text/xml").send(twimlResponse((vr) => {
        const g = vr.gather({ input: "speech", speechTimeout: "auto", action: "/api/voice/gather", method: "POST" });
        g.say({ language: "es-MX" }, "No te escuché. ¿Puedes repetir, por favor?");
      }));
    }

    const sessionId = `voice-${caller || "anon"}`;
    const result = await runSingleAgent({ userMessage: speech, sessionId, topK: 3, useCatalog: true });
    const reply = result.reply || "Gracias por llamar.";

    const xml = twimlResponse((vr) => {
      vr.say({ language: "es-MX", voice: "Polly.Mia" }, reply);
      vr.hangup();
    });
    res.type("text/xml").send(xml);
  } catch (e) {
    res.type("text/xml").send(twimlResponse((vr) => vr.hangup()));
  }
});

export default router;


