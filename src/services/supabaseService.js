import { createClient } from "@supabase/supabase-js";

let supabase = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    if (!url || !key) {
      console.warn("⚠️ Supabase no configurado - las conversaciones no se guardarán");
      return null;
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

export async function guardarConversacion(data) {
  const client = getSupabase();
  if (client) {
    try {
      await client.from("conversaciones").insert(data);
    } catch (error) {
      console.error("Error guardando conversación:", error.message);
    }
  }
}

