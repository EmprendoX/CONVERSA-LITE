import dotenv from "dotenv";

dotenv.config();

const { OPENAI_API_KEY, PORT } = process.env;

if (!OPENAI_API_KEY) {
  throw new Error("La variable de entorno OPENAI_API_KEY es obligatoria");
}

export const config = {
  openai: {
    apiKey: OPENAI_API_KEY,
    defaultModel: "gpt-4o-mini",
    defaultEmbeddingModel: "text-embedding-3-small"
  },
  server: {
    port: PORT ? Number(PORT) : 3000
  }
};

export default config;
