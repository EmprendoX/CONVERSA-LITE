import type { FC } from 'react';
import type { ChatResponsePayload } from '../api/client';

type Suggestion = NonNullable<ChatResponsePayload['ragResults']>[number];

interface SuggestedProductsProps {
  suggestions: Suggestion[] | null;
}

const SuggestedProducts: FC<SuggestedProductsProps> = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }
  return (
    <aside className="suggested" aria-labelledby="suggested-title">
      <h3 id="suggested-title">Productos sugeridos (RAG)</h3>
      <ul className="suggested__list">
        {suggestions.map((s) => (
          <li key={String(s.id)} className="suggested__item">
            <div className="suggested__name">{s.nombre}</div>
            <div className="suggested__meta">
              {s.categoria ? <span className="suggested__cat">{s.categoria}</span> : null}
              {typeof s.precio !== 'undefined' ? (
                <span className="suggested__price">${s.precio}</span>
              ) : null}
              {typeof s.score === 'number' ? (
                <span className="suggested__score">score {s.score.toFixed(3)}</span>
              ) : null}
            </div>
            {s.descripcion ? <p className="suggested__desc">{s.descripcion}</p> : null}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default SuggestedProducts;


