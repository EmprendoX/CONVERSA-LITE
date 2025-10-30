function isString(v, max = 2000) {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}

export function sanitizeText(v, max = 2000) {
  if (typeof v !== "string") return "";
  const trimmed = v.trim().slice(0, max);
  return trimmed.replace(/[\u0000-\u001F\u007F]/g, "");
}

export function validateChatPayload(body) {
  const errors = [];
  if (!isString(body?.message, 4000)) errors.push("message requerido (1-4000)");
  if (body?.topK !== undefined) {
    const n = Number(body.topK);
    if (!Number.isFinite(n) || n < 1 || n > 10) errors.push("topK debe ser 1..10");
  }
  return errors;
}

export function validateFeedbackPayload(body) {
  const errors = [];
  if (!isString(body?.sessionId, 128)) errors.push("sessionId requerido");
  if (!isString(body?.messageId, 128)) errors.push("messageId requerido");
  if (body?.rating !== "up" && body?.rating !== "down") errors.push("rating 'up'|'down'");
  if (body?.comment && !isString(body.comment, 400)) errors.push("comment demasiado largo");
  return errors;
}

export function validateCalendarAvailability(query) {
  const errors = [];
  if (!isString(query?.from, 64)) errors.push("from ISO requerido");
  if (!isString(query?.to, 64)) errors.push("to ISO requerido");
  return errors;
}

export function validateCreateEvent(body) {
  const errors = [];
  if (!isString(body?.summary, 256)) errors.push("summary requerido (<=256)");
  if (!isString(body?.startISO, 64)) errors.push("startISO requerido");
  if (!isString(body?.endISO, 64)) errors.push("endISO requerido");
  if (body?.attendees && !Array.isArray(body.attendees)) errors.push("attendees debe ser array");
  return errors;
}

export function validateCredentialsSave(body) {
  const errors = [];
  if (!isString(body?.provider, 32)) errors.push("provider requerido");
  if (!body?.data || typeof body.data !== "object" || Array.isArray(body.data)) errors.push("data inválido");
  return errors;
}

export function validateCredentialsValidate(body) {
  const errors = [];
  if (!isString(body?.provider, 32)) errors.push("provider requerido");
  return errors;
}

export default {
  sanitizeText,
  validateChatPayload,
  validateFeedbackPayload,
  validateCalendarAvailability,
  validateCreateEvent,
  validateCredentialsSave,
  validateCredentialsValidate
};

// --- Productos ---
export function validateProductCreateUpdate(body) {
  const errors = [];
  if (!isString(body?.name, 120)) errors.push("name requerido (<=120)");
  if (!isString(body?.title, 160)) errors.push("title requerido (<=160)");
  if (body?.subtitle && !isString(body.subtitle, 180)) errors.push("subtitle demasiado largo");
  if (body?.description && !isString(body.description, 4000)) errors.push("description demasiado largo");
  return errors;
}

export function validateImageDataUrl(dataUrl) {
  const errors = [];
  if (!isString(dataUrl, 10_000_000)) errors.push("dataUrl requerido");
  if (!/^data:(image\/(png|jpeg|jpg|webp));base64,[A-Za-z0-9+/=]+$/.test(String(dataUrl || ''))) errors.push("Formato de imagen inválido (png/jpg/webp)");
  return errors;
}

export function sanitizeProductInput(body) {
  const out = Object.create(null);
  out.name = sanitizeText(body?.name || '', 120);
  out.title = sanitizeText(body?.title || '', 160);
  out.subtitle = sanitizeText(body?.subtitle || '', 180);
  out.description = sanitizeText(body?.description || '', 4000);
  return out;
}


