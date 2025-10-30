import { Router } from "express";
import runSingleAgent from "../orchestrator/singleAgent.js";

const router = Router();

router.post("/chat", async (req, res) => {
  const { message, agent = "ventas", sessionId, topK } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: "El campo 'message' es obligatorio" });
  }

  try {
    const result = await runSingleAgent({
      agent,
      userMessage: message,
      sessionId,
      topK
    });

    return res.json({
      reply: result.reply,
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

export default router;
