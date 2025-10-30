# Conversa Lite

Plantilla mínima para un agente comercial único con memoria en sesión, soporte RAG sobre un catálogo JSON y un chat web listo para pruebas.

## Características principales

- 🤖 Agente único configurable mediante `src/agents/primary.json`.
- 🧠 Memoria en sesiones usando almacenamiento en memoria (ideal para demos y desarrollo).
- 📚 Recuperación de contexto (RAG) con embeddings de OpenAI sobre `src/data/catalogo.json`.
- 💬 Interfaz web en React con streaming de tokens (SSE) y feedback por mensaje.
- ⚙️ API REST `POST /api/chat` y `POST /api/chat/stream` (SSE).

## Requisitos

- Node.js 18+
- Una clave válida de OpenAI (modelos `gpt-4o-mini` y `text-embedding-3-small`).

## Configuración

1. Instala dependencias del backend:
   ```bash
   npm install
   ```
2. Instala dependencias del frontend (solo la primera vez):
   ```bash
   npm run install:web
   ```
3. Crea tu archivo de entorno y agrega la clave de OpenAI:
   ```bash
   cp .env.example .env
   ```
   Edita `.env` y define:
   - `OPENAI_API_KEY`
   - `PORT` (opcional)
   - `RATE_LIMIT_PER_MIN` (opcional, por defecto 60)
   - `MODERATION_ENABLED` (`true|false`)

## Ejecutar el proyecto

1. Inicia la API:
   ```bash
   npm start
   ```
2. En otra terminal, levanta el chat web:
   ```bash
   cd web
   npm run dev
   ```
3. Abre `http://localhost:5173` y empieza a conversar. El frontend guarda tus sesiones en `localStorage`.

## Uso del catálogo (RAG)

- Edita `src/data/catalogo.json` con tus productos.
- Ejecuta el generador de embeddings para crear/actualizar el índice local:
  ```bash
  npm run seed:catalog
  ```
  Este comando crea `src/data/catalogIndex.json` para acelerar las búsquedas futuras.
- Desde la interfaz web puedes activar o desactivar el uso del catálogo según la conversación.

## API de chat

`POST /api/chat`

```json
{
  "sessionId": "session-123",
  "message": "Hola, busco una laptop",
  "useCatalog": true
}
```

`POST /api/chat/stream` (SSE)

- Content-Type: `application/json`
- Respuesta: `text/event-stream` con eventos `data: { delta?: string, done?: boolean }`

Ejemplo de consumo en el navegador (simplificado):

```ts
const res = await fetch('/api/chat/stream', { method: 'POST', body: JSON.stringify({ message: 'hola', useCatalog: true }) });
const reader = res.body!.getReader();
const decoder = new TextDecoder();
let acc = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // parsear líneas `data: {"delta":"..."}`
}
```

`POST /api/chat/feedback`

```json
{ "sessionId": "...", "messageId": "...", "rating": "up" }
```

Respuesta:

```json
{
  "reply": "¡Hola! ¿Qué tipo de laptop necesitas y para qué la usarás?",
  "sessionId": "session-123",
  "agent": {
    "name": "Agente Comercial Inteligente",
    "description": "Asistente único que comprende el catálogo, detecta intención de compra y guía a la persona usuaria hasta la conversión."
  },
  "memoryProvider": "in-memory",
  "ragResults": [
    {
      "id": "prod-1",
      "nombre": "Laptop XR",
      "descripcion": "Equipo ligero con 16GB de RAM",
      "precio": 1250,
      "categoria": "Computadoras",
      "score": 0.82
    }
  ]
}
```

## Estructura relevante

```
src/
├── agents/primary.json        # Prompt y descripción del agente único
├── config/index.js            # Carga de variables de entorno
├── orchestrator/singleAgent.js# Orquestación del flujo agente + memoria + RAG
├── rag/                       # Indexador y recuperador del catálogo
├── routes/chat.js             # Endpoint REST del chat web
├── services/openaiService.js  # Wrapper para chat y embeddings de OpenAI
└── memory/index.js            # Implementación de memoria en sesiones

web/
├── src/App.tsx                # UI principal del chat
├── src/api/client.ts          # Cliente para `/api/chat` y `/api/chat/stream`
└── src/components/            # Componentes de la interfaz
```

## Scripts disponibles

- `npm start`: inicia el servidor Express.
- `npm run install:web`: instala dependencias del frontend.
- `npm run build:web`: compila el frontend en modo producción.
- `npm run seed:catalog`: genera el índice de embeddings del catálogo.

## Widget embebible

Incluye un botón flotante que abre el chat en un iframe, configurable por atributos `data-`.

1. Añade el script a tu sitio:

```html
<script
  src="https://tu-dominio.com/widget.js"
  data-title="¿Hablamos?"
  data-color="#22c55e"
  data-position="bottom-right"
  data-greet="Hola 👋"
  async
></script>
```

2. Opciones:
- `data-title`: texto del botón
- `data-color`: color del botón (hex)
- `data-position`: `bottom-right` | `bottom-left`
- `data-greet`: saludo inicial (opcional)

El widget se sirve desde `GET /widget.js`.

## Licencia

ISC
