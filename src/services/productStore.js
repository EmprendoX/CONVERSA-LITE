import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'products');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(path.dirname(UPLOADS_DIR))) fs.mkdirSync(path.dirname(UPLOADS_DIR), { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, JSON.stringify({ products: [] }, null, 2));
}

function readAll() {
  ensureDirs();
  const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeAll(db) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(db, null, 2));
}

export function listProducts() {
  return readAll().products;
}

export function getProduct(id) {
  return readAll().products.find(p => p.id === id) || null;
}

function generateId(name) {
  const slug = (name || 'producto').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 24);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `prod_${slug || 'item'}_${rnd}`;
}

export function createProduct({ name, title, subtitle, description }) {
  const db = readAll();
  const now = Date.now();
  const id = generateId(name);
  const product = { id, name, title, subtitle, description, images: [], createdAt: now, updatedAt: now };
  db.products.push(product);
  writeAll(db);
  return product;
}

export function updateProduct(id, patch) {
  const db = readAll();
  const idx = db.products.findIndex(p => p.id === id);
  if (idx === -1) return null;
  const next = { ...db.products[idx], ...patch, updatedAt: Date.now() };
  db.products[idx] = next;
  writeAll(db);
  return next;
}

export function deleteProduct(id) {
  const db = readAll();
  const idx = db.products.findIndex(p => p.id === id);
  if (idx === -1) return false;
  db.products.splice(idx, 1);
  writeAll(db);
  return true;
}

export function saveBase64Image(productId, dataUrl) {
  ensureDirs();
  const match = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error('Formato de imagen inválido. Usa data URL PNG/JPEG/WEBP.');
  const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
  const buffer = Buffer.from(match[3], 'base64');
  if (buffer.length > 5 * 1024 * 1024) throw new Error('Imagen supera 5MB');
  const filename = `${productId}_${Date.now()}.${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  const publicUrl = `/uploads/products/${filename}`;
  // Append into images
  const product = getProduct(productId);
  if (!product) throw new Error('Producto no encontrado');
  product.images = product.images || [];
  if (product.images.length >= 6) throw new Error('Máximo 6 imágenes por producto');
  product.images.push(publicUrl);
  updateProduct(productId, { images: product.images });
  return publicUrl;
}

export const paths = { UPLOADS_DIR };


