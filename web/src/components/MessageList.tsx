import type { FC } from 'react';
import type { ConversationMessage } from '../api/client';

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
