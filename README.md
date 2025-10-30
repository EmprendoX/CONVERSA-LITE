# Conversa Lite

Plantilla mínima para un agente comercial único con memoria en sesión, soporte RAG sobre un catálogo JSON y un chat web listo para pruebas.

## Características principales

- 🤖 Agente único configurable mediante `src/agents/primary.json` (público) y `src/agents/internal.json` (interno).
- 🧠 Memoria en sesiones usando almacenamiento en memoria (ideal para demos y desarrollo).
- 📚 Recuperación de contexto (RAG) con embeddings de OpenAI sobre `src/data/catalogo.json` y productos gestionados desde el Admin.
- 💬 Interfaz web en React con streaming de tokens (SSE) y feedback por mensaje.
- ⚙️ API REST `POST /api/public/chat` y `POST /api/internal/chat` (SSE).
- 🛍️ Sistema de gestión de productos con imágenes desde el panel Admin.
- 🎨 Widget embebible generador para integración en sitios web.

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
   - `OPENAI_API_KEY` (clave general) o `OPENAI_API_KEY_PUBLIC` / `OPENAI_API_KEY_INTERNAL` (separadas)
   - `PORT` (opcional, por defecto 3000)
   - `RATE_LIMIT_PER_MIN` (opcional, por defecto 60)
   - `MODERATION_ENABLED` (`true|false`)
   - `ENABLE_PUBLIC_CHAT` (`true|false`, por defecto `true`)
   - `ENABLE_INTERNAL_CHAT` (`true|false`, por defecto `false`)
   - `CREDENTIALS_SECRET` (32+ caracteres para cifrado de credenciales)
   - `ADMIN_TOKEN` (opcional, para proteger endpoints admin)

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

El sistema RAG puede usar dos fuentes de productos:

1. **Catálogo JSON tradicional**: Edita `src/data/catalogo.json` con tus productos.
2. **Productos gestionados desde Admin**: Crea productos desde el panel Admin con formulario visual, imágenes y regeneración automática del índice.

Para regenerar el índice RAG (incluye ambos tipos):
- Desde el panel Admin → Productos: haz clic en "Regenerar índice".
- O ejecuta: `npm run seed:catalog`

El índice se guarda en `src/data/catalogIndex.json` para acelerar las búsquedas futuras.

- Desde la interfaz web puedes activar o desactivar el uso del catálogo según la conversación.

## API de chat

### Chat público (para clientes)
`POST /api/public/chat`

```json
{
  "sessionId": "session-123",
  "message": "Hola, busco una laptop",
  "useCatalog": true
}
```

`POST /api/public/chat/stream` (SSE)

### Chat interno (para equipo)
`POST /api/internal/chat` (requiere header `x-admin-token`)

`POST /api/internal/chat/stream` (SSE, requiere header `x-admin-token`)

Nota: El chat interno usa `src/agents/internal.json` y una API key separada (si está configurada). No responde a clientes; está diseñado para monitoreo y control interno.

`POST /api/chat/stream` (SSE - endpoint legado)

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
├── agents/
│   ├── primary.json           # Prompt y descripción del agente público
│   └── internal.json          # Prompt y descripción del agente interno
├── config/index.js            # Carga de variables de entorno
├── data/
│   ├── catalogo.json          # Catálogo JSON tradicional
│   ├── products.json          # Productos gestionados desde Admin
│   └── catalogIndex.json      # Índice RAG generado
├── orchestrator/singleAgent.js# Orquestación del flujo agente + memoria + RAG
├── rag/
│   └── catalogIndexer.js      # Indexador y recuperador del catálogo (incluye productos)
├── routes/
│   ├── publicChat.js          # Endpoint REST del chat público
│   ├── internalChat.js        # Endpoint REST del chat interno
│   ├── products.js            # Endpoints CRUD de productos
│   └── admin.js               # Endpoints de administración
├── services/
│   ├── openaiService.js       # Wrapper para chat y embeddings de OpenAI
│   ├── credentialsStore.js    # Almacenamiento cifrado de credenciales
│   └── productStore.js        # Gestión de productos e imágenes
└── memory/index.js            # Implementación de memoria en sesiones

