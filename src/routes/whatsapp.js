import express from "express";
import { responderAgente } from "../services/openaiService.js";
import { guardarConversacion } from "../services/supabaseService.js";
import { calcularBANT } from "../services/bantScoring.js";

const router = express.Router();

// Verificación inicial del webhook de WhatsApp de Meta
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("✅ Webhook verificado");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

router.post("/webhook", async (req, res) => {
  try {
    const mensaje = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    if (!mensaje) return res.sendStatus(200);
    
    const texto = mensaje.text?.body || "";
    const telefono = mensaje.from;
    
    let respuesta = "Lo siento, no puedo responder ahora mismo. Por favor contacta con soporte.";
    let puntaje = 0;
    
    try {
      respuesta = await responderAgente("ventas", texto);
      puntaje = await calcularBANT(texto);
    } catch (error) {
      console.error("Error al generar respuesta:", error.message);
      respuesta = "Estoy teniendo problemas técnicos. Por favor intenta más tarde.";
    }
    
    await guardarConversacion({ telefono, mensaje: texto, respuesta, puntaje });
    
    // Enviar respuesta a WhatsApp solo si hay token configurado
    if (process.env.META_ACCESS_TOKEN && process.env.META_PHONE_ID) {
      try {
        await fetch(`https://graph.facebook.com/v19.0/${process.env.META_PHONE_ID}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: telefono,
            text: { body: respuesta }
          })
        });
      } catch (error) {
        console.error("Error enviando a WhatsApp:", error.message);
      }
    } else {
      console.log("⚠️ WhatsApp no configurado - respuesta generada:", respuesta);
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

export default router;
