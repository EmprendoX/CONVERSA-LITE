import { Router } from "express";
import { randomUUID } from "crypto";
import { getAgentProfile, createChatCompletionStream } from "../services/openaiService.js";
import memory from "../memory/index.js";
import { retrieveRelevantItems } from "../rag/retriever.js";
import { config } from "../config/index.js";
import { sanitizeText, validateChatPayload } from "../utils/validators.js";

const router = Router();

// simple gate by token
router.use((req, res, next) => {
  const token = req.headers["x-admin-token"];
  if (config.server.enableInternalChat && token && typeof token === 'string') return next();
  return res.status(401).json({ error: "Unauthorized" });
});

router.post("/chat/stream", async (req, res) => {
  const errors = validateChatPayload(req.body || {});
  if (errors.length) {
    res.status(400).setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: errors.join(", ") }));
  }
  const { message, sessionId, topK, useCatalog = true } = req.body || {};
  if (!message || typeof message !== "string") {
    res.status(400).setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "El campo 'message' es obligatorio" }));
  }

  const trimmedMessage = sanitizeText(message, 4000);
  if (!trimmedMessage) {
    res.status(400).setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "El mensaje no puede estar vacío" }));
  }
  const sid = typeof sessionId === "string" && sessionId.trim() ? sessionId.trim() : randomUUID();

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    const agent = await getAgentProfile('internal');
    const history = sid ? await memory.getMessages(sid) : [];
    const ragResults = useCatalog ? await retrieveRelevantItems(trimmedMessage, { topK }) : [];
    const contextLines = ragResults.map(({ item, score }) => `- (${score?.toFixed(3)}) ${item.nombre} | ${item.descripcion}`);
    const ragContext = contextLines.length ? `Contexto:\n+${contextLines.join("\n")}` : null;
    const messages = [{ role: "system", content: agent.prompt }];
    if (ragContext) messages.push({ role: "system", content: ragContext });
    if (history.length) messages.push(...history.map(({ role, content }) => ({ role, content })));
    messages.push({ role: "user", content: trimmedMessage });

    send({ sessionId: sid, agent: { name: agent.name, description: agent.description } });
    const stream = await createChatCompletionStream(messages, { channel: 'internal' });
    let full = "";
    for await (const chunk of stream) {
      const delta = chunk?.choices?.[0]?.delta?.content || "";
      if (!delta) continue;
      full += delta;
      send({ delta });
    }
    await memory.addMessage(sid, { role: "user", content: trimmedMessage });
    await memory.addMessage(sid, { role: "assistant", content: full });
    send({ done: true });
    res.end();
  } catch (e) {
    try { send({ error: e.message || 'Error' }); } finally { res.end(); }
  }
});

export default router;


