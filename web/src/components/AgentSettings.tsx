import type { ChangeEvent, FC } from 'react';

interface AgentOption {
  value: string;
  label: string;
  description?: string;
}

interface AgentSettingsProps {
  agent: string;
  onAgentChange: (agent: string) => void;
  useCatalog: boolean;
  onUseCatalogChange: (useCatalog: boolean) => void;
  agentOptions: AgentOption[];
}

const AgentSettings: FC<AgentSettingsProps> = ({
  agent,
  onAgentChange,
  useCatalog,
  onUseCatalogChange,
  agentOptions
}) => {
  const handleAgentChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onAgentChange(event.target.value);
  };

  const handleCatalogChange = (event: ChangeEvent<HTMLInputElement>) => {
    onUseCatalogChange(event.target.checked);
  };

  const activeAgent = agentOptions.find((option) => option.value === agent);

  return (
    <section className="agent-settings" aria-labelledby="agent-settings-heading">
      <div className="agent-settings__group">
        <h2 id="agent-settings-heading" className="app__subtitle">
          Preferencias del agente
        </h2>
        <div>
          <label className="agent-settings__label" htmlFor="agent-select">
            Selecciona un agente
          </label>
          <select
            id="agent-select"
            className="agent-settings__select"
            value={agent}
            onChange={handleAgentChange}
          >
            {agentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {activeAgent?.description ? (
          <p className="message-input__hint">{activeAgent.description}</p>
        ) : null}
      </div>

      <div className="agent-settings__group">
        <label className="agent-settings__toggle" htmlFor="use-catalog-toggle">
          <input
            id="use-catalog-toggle"
            type="checkbox"
            checked={useCatalog}
            onChange={handleCatalogChange}
          />
          <span>Usar catálogo (RAG)</span>
        </label>
        <p className="message-input__hint">
          Activa esta opción para habilitar el catálogo y recuperar información relevante en las respuestas.
        </p>
      </div>
    </section>
  );
};

export default AgentSettings;
