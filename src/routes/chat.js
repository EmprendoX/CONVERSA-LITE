import { Router } from "express";
import { randomUUID } from "crypto";
import runSingleAgent from "../orchestrator/singleAgent.js";

const router = Router();

router.post("/chat", async (req, res) => {
  const { message, sessionId, topK, useCatalog = true } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "El campo 'message' es obligatorio" });
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return res.status(400).json({ error: "El mensaje no puede estar vacío" });
  }

  const sessionFromRequest = typeof sessionId === "string" && sessionId.trim() ? sessionId.trim() : null;
  const effectiveSessionId = sessionFromRequest ?? createSessionId();
  const shouldUseCatalog = Boolean(useCatalog);
  const numericTopK = parseTopK(topK);

  try {
    const result = await runSingleAgent({
      userMessage: trimmedMessage,
      sessionId: effectiveSessionId,
      topK: numericTopK,
      useCatalog: shouldUseCatalog
    });

    return res.json({
      reply: result.reply,
      sessionId: effectiveSessionId,
      agent: {
        name: result.agentProfile.name,
        description: result.agentProfile.description
      },
      memoryProvider: result.memoryProvider,
      ragResults: result.ragResults.map(({ item, score }) => ({
        id: item.id,
        nombre: item.nombre,
        descripcion: item.descripcion,
        precio: item.precio,
        categoria: item.categoria,
        score
      }))
    });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    return res.status(500).json({ error: error.message });
  }
});

function createSessionId() {
  if (typeof randomUUID === "function") {
    return randomUUID();
  }

  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseTopK(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const clamped = Math.max(1, Math.min(10, Math.floor(parsed)));
  return clamped;
}

export default router;
