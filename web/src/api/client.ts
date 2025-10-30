export type MessageRole = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
}

export interface ChatRequestPayload {
  sessionId: string;
  agent: string;
  useCatalog: boolean;
  message: string;
  history: Array<Pick<ConversationMessage, 'role' | 'content'>>;
}

export interface ChatResponsePayload {
  reply: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
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
