import { Router } from 'express';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct, saveBase64Image } from '../services/productStore.js';
import { validateProductCreateUpdate, sanitizeProductInput, validateImageDataUrl } from '../utils/validators.js';

const router = Router();

// Listar
router.get('/', (req, res) => {
  res.json({ products: listProducts() });
});

// Crear
router.post('/', (req, res) => {
  const errors = validateProductCreateUpdate(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });
  const { name, title, subtitle, description } = sanitizeProductInput(req.body || {});
  const p = createProduct({ name, title, subtitle, description });
  res.status(201).json(p);
});

// Detalle
router.get('/:id', (req, res) => {
  const p = getProduct(req.params.id);
  if (!p) return res.status(404).json({ error: 'No encontrado' });
  res.json(p);
});

// Actualizar
router.put('/:id', (req, res) => {
  const patch = sanitizeProductInput(req.body || {});
  const p = updateProduct(req.params.id, patch);
  if (!p) return res.status(404).json({ error: 'No encontrado' });
  res.json(p);
});

// Eliminar
router.delete('/:id', (req, res) => {
  const ok = deleteProduct(req.params.id);
  if (!ok) return res.status(404).json({ error: 'No encontrado' });
  res.json({ ok: true });
});

// Subir imagen como dataURL base64
router.post('/:id/images', (req, res) => {
  const { dataUrl } = req.body || {};
  const errors = validateImageDataUrl(dataUrl);
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });
  try {
    const url = saveBase64Image(req.params.id, dataUrl);
    res.status(201).json({ url });
  } catch (e) {
    res.status(400).json({ error: e.message || 'No se pudo guardar imagen' });
  }
});

export default router;


