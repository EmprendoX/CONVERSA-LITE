import { Router } from "express";
import { randomUUID } from "crypto";
import runSingleAgent from "../orchestrator/singleAgent.js";
import { getAgentProfile, createChatCompletionStream } from "../services/openaiService.js";
import memory from "../memory/index.js";
import { retrieveRelevantItems } from "../rag/retriever.js";
import { config } from "../config/index.js";

const router = Router();

router.post("/chat", async (req, res) => {
  const { message, sessionId, topK, useCatalog = true } = req.body || {};
  if (config.server.moderationEnabled) {
    if (isFlagged(trimmedMessage)) {
      return res.status(400).json({ error: "El mensaje no cumple con las políticas de uso." });
    }
  }

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

// Streaming SSE
router.post("/chat/stream", async (req, res) => {
  const { message, sessionId, topK, useCatalog = true } = req.body || {};

  if (!message || typeof message !== "string") {
    res.status(400).setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "El campo 'message' es obligatorio" }));
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    res.status(400).setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "El mensaje no puede estar vacío" }));
  }

  if (config.server.moderationEnabled) {
    if (isFlagged(trimmedMessage)) {
      res.status(400).setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "El mensaje no cumple con las políticas de uso." }));
    }
  }

  const sessionFromRequest = typeof sessionId === "string" && sessionId.trim() ? sessionId.trim() : null;
  const effectiveSessionId = sessionFromRequest ?? createSessionId();
  const shouldUseCatalog = Boolean(useCatalog);
  const numericTopK = parseTopK(topK);

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  try {
    const agent = await getAgentProfile();
    const history = effectiveSessionId ? await memory.getMessages(effectiveSessionId) : [];
    const ragResults = shouldUseCatalog ? await retrieveRelevantItems(trimmedMessage, { topK: numericTopK }) : [];

    // Formatear contexto de catálogo similar al orquestador
    const contextLines = ragResults.map(({ item, score }) => {
      const price = typeof item.precio !== "undefined" ? `Precio: ${item.precio}` : null;
      const parts = [item.nombre, item.descripcion, item.categoria ? `Categoría: ${item.categoria}` : null, price]
        .filter(Boolean)
        .join(" | ");
      const formattedScore = score ? score.toFixed(3) : "0.000";
      return `- (${formattedScore}) ${parts}`;
    });
    const ragContext = contextLines.length ? `Contexto de catálogo relevante:\n${contextLines.join("\n")}` : null;

    const messages = [{ role: "system", content: agent.prompt }];
    if (ragContext) messages.push({ role: "system", content: ragContext });
    if (history.length) messages.push(...history.map(({ role, content }) => ({ role, content })));
    messages.push({ role: "user", content: trimmedMessage });

    // Emitir metadatos iniciales
    send({ sessionId: effectiveSessionId, agent: { name: agent.name, description: agent.description } });

    const stream = await createChatCompletionStream(messages);
    let fullText = "";

    for await (const chunk of stream) {
      const delta = chunk?.choices?.[0]?.delta?.content || "";
      if (!delta) continue;
      fullText += delta;
      send({ delta });
    }

    // Persistir memoria tras finalizar
    if (effectiveSessionId) {
      await memory.addMessage(effectiveSessionId, { role: "user", content: trimmedMessage });
      await memory.addMessage(effectiveSessionId, { role: "assistant", content: fullText });
    }

    // Enviar resultados RAG resumidos y cierre
    send({ done: true, ragResults: ragResults.map(({ item, score }) => ({
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion,
      precio: item.precio,
      categoria: item.categoria,
      score
    })) });
    res.end();
  } catch (error) {
    try {
      send({ error: error.message || "Error en streaming" });
    } finally {
      res.end();
    }
  }
});

function isFlagged(text) {
  const t = String(text || "").toLowerCase();
  // Lista muy básica de ejemplos; reemplazar por moderación real si se habilita
  const banned = ["terrorismo", "explosivo", "odio racial"];
  return banned.some((w) => t.includes(w));
}

// Feedback de calidad por mensaje
router.post("/chat/feedback", async (req, res) => {
  const { sessionId, messageId, rating, comment } = req.body || {};
  if (!sessionId || !messageId || (rating !== "up" && rating !== "down")) {
    return res.status(400).json({ error: "Campos requeridos: sessionId, messageId, rating ('up'|'down')" });
  }
  try {
    const payload = {
      sessionId,
      messageId,
      rating,
      comment: typeof comment === "string" && comment.trim() ? comment.trim() : undefined,
      createdAt: new Date().toISOString()
    };
    // Para v1: registrar en consola; se puede conectar a un almacenamiento luego
    console.log("[feedback]", JSON.stringify(payload));
    return res.json({ ok: true });
  } catch (error) {
    console.error("Error en /api/chat/feedback:", error);
    return res.status(500).json({ error: "No se pudo registrar el feedback" });
  }
});
