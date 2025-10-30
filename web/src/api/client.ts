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

async function safeReadError(response: Response): Promise<string | null> {
  try {
    const text = await response.text();
    return text ? text : null;
  } catch (error) {
    console.error('Unable to parse error response', error);
    return null;
  }
}
