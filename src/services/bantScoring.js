export async function calcularBANT(texto) {
  const criterios = {
    presupuesto: /(precio|cuánto|cost)/i.test(texto),
    autoridad: /(dueño|decido|mi jefe)/i.test(texto),
    necesidad: /(necesito|busco|quiero)/i.test(texto),
    tiempo: /(hoy|esta semana|ya)/i.test(texto)
  };
  
  return Object.values(criterios).filter(Boolean).length;
}

