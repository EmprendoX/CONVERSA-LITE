import type { ChangeEvent, FC } from 'react';

interface ChatControlsProps {
  sessionId: string;
  onSessionReset: () => void;
  useCatalog: boolean;
  onUseCatalogChange: (useCatalog: boolean) => void;
}

const ChatControls: FC<ChatControlsProps> = ({
  sessionId,
  onSessionReset,
  useCatalog,
  onUseCatalogChange
}) => {
  const handleCatalogChange = (event: ChangeEvent<HTMLInputElement>) => {
    onUseCatalogChange(event.target.checked);
  };

  return (
    <section className="chat-controls" aria-labelledby="chat-controls-heading">
      <header className="chat-controls__header">
        <h2 id="chat-controls-heading" className="chat-controls__title">
          Configuración rápida
        </h2>
        <p className="chat-controls__subtitle">
          Ajusta la memoria y el catálogo para este agente comercial.
        </p>
      </header>

      <div className="chat-controls__card">
        <p className="chat-controls__label">ID de sesión actual</p>
        <code className="chat-controls__code" aria-live="polite">
          {sessionId}
        </code>
        <button type="button" className="chat-controls__button" onClick={onSessionReset}>
          Reiniciar conversación
        </button>
      </div>

      <div className="chat-controls__card">
        <label className="chat-controls__toggle" htmlFor="toggle-catalog">
          <input
            id="toggle-catalog"
            type="checkbox"
            checked={useCatalog}
            onChange={handleCatalogChange}
          />
          <span>
            Usar catálogo (RAG)
            <small>Recupera productos relevantes para enriquecer la respuesta.</small>
          </span>
        </label>
      </div>
    </section>
  );
};

export default ChatControls;
