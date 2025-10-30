import dotenv from "dotenv";

dotenv.config();

const { OPENAI_API_KEY, OPENAI_API_KEY_INTERNAL, OPENAI_API_KEY_PUBLIC, PORT, RATE_LIMIT_PER_MIN, MODERATION_ENABLED,
  ENABLE_PUBLIC_CHAT, ENABLE_INTERNAL_CHAT,
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_CALENDAR_ID, ACCOUNT_ID } = process.env;

// Claves válidas: al menos una (global o por canal)
const fallbackApiKey = OPENAI_API_KEY || OPENAI_API_KEY_PUBLIC || OPENAI_API_KEY_INTERNAL;
if (!fallbackApiKey) {
  throw new Error("Falta OPENAI_API_KEY (o OPENAI_API_KEY_PUBLIC/OPENAI_API_KEY_INTERNAL)");
}

export const config = {
  openai: {
    apiKey: fallbackApiKey,
    internalKey: OPENAI_API_KEY_INTERNAL || fallbackApiKey,
    publicKey: OPENAI_API_KEY_PUBLIC || fallbackApiKey,
    defaultModel: "gpt-4o-mini",
    defaultEmbeddingModel: "text-embedding-3-small"
  },
  server: {
    port: PORT ? Number(PORT) : 3000,
    rateLimitPerMin: RATE_LIMIT_PER_MIN ? Number(RATE_LIMIT_PER_MIN) : 60,
    moderationEnabled: MODERATION_ENABLED === "true",
    enablePublicChat: ENABLE_PUBLIC_CHAT !== "false",
    enableInternalChat: ENABLE_INTERNAL_CHAT !== "false"
  },
  google: {
    clientId: GOOGLE_CLIENT_ID || "",
    clientSecret: GOOGLE_CLIENT_SECRET || "",
    redirectUri: GOOGLE_REDIRECT_URI || "",
    calendarId: GOOGLE_CALENDAR_ID || "primary",
    accountId: ACCOUNT_ID || "default"
  }
};

export default config;
