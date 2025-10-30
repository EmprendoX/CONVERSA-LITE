import { useEffect, useState } from 'react';
import { listProductsApi, type Product } from '../api/client';

const ProductsGrid = (): JSX.Element => {
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void (async () => {
    try { const res = await listProductsApi(); setItems(res.products); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  })(); }, []);

  const filtered = items.filter(p => (p.title || p.name || '').toLowerCase().includes(q.toLowerCase()));

  const open = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'product');
    url.searchParams.set('id', id);
    window.location.href = url.toString();
  };

  return (
    <section className="products-grid" aria-labelledby="pg-title">
      <h2 id="pg-title">Productos</h2>
      {error ? <p className="admin__error">{error}</p> : null}
      <input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid-cards">
        {filtered.map((p) => (
          <article key={p.id} className="card" onClick={() => open(p.id)}>
            <img src={(p.images && p.images[0]) || '/favicon.ico'} alt={p.title || p.name} />
            <h3>{p.title || p.name}</h3>
            {p.subtitle ? <p className="muted">{p.subtitle}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
};

export default ProductsGrid;


