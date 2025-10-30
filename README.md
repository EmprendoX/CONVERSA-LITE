# ConversaX Agent Kit v1

Sistema modular de agentes inteligentes para WhatsApp con integración OpenAI y Supabase.

## Características

- 🤖 Agentes modulares con roles personalizables (ventas, soporte, general)
- 🧠 Integración con OpenAI (GPT-4o-mini)
- 📊 Clasificación automática de leads (BANT)
- 💾 Guardado de conversaciones en Supabase
- 📱 Integración con Meta WhatsApp API
- 🚀 Listo para desplegar en Netlify

## Estructura

```
src/
├── index.js              # Servidor principal
├── routes/
│   └── whatsapp.js       # Webhook de WhatsApp
├── agents/
│   ├── ventas.json       # Configuración agente de ventas
│   ├── soporte.json      # Configuración agente de soporte
│   └── general.json      # Configuración agente general
├── services/
│   ├── openaiService.js  # Comunicación con OpenAI
│   ├── supabaseService.js# Guardado en Supabase
│   └── bantScoring.js    # Evaluación de leads
├── utils/
│   └── messageParser.js  # Parser de mensajes
└── data/
    └── catalogo.json     # Catálogo de productos
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

Editar `.env` y agregar:
- `OPENAI_API_KEY` (obligatoria)
- `SUPABASE_URL`, `SUPABASE_KEY` o `SUPABASE_SERVICE_ROLE_KEY` (para guardar conversaciones)
- `SUPABASE_ANON_KEY` (si usas autenticación pública)
- `META_ACCESS_TOKEN`, `META_PHONE_ID`, `VERIFY_TOKEN` (solo si vas a conectar WhatsApp)
- `PORT` (opcional, por defecto 3000)

## Uso

Generar embeddings del catálogo (opcional pero recomendado para producción):
```bash
npm run seed:catalog
```

Este comando lee `src/data/catalogo.json`, crea embeddings en OpenAI y guarda el índice en `src/data/catalogIndex.json`. Ejecútalo siempre que actualices el catálogo.

Iniciar servidor:
```bash
npm start
```

El servidor correrá en `http://localhost:3000`

## Webhook

Configurar el webhook de WhatsApp para que apunte a:
```
POST https://tu-dominio.com/api/webhook
```

## Modo agente único

Sigue estos pasos para trabajar con un único agente conversacional usando el chat web incluido:

1. **Preparar el entorno**
   - Crea tu archivo de variables con `cp .env.example .env` y completa las claves necesarias.
   - Asegúrate de tener una clave válida en `OPENAI_API_KEY`; sin ella no se generarán respuestas ni embeddings.

2. **Cargar el catálogo de productos**
   - Actualiza `src/data/catalogo.json` con la lista de productos que quieras ofrecer.
   - Ejecuta `npm run seed:catalog` para regenerar los embeddings y dejar el índice en `src/data/catalogIndex.json` (cada ítem consume una llamada de embeddings en OpenAI).

3. **Afinar el prompt del agente**
   - Edita `src/agents/ventas.json` (o el agente que vayas a usar) y personaliza el campo `prompt` para reflejar el tono y reglas de tu marca.
   - Si cambias de agente predeterminado, actualiza el valor por defecto que envías en tus solicitudes (`agent: 'ventas'`).

4. **Probar en el chat web**
   - Inicia la API con `npm start` y deja el proceso corriendo.
   - Instala las dependencias del front con `npm run install:web` (solo la primera vez) y luego levanta la interfaz con `cd web && npm run dev`.
   - Abre `http://localhost:5173` en tu navegador, selecciona el agente, activa el catálogo si necesitas contexto de productos y envía un mensaje de prueba.

## Licencia

ISC