web/
├── src/App.tsx                # UI principal del chat (detecta ?embed=1)
├── src/api/client.ts          # Cliente para APIs del chat y productos
└── src/components/
    ├── ChatWindow.tsx         # Ventana de chat
    ├── SuggestedProducts.tsx  # Productos sugeridos (RAG)
    ├── AdminPanel.tsx         # Panel de administración
    ├── AdminProducts.tsx      # Gestión de productos
    ├── AdminWidget.tsx        # Generador de widgets
    ├── ProductsGrid.tsx       # Grid público de productos
    └── ProductDetail.tsx      # Detalle público de producto
```

## Scripts disponibles

- `npm start`: inicia el servidor Express.
- `npm run install:web`: instala dependencias del frontend.
- `npm run build:web`: compila el frontend en modo producción.
- `npm run seed:catalog`: genera el índice de embeddings del catálogo.

## Gestión de productos (Admin)

El panel Admin incluye una sección completa para gestionar productos:

### Crear/Editar productos
- **Formulario**: Nombre, Título, Subtítulo, Descripción
- **Imágenes**: Sube hasta 6 imágenes por producto (PNG, JPEG, WEBP, máximo 5MB cada una)
- **ID automático**: Se genera automáticamente desde el nombre del producto
- **Regeneración de índice**: Botón para regenerar el índice RAG después de cambios

### Límites y validaciones
- **Nombre**: 1-100 caracteres (requerido)
- **Título**: 1-200 caracteres (requerido)
- **Subtítulo**: máximo 300 caracteres (opcional)
- **Descripción**: máximo 4000 caracteres (opcional)
- **Imágenes**: máximo 6 por producto, formato base64 (PNG/JPEG/WEBP), máximo 5MB por imagen

### API de productos
- `GET /api/products` - Lista productos (con búsqueda y paginación)
- `GET /api/products/:id` - Obtiene un producto por ID
- `POST /api/products` - Crea un nuevo producto
- `PUT /api/products/:id` - Actualiza un producto
- `DELETE /api/products/:id` - Elimina un producto
- `POST /api/products/:id/images` - Sube una imagen a un producto (body: `{ imageDataUrl: "data:image/..." }`)

### Frontend público
- **Grid de productos**: `?view=products` muestra una grilla de todos los productos
- **Detalle de producto**: `?view=product&id=<product-id>` muestra el detalle completo con galería

## Widget embebible

Incluye un generador de widgets en el panel Admin que produce un snippet HTML configurable.

### Generador de widgets (Admin)
- Configura: título, color, posición, mensaje de saludo, host y base de API
- Presets rápidos: Violeta, Azul, Verde
- Descarga un archivo `widget.html` completo con el snippet incluido
- Copia el snippet `<script>` para integrar en cualquier sitio

El widget se sirve desde `GET /widget.js` y carga el chat en modo embed (`?embed=1`).

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

## Google Calendar (Agenda de citas)

### 1) Crear credenciales en Google Cloud Console
- Crea un proyecto y habilita la API de Calendar.
- Crea una credencial OAuth 2.0 (tipo aplicación web).
- Agrega `http://localhost:3000/api/calendar/callback` como URI de redirección autorizada.

