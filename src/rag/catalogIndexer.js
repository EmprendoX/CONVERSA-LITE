import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createEmbedding } from "../services/openaiService.js";

let cachedIndex = null;

async function loadCatalog() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const catalogPath = path.resolve(__dirname, "../data/catalogo.json");
  const raw = await fs.readFile(catalogPath, "utf8");
  const catalog = JSON.parse(raw);
  return catalog.productos || [];
}

function buildItemText(item) {
  const parts = [item.nombre, item.descripcion, item.categoria ? `Categoría: ${item.categoria}` : null];
  if (typeof item.precio !== "undefined") {
    parts.push(`Precio: ${item.precio}`);
  }
  return parts.filter(Boolean).join(". ");
}

export async function buildCatalogIndex() {
  if (cachedIndex) {
    return cachedIndex;
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
  return cachedIndex;
}

export function clearCatalogIndexCache() {
  cachedIndex = null;
}

export default buildCatalogIndex;
