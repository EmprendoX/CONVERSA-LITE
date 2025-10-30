# Conversa Lite

Plantilla mínima para un agente comercial único con memoria en sesión, soporte RAG sobre un catálogo JSON y un chat web listo para pruebas.

## Características principales

- 🤖 Agente único configurable mediante `src/agents/primary.json`.
- 🧠 Memoria en sesiones usando almacenamiento en memoria (ideal para demos y desarrollo).
- 📚 Recuperación de contexto (RAG) con embeddings de OpenAI sobre `src/data/catalogo.json`.
- 💬 Interfaz web en React para conversar con el agente y probar cambios en vivo.
- ⚙️ API REST `POST /api/chat` que también puede consumir cualquier otro cliente.

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
   Edita `.env` y define `OPENAI_API_KEY`. Opcionalmente modifica `PORT`.

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
├── src/api/client.ts          # Cliente para consumir `/api/chat`
└── src/components/            # Componentes de la interfaz
```

## Scripts disponibles

- `npm start`: inicia el servidor Express.
- `npm run install:web`: instala dependencias del frontend.
- `npm run build:web`: compila el frontend en modo producción.
- `npm run seed:catalog`: genera el índice de embeddings del catálogo.

## Licencia

ISC
