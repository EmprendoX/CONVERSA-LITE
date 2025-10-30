import type { FC, FormEvent, KeyboardEvent } from 'react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const MessageInput: FC<MessageInputProps> = ({ value, onChange, onSubmit, disabled = false, isLoading = false }) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || isLoading || value.trim().length === 0) {
      return;
    }

    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (!disabled && !isLoading && value.trim().length > 0) {
        onSubmit();
      }
    }
  };

  const isSubmitDisabled = disabled || isLoading || value.trim().length === 0;

  return (
    <div className="message-input">
      <form onSubmit={handleSubmit}>
        <label className="agent-settings__label" htmlFor="chat-input">
          Mensaje
        </label>
        <textarea
          id="chat-input"
          className="message-input__field"
          placeholder="Escribe tu mensaje o pregunta..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />

        <div className="message-input__actions">
          <span className="message-input__hint">Usa Ctrl + Enter para enviar rápidamente.</span>
          <button className="message-input__button" type="submit" disabled={isSubmitDisabled}>
            {isLoading ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
