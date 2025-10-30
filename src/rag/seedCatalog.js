import fs from "fs/promises";
import path from "path";
import { buildCatalogIndex, clearCatalogIndexCache, getCatalogIndexPath } from "./catalogIndexer.js";

async function main() {
  console.log("🛠️ Generando embeddings del catálogo...");

  clearCatalogIndexCache();
  const index = await buildCatalogIndex({ forceRebuild: true, persist: false });

  const indexPath = getCatalogIndexPath();
  await fs.mkdir(path.dirname(indexPath), { recursive: true });
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), "utf8");

  console.log(`✅ Embeddings generados: ${index.length} ítems guardados en ${indexPath}`);
}

main().catch((error) => {
  console.error("❌ Error generando embeddings del catálogo:", error);
  process.exitCode = 1;
});
