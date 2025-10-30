import { useEffect, useState } from 'react';
import { getProductApi, type Product } from '../api/client';

const ProductDetail = ({ id }: { id: string }): JSX.Element => {
  const [p, setP] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void (async () => {
    try { setP(await getProductApi(id)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  })(); }, [id]);

  if (error) return <p className="admin__error">{error}</p>;
  if (!p) return <p className="admin__status">Cargando…</p>;

  return (
    <section className="product-detail">
      <h2>{p.title || p.name}</h2>
      <div className="detail-grid">
        <div className="gallery">
          {(p.images || []).map((u, i) => (
            <img key={u} src={u} alt={`img-${i}`} />
          ))}
        </div>
        <div className="info">
          {p.subtitle ? <p className="muted">{p.subtitle}</p> : null}
          {p.description ? <p>{p.description}</p> : null}
        </div>
      </div>
    </section>
  );
};

export default ProductDetail;


