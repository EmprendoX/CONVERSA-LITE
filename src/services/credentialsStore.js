import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { config } from "../config/index.js";

const CREDENTIALS_SECRET = process.env.CREDENTIALS_SECRET || "";
const dataDir = path.resolve(process.cwd(), ".data");
const encPath = path.join(dataDir, "credentials.enc.json");

function requireSecret() {
  if (!CREDENTIALS_SECRET) {
    throw new Error("CREDENTIALS_SECRET no configurado en .env");
  }
}

function encryptJson(obj) {
  requireSecret();
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash("sha256").update(CREDENTIALS_SECRET).digest();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), "utf8");
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decryptJson(b64) {
  requireSecret();
  const buf = Buffer.from(b64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const key = crypto.createHash("sha256").update(CREDENTIALS_SECRET).digest();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(dec.toString("utf8"));
}

async function readAll() {
  try {
    const raw = await fs.readFile(encPath, "utf8");
    return decryptJson(raw);
  } catch (e) {
    return {};
  }
}

export async function getMaskedCredentials() {
  const all = await readAll();
  const masked = {};
  for (const [provider, data] of Object.entries(all)) {
    masked[provider] = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, typeof v === "string" && v ? mask(v) : v])
    );
  }
  return masked;
}

export async function getProviderCredentials(provider) {
  const all = await readAll();
  return all[provider] || {};
}

export async function saveCredentials(provider, data) {
  if (!provider || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Payload inválido");
  }
  const all = await readAll();
  all[provider] = data;
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(encPath, encryptJson(all), "utf8");
  return { ok: true };
}

export async function validateCredentials(provider) {
  const all = await readAll();
  const creds = all[provider] || {};
  switch (provider) {
    case "openai": {
      const ok = Boolean(creds.apiKey || creds.public || creds.internal);
      const details = ok ? "OK (usa apiKey o public/internal)" : "Falta apiKey o public/internal";
      return { ok, details };
    }
    case "google": {
      const ok = Boolean(creds.clientId && creds.clientSecret && creds.redirectUri);
      return { ok, details: ok ? "OK" : "Faltan campos: clientId/clientSecret/redirectUri" };
    }
    case "twilio": {
      const ok = Boolean(creds.accountSid && creds.authToken);
      const details = ok ? "OK (opcional: fromNumber, messagingServiceSid)" : "Faltan: accountSid/authToken";
      return { ok, details };
    }
    case "meta": {
      const ok = Boolean(creds.accessToken && creds.phoneNumberId);
      const details = ok ? "OK (opcional: appId, appSecret, verifyToken, businessAccountId)" : "Faltan: accessToken/phoneNumberId";
      return { ok, details };
    }
    case "vapi": {
      const ok = Boolean(creds.apiKey);
      return { ok, details: ok ? "OK" : "Falta apiKey" };
    }
    case "elevenlabs": {
      const ok = Boolean(creds.apiKey);
      return { ok, details: ok ? "OK" : "Falta apiKey" };
    }
    default:
      return { ok: false, details: "Proveedor no soportado" };
  }
}

function mask(s) {
  if (!s) return s;
  const len = s.length;
  if (len <= 6) return "***";
  return s.slice(0, 3) + "***" + s.slice(-3);
}

export default {
  getMaskedCredentials,
  getProviderCredentials,
  saveCredentials,
  validateCredentials
};


