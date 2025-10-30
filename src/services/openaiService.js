import OpenAI from "openai";
import fs from "fs";

let openai = null;

function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY no está configurada en .env");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export async function responderAgente(role = "ventas", mensaje, contexto = {}) {
  const agente = JSON.parse(fs.readFileSync(`src/agents/${role}.json`, "utf8"));
  const prompt = agente.prompt;
  
  const messages = [
    { role: "system", content: prompt },
    { role: "user", content: mensaje },
    ...(contexto.catalogo ? [{ role: "system", content: `Catálogo: ${JSON.stringify(contexto.catalogo)}` }] : [])
  ];
  
  const client = getOpenAI();
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages
  });
  
  return response.choices[0].message.content;
}
