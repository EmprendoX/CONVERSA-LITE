import { createChatCompletion, getAgentProfile } from "../services/openaiService.js";
import memory, { memoryProvider } from "../memory/index.js";
import { retrieveRelevantItems } from "../rag/retriever.js";

function formatCatalogContext(items) {
  if (!items.length) {
    return null;
  }

  const lines = items.map(({ item, score }) => {
    const price = typeof item.precio !== "undefined" ? `Precio: ${item.precio}` : null;
    const parts = [item.nombre, item.descripcion, item.categoria ? `Categoría: ${item.categoria}` : null, price]
      .filter(Boolean)
      .join(" | ");
    const formattedScore = score ? score.toFixed(3) : "0.000";
    return `- (${formattedScore}) ${parts}`;
  });

  return `Contexto de catálogo relevante:\n${lines.join("\n")}`;
}

export async function runSingleAgent({
  agent = "ventas",
  userMessage,
  sessionId,
  topK = 3
}) {
  if (!userMessage) {
    throw new Error("userMessage es obligatorio");
  }

  const agentProfile = await getAgentProfile(agent);
  const history = sessionId ? await memory.getMessages(sessionId) : [];

  const ragResults = await retrieveRelevantItems(userMessage, { topK });
  const ragContext = formatCatalogContext(ragResults);

  const messages = [
    { role: "system", content: agentProfile.prompt }
  ];

  if (ragContext) {
    messages.push({ role: "system", content: ragContext });
  }

  if (history.length) {
    messages.push(...history.map(({ role, content }) => ({ role, content })));
  }

  messages.push({ role: "user", content: userMessage });

  const reply = await createChatCompletion(messages);

  if (sessionId) {
    await memory.addMessage(sessionId, { role: "user", content: userMessage });
    await memory.addMessage(sessionId, { role: "assistant", content: reply });
  }

  return {
    reply,
    ragResults,
    memoryProvider,
    agentProfile
  };
}

export default runSingleAgent;
