import { Router } from "express";
import { getMaskedCredentials, saveCredentials, validateCredentials } from "../services/credentialsStore.js";
import { validateCredentialsSave, validateCredentialsValidate } from "../utils/validators.js";
import { listAvailability } from "../services/googleCalendarService.js";

const router = Router();

function requireAdmin(req, res, next) {
  const adminToken = process.env.ADMIN_TOKEN || "";
  if (!adminToken) return next(); // abierto si no se configura token
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== adminToken) return res.status(401).json({ error: "Unauthorized" });
  next();
}

router.get("/", requireAdmin, async (_req, res) => {
  try {
    const masked = await getMaskedCredentials();
    res.json(masked);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  const errors = validateCredentialsSave(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors.join(", ") });
  const { provider, data } = req.body || {};
  try {
    const out = await saveCredentials(provider, data);
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/validate", requireAdmin, async (req, res) => {
  const errors = validateCredentialsValidate(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors.join(", ") });
  const { provider } = req.body || {};
  try {
    let out = await validateCredentials(provider);
    // Validación avanzada por proveedor
    if (provider === "google" && out.ok) {
      try {
        const now = Date.now();
        await listAvailability({ fromISO: new Date(now).toISOString(), toISO: new Date(now + 10 * 60 * 1000).toISOString() });
        out = { ok: true, details: "Tokens válidos y acceso a Calendar funcionando" };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/No hay tokens de Google/i.test(msg)) {
          out = { ok: false, details: "Falta autorizar cuenta: abre /api/calendar/auth-url" };
        } else {
          out = { ok: false, details: `Error al acceder a Calendar: ${msg}` };
        }
      }
    }
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;


