import type { FC } from 'react';
import type { ConversationMessage } from '../api/client';
import MessageInput from './MessageInput';
import MessageList from './MessageList';

interface ChatWindowProps {
  messages: ConversationMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  error: string | null;
}

const ChatWindow: FC<ChatWindowProps> = ({
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading,
  error
}) => {
  return (
    <section className="chat-window" aria-labelledby="chat-window-heading">
      <header>
        <h2 id="chat-window-heading" className="app__subtitle">
          Conversación
        </h2>
      </header>
      <div className="chat-window__content">
        <MessageList messages={messages} />
        {isLoading ? <p className="chat-window__status">El agente está escribiendo…</p> : null}
        {error ? <p className="chat-window__error">{error}</p> : null}
      </div>
      <MessageInput
        value={inputValue}
        onChange={onInputChange}
        onSubmit={onSendMessage}
        disabled={isLoading}
        isLoading={isLoading}
      />
    </section>
  );
};

export default ChatWindow;
