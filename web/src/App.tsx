import { useCallback, useEffect, useReducer } from 'react';
import ChatControls from './components/ChatControls';
import ChatWindow from './components/ChatWindow';
import { postChatMessage, type ConversationMessage, type MessageRole } from './api/client';

interface ChatState {
  sessionId: string;
  useCatalog: boolean;
  messages: ConversationMessage[];
  input: string;
  isLoading: boolean;
  error: string | null;
}

interface StoredChatState {
  useCatalog: boolean;
  messages: ConversationMessage[];
}

const BASE_STATE: ChatState = {
  sessionId: '',
  useCatalog: true,
  messages: [],
  input: '',
  isLoading: false,
  error: null
};

type ChatAction =
  | { type: 'SET_USE_CATALOG'; useCatalog: boolean }
  | { type: 'SET_INPUT'; input: string }
  | { type: 'ADD_MESSAGE'; message: ConversationMessage }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_SESSION_ID'; sessionId: string }
  | { type: 'RESET_CONVERSATION'; sessionId: string };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_USE_CATALOG':
      return { ...state, useCatalog: action.useCatalog };
    case 'SET_INPUT':
      return { ...state, input: action.input };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.sessionId };
    case 'RESET_CONVERSATION':
      return {
        ...state,
        sessionId: action.sessionId,
        messages: [],
        input: '',
        error: null
      };
    default:
      return state;
  }
}

const App = (): JSX.Element => {
  const [state, dispatch] = useReducer(chatReducer, BASE_STATE, initializeState);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    persistState(state);
  }, [state.sessionId, state.messages, state.useCatalog]);

  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = state.input.trim();
    if (!trimmedMessage || state.isLoading) {
      return;
    }

    const userMessage = createMessage('user', trimmedMessage);

    dispatch({ type: 'ADD_MESSAGE', message: userMessage });
    dispatch({ type: 'SET_INPUT', input: '' });
    dispatch({ type: 'SET_LOADING', isLoading: true });
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      const response = await postChatMessage({
        sessionId: state.sessionId,
        useCatalog: state.useCatalog,
        message: trimmedMessage
      });

      if (response.sessionId && response.sessionId !== state.sessionId) {
        dispatch({ type: 'SET_SESSION_ID', sessionId: response.sessionId });
      }

      if (!response.reply || typeof response.reply !== 'string') {
        throw new Error('La respuesta del servidor no es válida.');
      }

      const assistantMessage = createMessage('assistant', response.reply);
      dispatch({ type: 'ADD_MESSAGE', message: assistantMessage });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      dispatch({ type: 'SET_ERROR', error: message });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [state.input, state.isLoading, state.sessionId, state.useCatalog]);

  const handleInputChange = useCallback((value: string) => {
    dispatch({ type: 'SET_INPUT', input: value });
  }, []);

  const handleCatalogToggle = useCallback((useCatalog: boolean) => {
    dispatch({ type: 'SET_USE_CATALOG', useCatalog });
  }, []);

  const handleSessionReset = useCallback(() => {
    const newSessionId = createSessionId();
    dispatch({ type: 'RESET_CONVERSATION', sessionId: newSessionId });
  }, []);

  return (
    <div className="app">
      <main className="app__card">
        <header className="app__header">
          <h1 className="app__title">Conversa Lite</h1>
          <p className="app__subtitle">
            Prueba el agente comercial único, agrega memoria por sesión y decide si quieres usar el catálogo como contexto.
          </p>
        </header>

        <div className="panel-grid">
          <ChatControls
            sessionId={state.sessionId}
            onSessionReset={handleSessionReset}
            useCatalog={state.useCatalog}
            onUseCatalogChange={handleCatalogToggle}
          />

          <ChatWindow
            messages={state.messages}
            inputValue={state.input}
            onInputChange={handleInputChange}
            onSendMessage={handleSendMessage}
            isLoading={state.isLoading}
            error={state.error}
          />
        </div>
      </main>
    </div>
  );
};

function initializeState(): ChatState {
  if (typeof window === 'undefined') {
    return { ...BASE_STATE, sessionId: createSessionId() };
  }

  const storedSessionId = window.localStorage.getItem('chat:activeSession');
  const sessionId = storedSessionId ?? createSessionId();
  const storedState = loadStoredState(sessionId);

  if (!storedSessionId) {
    window.localStorage.setItem('chat:activeSession', sessionId);
  }

  return {
    ...BASE_STATE,
    sessionId,
    useCatalog: storedState?.useCatalog ?? BASE_STATE.useCatalog,
    messages: storedState?.messages ?? BASE_STATE.messages
  };
}

function createMessage(role: MessageRole, content: string): ConversationMessage {
  return {
    id: createIdentifier(`msg-${role}`),
    role,
    content,
    createdAt: Date.now()
  };
}

function createSessionId(): string {
  return createIdentifier('session');
}

function createIdentifier(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadStoredState(sessionId: string): StoredChatState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(`chat:session:${sessionId}`);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredChatState>;

    return {
      useCatalog: typeof parsed.useCatalog === 'boolean' ? parsed.useCatalog : BASE_STATE.useCatalog,
      messages: sanitizeMessages(parsed.messages)
    };
  } catch (error) {
    console.warn('No fue posible recuperar la conversación almacenada', error);
    return null;
  }
}

function sanitizeMessages(value: unknown): ConversationMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const maybeMessage = item as Partial<ConversationMessage> & { role?: string };
      if (
        typeof maybeMessage.id !== 'string' ||
        typeof maybeMessage.content !== 'string' ||
        typeof maybeMessage.createdAt !== 'number'
      ) {
        return null;
      }

      if (!isValidRole(maybeMessage.role)) {
        return null;
      }

      return {
        id: maybeMessage.id,
        role: maybeMessage.role,
        content: maybeMessage.content,
        createdAt: maybeMessage.createdAt
      } satisfies ConversationMessage;
    })
    .filter((message): message is ConversationMessage => Boolean(message));
}

function isValidRole(role: unknown): role is MessageRole {
  return role === 'user' || role === 'assistant' || role === 'system';
}

function persistState(state: ChatState): void {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: StoredChatState = {
    useCatalog: state.useCatalog,
    messages: state.messages
  };

  window.localStorage.setItem('chat:activeSession', state.sessionId);
  window.localStorage.setItem(`chat:session:${state.sessionId}`, JSON.stringify(payload));
}

export default App;
