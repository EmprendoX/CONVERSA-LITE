import { useEffect, useState } from 'react';
import { getAdminPrompt, saveAdminPrompt, getAdminCatalog, saveAdminCatalog, adminSeed } from '../api/client';

const AdminPanel = (): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');

  const [catalog, setCatalog] = useState<string>('');

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const p = await getAdminPrompt();
        setName(p.name || '');
        setDescription(p.description || '');
        setPrompt(p.prompt || '');
        const c = await getAdminCatalog();
        setCatalog(formatJson(c));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSavePrompt = async () => {
    try {
      setLoading(true);
      setError(null);
      await saveAdminPrompt({ name, description, prompt });
      setOk('Prompt guardado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      await saveAdminCatalog(catalog);
      setOk('Catálogo guardado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el catálogo');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminSeed();
      setOk(`Índice regenerado (${res.items} items)`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo regenerar el índice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin" aria-labelledby="admin-title">
      <header className="admin__header">
        <h2 id="admin-title">Administración</h2>
        <p>Edita el prompt y el catálogo sin tocar archivos. Luego regenera el índice.</p>
      </header>

      {loading ? <p className="admin__status">Procesando…</p> : null}
      {error ? <p className="admin__error">{error}</p> : null}
      {ok ? <p className="admin__ok">{ok}</p> : null}

      <div className="admin__grid">
        <div className="admin__card">
          <h3>Prompt del agente</h3>
          <label>
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Descripción
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label>
            Prompt (sistema)
            <textarea rows={10} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </label>
          <button type="button" onClick={handleSavePrompt} disabled={loading}>Guardar prompt</button>
        </div>

        <div className="admin__card">
          <h3>Catálogo (JSON)</h3>
          <textarea rows={16} value={catalog} onChange={(e) => setCatalog(e.target.value)} />
          <div className="admin__actions">
            <button type="button" onClick={handleSaveCatalog} disabled={loading}>Guardar catálogo</button>
            <button type="button" onClick={handleSeed} disabled={loading}>Regenerar índice</button>
          </div>
        </div>
      </div>
    </section>
  );
};

function formatJson(input: string): string {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return input;
  }
}

export default AdminPanel;
