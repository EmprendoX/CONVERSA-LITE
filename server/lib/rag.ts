// RAG simple con CSV - placeholder para implementación futura
// Por ahora retorna array vacío, luego se puede cargar desde CSV en memoria

export interface RAGContext {
  snippets: string[];
}

export async function retrieveContext(query: string, topK: number = 3): Promise<RAGContext> {
  // TODO: Implementar carga de CSV de catálogo
  // TODO: Implementar búsqueda por similitud o substring
  // Por ahora retorna contexto vacío
  return {
    snippets: [],
  };
}

export function formatRAGContext(context: RAGContext): string {
  if (context.snippets.length === 0) {
    return '';
  }
  return '\n\nContexto del catálogo:\n' + context.snippets.join('\n\n');
}


