import { useEffect, useState } from 'react';
import { getAdminPrompt, saveAdminPrompt } from '../api/client';
import AdminCredentials from './AdminCredentials';
import AdminProducts from './AdminProducts';
import AdminWidget from './AdminWidget';

const AdminPanel = (): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const p = await getAdminPrompt();
        setName(p.name || '');
        setDescription(p.description || '');
        setPrompt(p.prompt || '');
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


  return (
    <section className="admin" aria-labelledby="admin-title">
      <header className="admin__header">
        <h2 id="admin-title">Administración</h2>
        <p>Edita el prompt del agente y gestiona productos desde aquí.</p>
      </header>

      {loading ? <p className="admin__status">Procesando…</p> : null}
      {error ? <p className="admin__error">{error}</p> : null}
      {ok ? <p className="admin__ok">{ok}</p> : null}

      <div className="admin__grid">
        <div className="admin__card admin__card--full">
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

        <div className="admin__card admin__card--full">
          <AdminProducts />
        </div>

        <div className="admin__card admin__card--full">
          <AdminCredentials />
        </div>

        <div className="admin__card admin__card--full">
          <AdminWidget />
        </div>
      </div>
    </section>
  );
};

export default AdminPanel;
