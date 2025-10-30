import dotenv from "dotenv";

dotenv.config();

const { OPENAI_API_KEY, PORT, RATE_LIMIT_PER_MIN, MODERATION_ENABLED } = process.env;

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
    port: PORT ? Number(PORT) : 3000,
    rateLimitPerMin: RATE_LIMIT_PER_MIN ? Number(RATE_LIMIT_PER_MIN) : 60,
    moderationEnabled: MODERATION_ENABLED === "true"
  }
};

export default config;
