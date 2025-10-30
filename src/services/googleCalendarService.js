import fs from "fs/promises";
import path from "path";
import { google } from "googleapis";
import { config } from "../config/index.js";

const tokensDir = path.resolve(process.cwd(), ".data/google");
const tokensPath = path.join(tokensDir, `tokens-${config.google.accountId}.json`);

function getOAuth2Client() {
  const { clientId, clientSecret, redirectUri } = config.google;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth no configurado. Define GOOGLE_CLIENT_ID/SECRET y GOOGLE_REDIRECT_URI en .env");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function getAuthUrl(scopes = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly"
]) {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({ access_type: "offline", scope: scopes, prompt: "consent" });
}

export async function exchangeCodeForTokens(code) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  await fs.mkdir(tokensDir, { recursive: true });
  await fs.writeFile(tokensPath, JSON.stringify(tokens, null, 2), "utf8");
  return tokens;
}

async function getAuthorizedClient() {
  const oauth2 = getOAuth2Client();
  try {
    const raw = await fs.readFile(tokensPath, "utf8");
    const tokens = JSON.parse(raw);
    oauth2.setCredentials(tokens);
    return oauth2;
  } catch (e) {
    throw new Error("No hay tokens de Google. Autoriza primero con /api/calendar/auth-url");
  }
}

export async function listAvailability({ fromISO, toISO }) {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth });
  const timeMin = new Date(fromISO).toISOString();
  const timeMax = new Date(toISO).toISOString();
  const calendarId = config.google.calendarId;

  // Freebusy simple
  const fb = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: [{ id: calendarId }]
    }
  });
  const busy = fb.data.calendars?.[calendarId]?.busy || [];
  return { timeMin, timeMax, busy };
}

export async function createEvent({ summary, description, startISO, endISO, attendees = [] }) {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth });
  const event = await calendar.events.insert({
    calendarId: config.google.calendarId,
    requestBody: {
      summary,
      description,
      start: { dateTime: new Date(startISO).toISOString() },
      end: { dateTime: new Date(endISO).toISOString() },
      attendees
    }
  });
  return event.data;
}

export async function deleteEvent({ eventId }) {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId: config.google.calendarId, eventId });
  return { ok: true };
}

export default {
  getAuthUrl,
  exchangeCodeForTokens,
  listAvailability,
  createEvent,
  deleteEvent
};


