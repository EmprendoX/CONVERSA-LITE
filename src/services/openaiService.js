import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config/index.js";

let openaiClient = null;
const agentCache = new Map();

function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return openaiClient;
}

async function readAgentFile(agentName) {
  if (agentCache.has(agentName)) {
    return agentCache.get(agentName);
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const agentPath = path.resolve(__dirname, `../agents/${agentName}.json`);
  const raw = await fs.readFile(agentPath, "utf8");
  const data = JSON.parse(raw);
  agentCache.set(agentName, data);
  return data;
}

export async function getAgentProfile(agentName = "ventas") {
  try {
    return await readAgentFile(agentName);
  } catch (error) {
    throw new Error(`No se pudo cargar la configuración del agente '${agentName}': ${error.message}`);
  }
}

export async function createChatCompletion(messages, options = {}) {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: options.model || config.openai.defaultModel,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens
  });

  return response.choices[0]?.message?.content || "";
}

export async function createEmbedding(input, options = {}) {
  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: options.model || config.openai.defaultEmbeddingModel,
    input
  });
  return response.data[0]?.embedding || [];
}

export default {
  getAgentProfile,
  createChatCompletion,
  createEmbedding
};
