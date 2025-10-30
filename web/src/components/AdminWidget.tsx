import { useMemo, useState } from 'react';

const AdminWidget = (): JSX.Element => {
  const [title, setTitle] = useState('¿Necesitas ayuda?');
  const [color, setColor] = useState('#7c3aed');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [greet, setGreet] = useState('Hola 👋 ¿En qué puedo ayudarte hoy?');
  const [host, setHost] = useState('');
  const [apiBase, setApiBase] = useState('/api/public');
  const [copied, setCopied] = useState<string | null>(null);

  const snippet = useMemo(() => {
    const attrs = [
      `src="${host || (typeof window !== 'undefined' ? window.location.origin : '')}/widget.js"`,
      `data-title="${escapeHtml(title)}"`,
      `data-color="${color}"`,
      `data-position="${position}"`,
      `data-greet="${escapeHtml(greet)}"`,
      `data-host="${host || (typeof window !== 'undefined' ? window.location.origin : '')}"`,
      `data-api-base="${apiBase}"`
    ].join(' ');
    return `<script ${attrs}></script>`;
  }, [title, color, position, greet, host, apiBase]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied('Copiado');
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied('No se pudo copiar');
      setTimeout(() => setCopied(null), 1500);
    }
  };

  const onDownload = () => {
    const html = `<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8"/>\n<meta name="viewport" content="width=device-width, initial-scale=1"/>\n<title>Widget Conversa</title>\n</head>\n<body>\n${snippet}\n</body>\n</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'widget.html';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  };

  const applyPreset = (preset: 'violeta' | 'azul' | 'verde') => {
    if (preset === 'violeta') setColor('#7c3aed');
    else if (preset === 'azul') setColor('#0ea5e9');
    else setColor('#10b981');
    setTitle('¿Necesitas ayuda?');
    setGreet('Hola 👋 ¿En qué puedo ayudarte hoy?');
    setPosition('bottom-right');
  };

  return (
    <section className="admin-widget" aria-labelledby="widget-title">
      <h3 id="widget-title">Generador de Widget (chat externo)</h3>
      <p className="admin__hint">Inserta este snippet en tu sitio público. Usará el endpoint {apiBase}.</p>

      <div className="admin__grid admin-widget__grid">
        <div className="admin__card">
          <h4>Configuración</h4>
          <div className="creds__form admin-widget__form">
            <label className="creds__field" style={{ gridColumn: '1 / -1' }}>
              Título
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="creds__field">
              Color
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </label>
            <label className="creds__field">
              Posición
              <select value={position} onChange={(e) => setPosition(e.target.value as any)}>
                <option value="bottom-right">bottom-right</option>
                <option value="bottom-left">bottom-left</option>
              </select>
            </label>
            <label className="creds__field" style={{ gridColumn: '1 / -1' }}>
              Mensaje de saludo
              <input value={greet} onChange={(e) => setGreet(e.target.value)} />
            </label>
            <label className="creds__field" style={{ gridColumn: '1 / -1' }}>
              Host (opcional)
              <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="https://tu-dominio.com" />
            </label>
            <label className="creds__field" style={{ gridColumn: '1 / -1' }}>
              API base
              <input value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="admin__card">
          <h4>Snippet</h4>
          <div className="admin__actions" style={{ marginBottom: '.5rem' }}>
            <span className="admin__hint">Presets rápidos:</span>
            <button type="button" onClick={() => applyPreset('violeta')}>Violeta</button>
            <button type="button" onClick={() => applyPreset('azul')}>Azul</button>
            <button type="button" onClick={() => applyPreset('verde')}>Verde</button>
          </div>
          <textarea rows={6} readOnly value={snippet} />
          <div className="admin__actions">
            <button type="button" onClick={onCopy}>Copiar</button>
            <button type="button" onClick={onDownload}>Descargar widget.html</button>
            {copied ? <span className="admin__hint">{copied}</span> : null}
          </div>
        </div>
      </div>
    </section>
  );
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default AdminWidget;


