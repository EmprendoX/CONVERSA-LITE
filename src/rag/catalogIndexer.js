import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createEmbedding } from "../services/openaiService.js";

let cachedIndex = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.resolve(__dirname, "../data/catalogo.json");
const indexPath = path.resolve(__dirname, "../data/catalogIndex.json");

async function ensureDataDir() {
  const dataDir = path.dirname(catalogPath);
  await fs.mkdir(dataDir, { recursive: true });
}

async function loadCatalog() {
  const raw = await fs.readFile(catalogPath, "utf8");
  const catalog = JSON.parse(raw);
  return catalog.productos || [];
}

async function loadStoredIndex() {
  try {
    const raw = await fs.readFile(indexPath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("No se pudo leer el índice del catálogo:", error.message);
    }
  }
  return null;
}

async function persistIndex(index) {
  await ensureDataDir();
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), "utf8");
}

function buildItemText(item) {
  const parts = [item.nombre, item.descripcion, item.categoria ? `Categoría: ${item.categoria}` : null];
  if (typeof item.precio !== "undefined") {
    parts.push(`Precio: ${item.precio}`);
  }
  return parts.filter(Boolean).join(". ");
}

export async function buildCatalogIndex({ forceRebuild = false, persist = true } = {}) {
  if (cachedIndex && !forceRebuild) {
    return cachedIndex;
  }

  if (!forceRebuild) {
    const stored = await loadStoredIndex();
    if (stored) {
      cachedIndex = stored;
      return cachedIndex;
    }
  }

  const items = await loadCatalog();
  const index = [];

  for (const item of items) {
    const text = buildItemText(item);
    if (!text) {
      continue;
    }
    const embedding = await createEmbedding(text);
    index.push({
      id: item.id ?? item.nombre,
      item,
      embedding
    });
  }

  cachedIndex = index;

  if (persist) {
    await persistIndex(index);
  }

  return cachedIndex;
}

export function clearCatalogIndexCache() {
  cachedIndex = null;
}

export function getCatalogIndexPath() {
  return indexPath;
}

export async function saveCatalogIndex(index) {
  await persistIndex(index);
}

export default buildCatalogIndex;
