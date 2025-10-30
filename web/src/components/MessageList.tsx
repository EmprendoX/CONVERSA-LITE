import type { FC } from 'react';
import type { ConversationMessage } from '../api/client';
import { postFeedback } from '../api/client';

interface MessageListProps {
  messages: ConversationMessage[];
}

const roleLabels: Record<string, string> = {
  user: 'Tú',
  assistant: 'Asistente',
  system: 'Sistema'
};

const MessageList: FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="message-list" aria-live="polite" aria-label="Historial de la conversación">
      {messages.length === 0 ? (
        <p className="message-input__hint">
          Inicia la conversación para que el agente te ayude. Usa el campo inferior para enviar tu mensaje.
        </p>
      ) : (
        messages.map((message) => {
          const isUser = message.role === 'user';
          const label = roleLabels[message.role] ?? message.role;
          const formattedTime = formatTimestamp(message.createdAt);

          return (
            <article
              key={message.id}
              className={`message ${isUser ? 'message--user' : 'message--assistant'}`}
              aria-label={`${label} a las ${formattedTime}`}
            >
              <header className="message__timestamp">
                {label} · {formattedTime}
              </header>
              <p>{message.content}</p>
              <footer className="message__actions" aria-label="Acciones del mensaje">
                {!isUser ? (
                  <>
                    <button
                      className="message__action"
                      type="button"
                      aria-label="Útil"
                      onClick={() => safeSendFeedback(message.id, 'up')}
                    >
                      👍
                    </button>
                    <button
                      className="message__action"
                      type="button"
                      aria-label="No útil"
                      onClick={() => safeSendFeedback(message.id, 'down')}
                    >
                      👎
                    </button>
                  </>
                ) : null}
              </footer>
            </article>
          );
        })
      )}
    </div>
  );
};

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default MessageList;

async function safeSendFeedback(messageId: string, rating: 'up' | 'down') {
  try {
    const sessionId = window.localStorage.getItem('chat:activeSession') || '';
    if (!sessionId) return;
    await postFeedback({ sessionId, messageId, rating });
  } catch {
    // noop
  }
}
