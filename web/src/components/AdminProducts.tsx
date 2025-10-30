import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { adminSeed, createProductApi, listProductsApi, type Product, uploadProductImageApi, updateProductApi, deleteProductApi } from '../api/client';

const AdminProducts = (): JSX.Element => {
  const [list, setList] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [current, setCurrent] = useState<Partial<Product>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);

  async function refresh() {
    try {
      const res = await listProductsApi();
      setList(res.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error listando productos');
    }
  }

  useEffect(() => { void refresh(); }, []);

  const canCreate = useMemo(() => Boolean(current.name && current.title), [current.name, current.title]);

  const create = async () => {
    try {
      setLoading(true); setError(null); setOk(null);
      const p = await createProductApi({
        name: current.name as string,
        title: current.title as string,
        subtitle: current.subtitle || '',
        description: current.description || ''
      });
      setCurrent(p);
      setOk('Producto creado');
      // si había imágenes en cola, súbelas ahora
      if (queuedFiles.length) {
        for (const file of queuedFiles) {
          const dataUrl = await fileToDataUrl(file);
          const { url } = await uploadProductImageApi(p.id, dataUrl);
          p.images = [...(p.images || []), url];
          setCurrent({ ...p });
        }
        setQueuedFiles([]);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear');
    } finally { setLoading(false); }
  };

  const save = async () => {
    if (!current.id) return;
    try {
      setLoading(true); setError(null); setOk(null);
      const p = await updateProductApi(current.id, {
        name: current.name || '',
        title: current.title || '',
        subtitle: current.subtitle || '',
        description: current.description || '',
        images: current.images || []
      });
      setCurrent(p);
      setOk('Producto actualizado');
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar'); }
    finally { setLoading(false); }
  };

  const onPickImages = () => fileInputRef.current?.click();

  const onFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLoading(true); setError(null); setOk(null);
    try {
      // Si el producto ya existe, subir inmediatamente
      if (current.id) {
        for (const file of Array.from(files)) {
          const dataUrl = await fileToDataUrl(file);
          const { url } = await uploadProductImageApi(current.id, dataUrl);
          setCurrent((prev) => ({ ...prev, images: [...(prev.images || []), url] }));
        }
        setOk('Imágenes subidas');
        await refresh();
      } else {
        // Aún no existe: sólo colar archivos y mostrar preview temporal
        setQueuedFiles((prev) => [...prev, ...Array.from(files)]);
        setOk('Imágenes en cola. Se subirán al crear el producto.');
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo procesar imágenes'); }
    finally { setLoading(false); (fileInputRef.current && (fileInputRef.current.value = '')); }
  };

  const seedIndex = async () => {
    try { setLoading(true); setError(null); setOk(null); const r = await adminSeed(); setOk(`Índice regenerado (${r.items})`); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo regenerar índice'); }
    finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar producto?')) return;
    try { setLoading(true); await deleteProductApi(id); await refresh(); if (current.id === id) setCurrent({}); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo eliminar'); }
    finally { setLoading(false); }
  };

  const removeImage = (url: string) => {
    if (!current.id) return;
    const images = (current.images || []).filter((u) => u !== url);
    setCurrent({ ...current, images });
  };

  const removeQueued = (file: File) => {
    setQueuedFiles((prev) => prev.filter((f) => f !== file));
  };

  const onDrop = async (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    if (!current.id) return;
    const files = ev.dataTransfer.files;
    if (files && files.length) {
      await onFilesSelected(files);
    }
  };

  const onPaste = async (ev: React.ClipboardEvent<HTMLDivElement>) => {
    const items = ev.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === 'file') {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) {
      const list = {
        length: files.length,
        item: (idx: number) => files[idx] || null,
        [Symbol.iterator]: function* () { for (const f of files) yield f; }
      } as unknown as FileList;
      await onFilesSelected(list);
    }
  };

  return (
    <section className="admin-products" aria-labelledby="admin-products-title">
      <h3 id="admin-products-title">Productos</h3>
      {loading ? <p className="admin__status">Procesando…</p> : null}
      {error ? <p className="admin__error">{error}</p> : null}
      {ok ? <p className="admin__ok">{ok}</p> : null}

      <div className="admin__grid">
        <div className="admin__card">
          <h4>Nuevo / Editar</h4>
          <div className="creds__form">
            <label className="creds__field">Nombre<input value={current.name || ''} onChange={(e) => setCurrent({ ...current, name: e.target.value })} /></label>
            <label className="creds__field">Título<input value={current.title || ''} onChange={(e) => setCurrent({ ...current, title: e.target.value })} /></label>
            <label className="creds__field">Subtítulo<input value={current.subtitle || ''} onChange={(e) => setCurrent({ ...current, subtitle: e.target.value })} /></label>
            <label className="creds__field" style={{ gridColumn: '1 / -1' }}>Descripción<textarea rows={6} value={current.description || ''} onChange={(e) => setCurrent({ ...current, description: e.target.value })} /></label>
            <div className="creds__actions">
              {!current.id ? (
                <button type="button" onClick={create} disabled={!canCreate}>Crear producto</button>
              ) : (
                <button type="button" onClick={save}>Guardar cambios</button>
              )}
              <button type="button" onClick={seedIndex}>Regenerar índice</button>
            </div>
          </div>

          {current.id ? (
            <div className="creds__quick" style={{ marginTop: '0.75rem' }} onDragOver={(e) => e.preventDefault()} onDrop={onDrop} onPaste={onPaste}>
              <h5 style={{ gridColumn: '1 / -1', margin: 0 }}>Imágenes</h5>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple style={{ display: 'none' }} onChange={(e) => onFilesSelected(e.target.files)} />
              <button type="button" onClick={onPickImages} style={{ gridColumn: '1 / -1' }}>Subir imágenes…</button>
              <p style={{ gridColumn: '1 / -1', margin: 0, color: 'rgba(148,163,184,.8)' }}>También puedes arrastrar o pegar imágenes aquí.</p>
              {(current.images || []).map((url, i) => (
                <div key={url} className="product-thumb">
                  <img src={url} alt="thumb" />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <small>#{i + 1}</small>
                    <button type="button" onClick={() => removeImage(url)}>Quitar</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="creds__quick" style={{ marginTop: '0.75rem' }} onDragOver={(e) => e.preventDefault()} onDrop={onDrop} onPaste={onPaste}>
              <h5 style={{ gridColumn: '1 / -1', margin: 0 }}>Imágenes (se subirán al crear)</h5>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple style={{ display: 'none' }} onChange={(e) => onFilesSelected(e.target.files)} />
              <button type="button" onClick={onPickImages} style={{ gridColumn: '1 / -1' }}>Elegir imágenes…</button>
              <p style={{ gridColumn: '1 / -1', margin: 0, color: 'rgba(148,163,184,.8)' }}>Puedes arrastrar o pegar imágenes aquí antes de crear el producto.</p>
              {queuedFiles.map((file, i) => (
                <div key={`${file.name}-${i}`} className="product-thumb">
                  <img src={URL.createObjectURL(file)} alt="preview" />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <small>#{i + 1}</small>
                    <button type="button" onClick={() => removeQueued(file)}>Quitar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin__card">
          <h4>Listado</h4>
          <input
            placeholder="Buscar por nombre o título…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ marginBottom: '.5rem' }}
          />
          <table className="product-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Imagenes</th>
                <th>Actualizado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(list.filter(p => (p.title || p.name || '').toLowerCase().includes(q.toLowerCase()))).map((p) => (
                <tr key={p.id} className={p.id === current.id ? 'is-active' : ''}>
                  <td>
                    <button type="button" onClick={() => setCurrent(p)} className="linklike">
                      {p.title || p.name}
                    </button>
                  </td>
                  <td>{(p.images || []).length}</td>
                  <td className="muted">{new Date(p.updatedAt).toLocaleDateString()}</td>
                  <td><button type="button" onClick={() => remove(p.id)}>Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

async function fileToDataUrl(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const ext = file.type || 'image/png';
  return `data:${ext};base64,${base64}`;
}

export default AdminProducts;


