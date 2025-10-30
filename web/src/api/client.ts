export type MessageRole = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
}

export interface ChatRequestPayload {
  sessionId?: string;
  useCatalog: boolean;
  message: string;
}

export interface ChatResponsePayload {
  reply: string;
  sessionId: string;
  agent?: {
    name: string;
    description: string;
  };
  memoryProvider?: string;
  ragResults?: Array<{
    id: string;
    nombre: string;
    descripcion?: string;
    precio?: number;
    categoria?: string;
    score?: number;
  }>;
}

const API_BASE_URL = '/api';

export async function postChatMessage(
  payload: ChatRequestPayload,
  options: { signal?: AbortSignal } = {}
): Promise<ChatResponsePayload> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal: options.signal
  });

  if (!response.ok) {
    const errorBody = await safeReadError(response);
    throw new Error(errorBody ?? `Error ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as ChatResponsePayload;
}

export interface StreamEvent {
  delta?: string;
  done?: boolean;
  sessionId?: string;
  agent?: { name: string; description: string };
  ragResults?: ChatResponsePayload['ragResults'];
  error?: string;
}

export async function* streamChatMessage(
  payload: ChatRequestPayload,
  options: { signal?: AbortSignal } = {}
): AsyncGenerator<StreamEvent, void, unknown> {
  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: options.signal
  });

  if (!response.ok || !response.body) {
    const errorBody = await safeReadError(response);
    throw new Error(errorBody ?? `Error ${response.status}: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');

      for (const line of rawEvent.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const json = trimmed.slice(5).trim();
        if (!json) continue;
        try {
          const evt = JSON.parse(json) as StreamEvent;
          yield evt;
        } catch (e) {
          // ignore malformed chunk
        }
      }
    }
  }
}

export async function postFeedback(payload: {
  sessionId: string;
  messageId: string;
  rating: 'up' | 'down';
  comment?: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chat/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`No se pudo registrar el feedback (${response.status})`);
  }
}

// Admin APIs
export async function getAdminPrompt(): Promise<{ name: string; description: string; prompt: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/prompt`);
  if (!res.ok) throw new Error(`Error obteniendo prompt (${res.status})`);
  return res.json();
}

export async function saveAdminPrompt(data: { name?: string; description?: string; prompt: string }): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Error guardando prompt (${res.status})`);
}

export async function getAdminCatalog(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/admin/catalog`);
  if (!res.ok) throw new Error(`Error obteniendo catálogo (${res.status})`);
  return res.text();
}

export async function saveAdminCatalog(rawJson: string): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('El catálogo debe ser JSON válido');
  }
  const res = await fetch(`${API_BASE_URL}/admin/catalog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed)
  });
  if (!res.ok) throw new Error(`Error guardando catálogo (${res.status})`);
}

export async function adminSeed(): Promise<{ ok: boolean; items: number }> {
  const res = await fetch(`${API_BASE_URL}/admin/seed`, { method: 'POST' });
  if (!res.ok) throw new Error(`Error regenerando índice (${res.status})`);
  return res.json();
}

async function safeReadError(response: Response): Promise<string | null> {
  try {
    const text = await response.text();
    return text ? text : null;
  } catch (error) {
    console.error('Unable to parse error response', error);
    return null;
  }
}