### 2) Variables de entorno
En `.env` define:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback
GOOGLE_CALENDAR_ID=primary
ACCOUNT_ID=default
CREDENTIALS_SECRET=changeme-32chars
ADMIN_TOKEN=opcional-para-proteger-endpoints
```

### 3) Autorizar la cuenta
```bash
curl "http://localhost:3000/api/calendar/auth-url"
# abre la url devuelta, concede permisos
```
Los tokens se guardan en `.data/google/tokens-<ACCOUNT_ID>.json`.

### 4) Disponibilidad y eventos
- `GET /api/calendar/availability?from=ISO&to=ISO`
- `POST /api/calendar/events` `{ summary, startISO, endISO, attendees? }`
- `DELETE /api/calendar/events/:id`

## Panel Admin: Prompt, Catálogo y Credenciales
- Prompt y catálogo se editan desde la sección "Administración".
- Credenciales: subpanel con pestañas para Google/Twilio/Meta/Vapi/ElevenLabs.
  - Guardado cifrado en `.data/credentials.enc.json` (AES‑256‑GCM) usando `CREDENTIALS_SECRET`.
  - Botón "Probar conexión" valida formato y, para Google, intenta un acceso real a Calendar.

## Credenciales: almacenamiento, rotación y mínimos de permisos

### Dónde se guardan
- Las credenciales ingresadas en el panel se cifran con AES‑256‑GCM y se guardan en:
  - `.data/credentials.enc.json`
- La clave de cifrado es `CREDENTIALS_SECRET` definida en `.env`.

### Rotación de `CREDENTIALS_SECRET`
1. Establece un nuevo valor seguro (32+ caracteres aleatorios) en `.env`.
2. Vuelve a ingresar credenciales desde el panel Admin (se cifrarán con la nueva clave).
3. Opcional: borra el archivo anterior (`.data/credentials.enc.json`) si hiciste backup.

### Protección de endpoints Admin
- Los endpoints de credenciales admiten un token opcional `ADMIN_TOKEN` (Bearer).
- Define `ADMIN_TOKEN` en `.env` y envía `Authorization: Bearer <token>` para proteger cambios.

### Permisos mínimos sugeridos por proveedor
- Google Calendar: OAuth 2.0 con scopes `calendar.events` y `calendar.readonly`.
- Twilio: `ACCOUNT_SID` + `AUTH_TOKEN` con acceso a Messaging/WhatsApp/Voice según uso.
- Meta WhatsApp Cloud API: Page ID + token con permisos de mensajes para el número asociado.
- Vapi: `apiKey` con acceso a TTS/STS según plan.
- ElevenLabs: `apiKey` con acceso a TTS; limita a proyecto si es posible.

Recomendación: usar cuentas/proyectos específicos por cliente y rotar claves periódicamente.

## Twilio: WhatsApp y Voice

### WhatsApp (Sandbox)
1. En Twilio activa el sandbox de WhatsApp y sigue las instrucciones (mensaje de unión).
2. En Admin > Credenciales rellena: `accountSid`, `authToken`, y `fromNumber` o `messagingServiceSid`.
3. Configura el webhook inbound: `https://TU_HOST/api/wa/webhook` (POST, x-www-form-urlencoded).
4. Prueba rápida desde el panel o vía API: `POST /api/wa/send`.

### Voice (Llamadas)
1. Compra/asigna un número con capacidad de voz en Twilio.
2. En el número > Voice & Fax > A CALL COMES IN:
   - Método: POST
   - URL: `https://TU_HOST/api/voice/incoming`
3. Llama al número y habla; el sistema hace ASR (speech) y responde con TTS en español usando el agente (RAG ON).
4. Seguridad: la firma `X-Twilio-Signature` se valida en los webhooks; asegúrate de que la URL sea pública/estable.

## Meta WhatsApp Cloud API
1. Crea una app en Meta for Developers y habilita WhatsApp.
2. En Admin > Credenciales completa: `appId`, `appSecret`, `verifyToken`, `accessToken`, `phoneNumberId`, `businessAccountId`.
3. Configura el webhook:
   - Verificación (GET): `https://TU_HOST/api/meta/webhook` con tu `verifyToken`. Meta hará `GET` con `hub.mode`, `hub.verify_token`, `hub.challenge`.
   - Recepción (POST): `https://TU_HOST/api/meta/webhook` (enviarás `X-Hub-Signature-256`). El backend valida la firma con `appSecret`.
4. Pruebas de envío:
   - Texto: `POST /api/meta/send { to, text }`
   - Media: `POST /api/meta/send { to, mediaUrl, caption, type }` (type: image|audio|document|video)
   - Plantilla: `POST /api/meta/send { to, template: { name, language, components } }`


## Licencia

ISC
