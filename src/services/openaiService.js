import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config/index.js";

let openaiClient = null;
let cachedAgentProfile = null;

function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return openaiClient;
}

async function readAgentFile() {
  if (cachedAgentProfile) {
    return cachedAgentProfile;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const agentPath = path.resolve(__dirname, "../agents/primary.json");
  try {
    const raw = await fs.readFile(agentPath, "utf8");
    cachedAgentProfile = JSON.parse(raw);
    return cachedAgentProfile;
  } catch (error) {
    throw new Error(`No se pudo cargar la configuración del agente único: ${error.message}`);
  }
}

export async function getAgentProfile() {
  return readAgentFile();
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

// Streaming de chat: devuelve un AsyncIterable con fragmentos de texto
export async function createChatCompletionStream(messages, options = {}) {
  const client = getOpenAIClient();
  const stream = await client.chat.completions.create({
    model: options.model || config.openai.defaultModel,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens,
    stream: true
  });

  // El objeto `stream` es un AsyncIterable en el SDK oficial
  return stream;
}

export default {
  getAgentProfile,
  createChatCompletion,
  createEmbedding,
  createChatCompletionStream
};
