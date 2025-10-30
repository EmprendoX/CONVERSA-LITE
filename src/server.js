import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import chatRouter from "./routes/chat.js";
import adminRouter from "./routes/admin.js";
import { config } from "./config/index.js";

export function createServer() {
  const app = express();

  app.use(express.json());
  // Rate limiting básico por IP
  const requests = new Map(); // ip -> { count, windowStart }
  const WINDOW_MS = 60 * 1000;
  const LIMIT = config.server.rateLimitPerMin;
  app.use((req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = requests.get(ip) || { count: 0, windowStart: now };
    if (now - entry.windowStart > WINDOW_MS) {
      entry.count = 0;
      entry.windowStart = now;
    }
    entry.count += 1;
    requests.set(ip, entry);
    if (entry.count > LIMIT) {
      return res.status(429).json({ error: "Demasiadas solicitudes. Intenta nuevamente en un minuto." });
    }
    next();
  });
  // Métricas simples de latencia por request
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const pathLabel = req.path;
      console.log(`[metrics] ${req.method} ${pathLabel} ${res.statusCode} ${ms}ms`);
    });
    next();
  });
  app.use("/api", chatRouter);
  app.use("/api/admin", adminRouter);

  // Servir frontend compilado
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const webBuildPath = path.join(__dirname, "../web/dist");
  app.use(express.static(webBuildPath));
  // Servir widget embebible
  app.get("/widget.js", (req, res) => {
    const widgetPath = path.join(__dirname, "../web/public/widget.js");
    res.type("application/javascript");
    res.sendFile(widgetPath);
  });

  // Health
  app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  // Fallback SPA: cualquier ruta no-API sirve index.html
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    if (req.path.includes(".")) return next();
    res.sendFile(path.join(webBuildPath, "index.html"), (err) => {
      if (err) {
        if (req.path === "/") {
          res.json({
            status: "✅ ConversaX Agent Kit v1 está corriendo",
            endpoints: { home: "/", health: "/health", chat: "/api/chat" },
            note: "Frontend no construido. Ejecuta 'npm run build:web'"
          });
        } else {
          res.status(404).json({ error: "Not found" });
        }
      }
    });
  });

  return app;
}

export default createServer;
