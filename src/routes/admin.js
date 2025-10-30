import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { clearCatalogIndexCache, buildCatalogIndex, getCatalogIndexPath } from "../rag/catalogIndexer.js";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const agentPath = path.resolve(__dirname, "../agents/primary.json");
const catalogPath = path.resolve(__dirname, "../data/catalogo.json");

// Prompt
router.get("/prompt", async (_req, res) => {
  try {
    const raw = await fs.readFile(agentPath, "utf8");
    return res.json(JSON.parse(raw));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/prompt", async (req, res) => {
  try {
    const { name, description, prompt } = req.body || {};
    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "El campo 'prompt' es obligatorio" });
    }
    const next = {
      name: typeof name === "string" && name.trim() ? name : "Agente Comercial Inteligente",
      description: typeof description === "string" && description.trim() ? description : "",
      prompt: prompt.trim()
    };
    await fs.writeFile(agentPath, JSON.stringify(next, null, 2), "utf8");
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Catálogo
router.get("/catalog", async (_req, res) => {
  try {
    const raw = await fs.readFile(catalogPath, "utf8");
    return res.type("application/json").send(raw);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/catalog", async (req, res) => {
  try {
    // Se espera JSON con shape { productos: [...] }
    if (!req.body || typeof req.body !== "object" || !Array.isArray(req.body.productos)) {
      return res.status(400).json({ error: "Formato inválido. Se espera { productos: [...] }" });
    }
    await fs.writeFile(catalogPath, JSON.stringify(req.body, null, 2), "utf8");
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Regenerar índice RAG
router.post("/seed", async (_req, res) => {
  try {
    clearCatalogIndexCache();
    const index = await buildCatalogIndex({ forceRebuild: true, persist: true });
    return res.json({ ok: true, items: index.length, indexPath: getCatalogIndexPath() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;


