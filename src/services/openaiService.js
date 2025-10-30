import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config/index.js";
import { getProviderCredentials } from "./credentialsStore.js";

let openaiClientDefault = null;
let openaiClientInternal = null;
let openaiClientPublic = null;
let cachedAgentProfileDefault = null;
let cachedAgentProfileInternal = null;

async function getOpenAIClient(channel = 'default') {
  // Prefer credentials from encrypted store if present
  let key = config.openai.apiKey;
  try {
    const creds = await getProviderCredentials('openai');
    if (channel === 'internal' && creds?.internal) key = creds.internal;
    else if (channel === 'public' && creds?.public) key = creds.public;
    else if (creds?.apiKey) key = creds.apiKey;
  } catch {}

  if (channel === 'internal') {
    if (!openaiClientInternal) openaiClientInternal = new OpenAI({ apiKey: key || config.openai.internalKey });
    return openaiClientInternal;
  }
  if (channel === 'public') {
    if (!openaiClientPublic) openaiClientPublic = new OpenAI({ apiKey: key || config.openai.publicKey });
    return openaiClientPublic;
  }
  if (!openaiClientDefault) openaiClientDefault = new OpenAI({ apiKey: key });
  return openaiClientDefault;
}

async function readAgentFile(channel = 'default') {
  if (channel === 'internal' && cachedAgentProfileInternal) return cachedAgentProfileInternal;
  if (channel === 'default' && cachedAgentProfileDefault) return cachedAgentProfileDefault;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const fileName = channel === 'internal' ? 'internal.json' : 'primary.json';
  const agentPath = path.resolve(__dirname, "../agents/" + fileName);
  try {
    const raw = await fs.readFile(agentPath, "utf8");
    const parsed = JSON.parse(raw);
    if (channel === 'internal') cachedAgentProfileInternal = parsed; else cachedAgentProfileDefault = parsed;
    return parsed;
  } catch (error) {
    throw new Error(`No se pudo cargar la configuración del agente (${fileName}): ${error.message}`);
  }
}

export async function getAgentProfile(channel = 'default') {
  return readAgentFile(channel);
}

export async function createChatCompletion(messages, options = {}) {
  const client = await getOpenAIClient(options.channel || 'default');
  const response = await client.chat.completions.create({
    model: options.model || config.openai.defaultModel,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens
  });

  return response.choices[0]?.message?.content || "";
}

export async function createEmbedding(input, options = {}) {
  const client = await getOpenAIClient(options.channel || 'default');
  const response = await client.embeddings.create({
    model: options.model || config.openai.defaultEmbeddingModel,
    input
  });
  return response.data[0]?.embedding || [];
}

// Streaming de chat: devuelve un AsyncIterable con fragmentos de texto
export async function createChatCompletionStream(messages, options = {}) {
  const client = await getOpenAIClient(options.channel || 'default');
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
