import { Router } from "express";
import { getAuthUrl, exchangeCodeForTokens, listAvailability, createEvent, deleteEvent } from "../services/googleCalendarService.js";
import { validateCalendarAvailability, validateCreateEvent } from "../utils/validators.js";

const router = Router();

router.get("/auth-url", async (_req, res) => {
  try {
    const url = await getAuthUrl();
    res.json({ url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/callback", async (req, res) => {
  const { code } = req.query || {};
  if (!code || typeof code !== "string") return res.status(400).json({ error: "Falta 'code'" });
  try {
    await exchangeCodeForTokens(code);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/availability", async (req, res) => {
  const errors = validateCalendarAvailability(req.query || {});
  if (errors.length) return res.status(400).json({ error: errors.join(", ") });
  const { from, to } = req.query || {};
  try {
    const data = await listAvailability({ fromISO: String(from), toISO: String(to) });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/events", async (req, res) => {
  const errors = validateCreateEvent(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors.join(", ") });
  const { summary, description, startISO, endISO, attendees } = req.body || {};
  try {
    const event = await createEvent({ summary, description, startISO, endISO, attendees });
    res.json(event);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/events/:id", async (req, res) => {
  const { id } = req.params || {};
  if (!id) return res.status(400).json({ error: "Parámetro 'id' requerido" });
  try {
    const result = await deleteEvent({ eventId: id });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;


