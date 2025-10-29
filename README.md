# ConversaX Lite Web Chat Automation MVP

Chat inteligente simple con React + Express + LLM (OpenAI o Generic HTTP).

## Estructura del Proyecto

```
conversax-lite/
├── server/              # Backend Node.js + Express
│   ├── app.ts          # Express app principal
│   ├── routes/         # Endpoints API
│   │   └── chat.ts     # POST /api/chat
│   └── lib/            # Lógica de negocio
│       ├── llm.ts      # Abstracción LLM
│       ├── logger.ts   # Logger opcional
│       ├── validators.ts
│       └── rag.ts      # RAG placeholder
├── web/                # Frontend React + Vite + Tailwind
│   ├── index.html
│   └── src/
│       ├── components/ # Componentes React
│       └── styles/     # Tailwind CSS
├── data/               # Logs opcionales (JSON)
├── system-prompt.txt   # Prompt del sistema
└── .env.example        # Variables de entorno
```

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` y agregar tu `OPENAI_API_KEY`.

3. Ejecutar en desarrollo:
```bash
npm run dev
```

Esto iniciará:
- Backend en `http://localhost:8080`
- Frontend en `http://localhost:5173` (Vite dev server)

## Scripts

- `npm run dev` - Ejecuta backend + frontend en paralelo
- `npm run dev:server` - Solo backend
- `npm run dev:web` - Solo frontend
- `npm run build` - Build de producción
- `npm run start` - Ejecutar build de producción

## Variables de Entorno

Ver `.env.example` para todas las opciones disponibles.

Principales:
- `OPENAI_API_KEY` - Requerido para OpenAI
- `LLM_PROVIDER` - `openai` (default) o `generic`
- `LLM_MODEL` - Modelo a usar (default: `gpt-4o-mini`)
- `SYSTEM_PROMPT_PATH` - Ruta al archivo de prompt (default: `./system-prompt.txt`)
- `ENABLE_FILE_LOGS` - Habilitar logs a archivo (default: `false`)

## Características MVP

- ✅ Chat web funcional con React + Tailwind
- ✅ Backend Express con `/api/chat`
- ✅ Integración OpenAI (configurable)
- ✅ Soporte para Generic HTTP LLM
- ✅ Logger opcional a archivo JSON
- ✅ Sistema de prompts desde archivo
- ✅ Health check endpoint (`/health`)

## Próximos Pasos (Roadmap)

- Streaming por SSE
- Integración WhatsApp Cloud API
- RAG con CSV de catálogo
- Voz con ElevenLabs
- Analytics avanzados

