import dotenv from "dotenv";

dotenv.config();

const {
  OPENAI_API_KEY,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY,
  SUPABASE_KEY,
  PORT
} = process.env;

if (!OPENAI_API_KEY) {
  throw new Error("La variable de entorno OPENAI_API_KEY es obligatoria");
}

const supabaseServiceKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY || null;

export const config = {
  openai: {
    apiKey: OPENAI_API_KEY,
    defaultModel: "gpt-4o-mini",
    defaultEmbeddingModel: "text-embedding-3-small"
  },
  supabase: {
    url: SUPABASE_URL || null,
    serviceRoleKey: supabaseServiceKey,
    anonKey: SUPABASE_ANON_KEY || null
  },
  server: {
    port: PORT ? Number(PORT) : 3000
  }
};

export default config;
