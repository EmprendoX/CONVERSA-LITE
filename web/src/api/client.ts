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

// Permite sobreescribir el API base vía query param (?apiBase=/api/public) o variable global (para widget)
const API_BASE_URL = ((): string => {
  if (typeof window !== 'undefined') {
    try {
      const baseFromQuery = new URLSearchParams(window.location.search).get('apiBase');
      // @ts-ignore
      const baseFromGlobal = (window as any).__CHAT_BASE as string | undefined;
      return (baseFromQuery || baseFromGlobal || '/api');
    } catch {}
  }
  return '/api';
})();

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

// Calendar APIs
export async function getCalendarAuthUrl(): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE_URL}/calendar/auth-url`);
  if (!res.ok) throw new Error(`Error obteniendo auth-url (${res.status})`);
  return res.json();
}

export async function getAvailability(params: { from: string; to: string }): Promise<{ timeMin: string; timeMax: string; busy: Array<{ start: string; end: string }> }> {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/calendar/availability?${q}`);
  if (!res.ok) throw new Error(`Error disponibilidad (${res.status})`);
  return res.json();
}

export async function createCalendarEvent(payload: { summary: string; description?: string; startISO: string; endISO: string; attendees?: Array<{ email: string }> }): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE_URL}/calendar/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Error creando evento (${res.status})`);
  return res.json();
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/calendar/events/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Error cancelando evento (${res.status})`);
}

// Admin Credentials APIs
export type Provider = 'google' | 'twilio' | 'meta' | 'vapi' | 'elevenlabs';

export async function getCredentials(masked = true): Promise<Record<string, Record<string, string>>> {
  const res = await fetch(`${API_BASE_URL}/admin/credentials/`);
  if (!res.ok) throw new Error(`Error leyendo credenciales (${res.status})`);
  return res.json();
}

export async function saveCredentialsApi(provider: Provider, data: Record<string, string>): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/credentials/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, data })
  });
  if (!res.ok) throw new Error(`Error guardando credenciales (${res.status})`);
}

export async function validateCredentialsApi(provider: Provider): Promise<{ ok: boolean; details?: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/credentials/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider })
  });
  if (!res.ok) throw new Error(`Error validando credenciales (${res.status})`);
  return res.json();
}

// Quick test senders
export async function waSend(payload: { to: string; text?: string; mediaUrl?: string; caption?: string; templateText?: string }): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}/wa/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`WA send error (${res.status})`);
  return res.json();
}

export async function metaSend(payload: { to: string; text?: string; mediaUrl?: string; caption?: string; type?: string; template?: { name: string; language?: string; components?: unknown[] } }): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}/meta/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Meta send error (${res.status})`);
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

// Products APIs
export interface Product {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  description?: string;
  images: string[];
  createdAt: number;
  updatedAt: number;
}

export async function listProductsApi(): Promise<{ products: Product[] }> {
  const res = await fetch(`${API_BASE_URL}/products`);
  if (!res.ok) throw new Error(`Error listando productos (${res.status})`);
  return res.json();
}

export async function createProductApi(payload: { name: string; title: string; subtitle?: string; description?: string }): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Error creando producto (${res.status})`);
  return res.json();
}

export async function updateProductApi(id: string, payload: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Error actualizando producto (${res.status})`);
  return res.json();
}

export async function uploadProductImageApi(id: string, dataUrl: string): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}/images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl })
  });
  if (!res.ok) throw new Error(`Error subiendo imagen (${res.status})`);
  return res.json();
}

export async function deleteProductApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Error eliminando producto (${res.status})`);
}

export async function getProductApi(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Error obteniendo producto (${res.status})`);
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
