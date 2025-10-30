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
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `META_ACCESS_TOKEN`
- `META_PHONE_ID`
- `VERIFY_TOKEN`

## Uso

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

## Licencia

ISC
