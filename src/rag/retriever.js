import { buildCatalogIndex } from "./catalogIndexer.js";
import { createEmbedding } from "../services/openaiService.js";

function cosineSimilarity(vectorA, vectorB) {
  const dotProduct = vectorA.reduce((sum, value, index) => sum + value * (vectorB[index] || 0), 0);
  const magnitudeA = Math.sqrt(vectorA.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(vectorB.reduce((sum, value) => sum + value * value, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

export async function retrieveRelevantItems(query, { topK = 3, index } = {}) {
  if (!query) {
    return [];
  }

  const catalogIndex = index || (await buildCatalogIndex());

  if (!catalogIndex.length) {
    return [];
  }

  const queryEmbedding = await createEmbedding(query);

  const scored = catalogIndex.map((entry) => ({
    ...entry,
    score: cosineSimilarity(queryEmbedding, entry.embedding)
  }));

  return scored
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export default retrieveRelevantItems;
