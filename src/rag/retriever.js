import { buildCatalogIndex } from "./catalogIndexer.js";
import { createEmbedding } from "../services/openaiService.js";

// LRU cache ligero en memoria para reducir costos de embeddings y mejorar latencia
const DEFAULT_MAX_ENTRIES = 100;
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutos

const ragCache = new Map(); // key -> { value, expiresAt }

function makeCacheKey(query, topK) {
  const norm = String(query || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${norm}::${topK}`;
}

function getFromCache(key) {
  const hit = ragCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt && Date.now() > hit.expiresAt) {
    ragCache.delete(key);
    return null;
  }
  // renovar orden LRU
  ragCache.delete(key);
  ragCache.set(key, hit);
  return hit.value;
}

function setInCache(key, value, { ttlMs = DEFAULT_TTL_MS, maxEntries = DEFAULT_MAX_ENTRIES } = {}) {
  // mantener tamaño
  if (ragCache.size >= maxEntries) {
    const oldestKey = ragCache.keys().next().value;
    if (oldestKey) ragCache.delete(oldestKey);
  }
  ragCache.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : 0 });
}

function cosineSimilarity(vectorA, vectorB) {
  const dotProduct = vectorA.reduce((sum, value, index) => sum + value * (vectorB[index] || 0), 0);
  const magnitudeA = Math.sqrt(vectorA.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(vectorB.reduce((sum, value) => sum + value * value, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

export async function retrieveRelevantItems(query, { topK = 3, index, cache = true } = {}) {
  if (!query) {
    return [];
  }

  const catalogIndex = index || (await buildCatalogIndex());

  if (!catalogIndex.length) {
    return [];
  }

  const cacheKey = makeCacheKey(query, topK);
  if (cache) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  const queryEmbedding = await createEmbedding(query);

  const scored = catalogIndex.map((entry) => ({
    ...entry,
    score: cosineSimilarity(queryEmbedding, entry.embedding)
  }));

  const result = scored
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  if (cache) {
    setInCache(cacheKey, result, {});
  }

  return result;
}

export default retrieveRelevantItems;

// Hechos estructurados listos para inyección en prompt
export async function retrieveStructuredFacts(query, options = {}) {
  const results = await retrieveRelevantItems(query, options);
  return results.map(({ item, score }) => ({
    id: item.id,
    titulo: item.nombre,
    descripcion: item.descripcion,
    categoria: item.categoria,
    precio: typeof item.precio !== "undefined" ? item.precio : undefined,
    url: item.url || undefined,
    confianza: Number.isFinite(score) ? Number(score.toFixed(3)) : 0
  }));
}
