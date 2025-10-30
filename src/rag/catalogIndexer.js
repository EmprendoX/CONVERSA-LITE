import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createEmbedding } from "../services/openaiService.js";

let cachedIndex = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.resolve(__dirname, "../data/catalogo.json");
const indexPath = path.resolve(__dirname, "../data/catalogIndex.json");
const productsPath = path.resolve(__dirname, "../data/products.json");

async function ensureDataDir() {
  const dataDir = path.dirname(catalogPath);
  await fs.mkdir(dataDir, { recursive: true });
}

async function loadCatalog() {
  const raw = await fs.readFile(catalogPath, "utf8");
  const catalog = JSON.parse(raw);
  return catalog.productos || [];
}

async function loadProducts() {
  try {
    const raw = await fs.readFile(productsPath, "utf8");
    const products = JSON.parse(raw);
    return products.products || [];
  } catch (e) {
    return [];
  }
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
  const normalize = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}+/gu, "")
      .replace(/\s+/g, " ")
      .trim();

  const name = normalize(item.nombre);
  const desc = normalize(item.descripcion);
  const cat = normalize(item.categoria);
  const price = typeof item.precio !== "undefined" ? `precio ${item.precio}` : "";

  const weighted = [
    // Ponderación simple: nombre aparece dos veces para dar más señal semántica
    name,
    name,
    desc,
    cat ? `categoria ${cat}` : null,
    price || null
  ].filter(Boolean);

  return weighted.join(". ");
}

function buildProductText(product) {
  const normalize = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}+/gu, "")
      .replace(/\s+/g, " ")
      .trim();

  const name = normalize(product.name);
  const title = normalize(product.title);
  const subtitle = normalize(product.subtitle);
  const desc = normalize(product.description);

  const weighted = [
    name,
    title,
    title, // title repetido para más peso
    subtitle,
    desc
  ].filter(Boolean);

  return weighted.join(". ");
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
  const products = await loadProducts();
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

  for (const product of products) {
    const text = buildProductText(product);
    if (!text) {
      continue;
    }
    const embedding = await createEmbedding(text);
    index.push({
      id: product.id,
      item: {
        id: product.id,
        nombre: product.title || product.name,
        descripcion: product.description || product.subtitle || '',
        categoria: '',
        precio: undefined
      },
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
