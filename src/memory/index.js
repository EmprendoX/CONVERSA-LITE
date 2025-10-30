import { createClient } from "@supabase/supabase-js";
import { config } from "../config/index.js";

const inMemoryStore = new Map();

function normaliseMessage(message) {
  if (!message || !message.role || !message.content) {
    throw new Error("Cada mensaje debe incluir 'role' y 'content'");
  }
  return {
    role: message.role,
    content: message.content,
    createdAt: message.createdAt ? new Date(message.createdAt).toISOString() : new Date().toISOString()
  };
}

export const inMemoryMemory = {
  async getMessages(sessionId) {
    if (!sessionId) {
      return [];
    }
    const messages = inMemoryStore.get(sessionId) || [];
    return [...messages];
  },
  async addMessage(sessionId, message) {
    if (!sessionId) {
      return;
    }
    const normalised = normaliseMessage(message);
    const history = inMemoryStore.get(sessionId) || [];
    history.push(normalised);
    inMemoryStore.set(sessionId, history);
  }
};

let supabaseClient = null;

if (config.supabase.url && config.supabase.serviceRoleKey) {
  supabaseClient = createClient(config.supabase.url, config.supabase.serviceRoleKey);
}

export const supabaseMemory = {
  async getMessages(sessionId) {
    if (!supabaseClient || !sessionId) {
      return [];
    }
    const { data, error } = await supabaseClient
      .from("conversaciones")
      .select("role, content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error obteniendo memoria desde Supabase:", error.message);
      return [];
    }

    return (data || []).map((row) => ({
      role: row.role,
      content: row.content,
      createdAt: row.created_at
    }));
  },
  async addMessage(sessionId, message) {
    if (!supabaseClient || !sessionId) {
      return;
    }
    const normalised = normaliseMessage(message);
    const { error } = await supabaseClient.from("conversaciones").insert({
      session_id: sessionId,
      role: normalised.role,
      content: normalised.content,
      created_at: normalised.createdAt
    });

    if (error) {
      console.error("Error guardando memoria en Supabase:", error.message);
    }
  }
};

export const memory = supabaseClient ? supabaseMemory : inMemoryMemory;
export const memoryProvider = supabaseClient ? "supabase" : "in-memory";

export default memory;
