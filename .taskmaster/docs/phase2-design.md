# Fase 2: Integraciones Multicanal (WhatsApp, Teléfono, Voz)

## Objetivo
Unificar canal web + WhatsApp + Teléfono + Voz sobre el mismo orquestador/sesiones, con handoffs a agenda (Google Calendar).

## WhatsApp
- Opciones:
  - Twilio WhatsApp Business API (rápido de arrancar, sandbox).
  - Meta WhatsApp Cloud API (oficial, requiere app y verificación).
- Flujo:
  - Webhook inbound: `/api/wa/webhook` (POST). Normaliza mensaje → `orchestrator/singleAgent` (useCatalog según provider settings).
  - Envío outbound: servicio `whatsappService` (Twilio|Meta) reusa respuesta del agente.
  - Vínculo de sesión: `from` (número) ↔ `sessionId` (persistente en memoria/archivo).
  - Handoff a agenda: el agente envía link/CTA o invoca endpoint interno `POST /api/calendar/events` cuando se detecte intención "agendar".

## Teléfono (Twilio Voice)
- Webhook de voz: `/api/voice/incoming` → TwiML con `Gather`/`Stream`.
- Opción mínima: IVR simple → transcripción → pasa texto al agente → TTS para respuesta.
- Persistencia: igual a WhatsApp (caller ID ↔ sessionId).

## Voz en web (Vapi/ElevenLabs)
- Vapi: integra STS/TTS con agente web (SDK).
- ElevenLabs: TTS para respuestas, STT vía Web Speech o proveedor.

## Seguridad
- Validar firmas (Twilio, Meta), tokens por proveedor (usar credenciales del Admin panel).
- Rate limit por IP/proveedor.

## Endpoints propuestos
- WhatsApp: `POST /api/wa/webhook`, `POST /api/wa/send` (debug/admin).
- Voice (Twilio): `POST /api/voice/incoming`, `POST /api/voice/gather`.
- Voz web: cliente usa SDK, backend sólo guarda métricas/credenciales si aplica.

## Tareas técnicas
1) Webhook WhatsApp (Twilio/Meta) y servicio de envío.
2) Webhook Voice Twilio con IVR básico y TTS/respuestas del agente.
3) Integración Vapi/ElevenLabs para web (botón "hablar").
4) Validación de firmas y configuración desde el panel de Credenciales.
5) Pruebas E2E: envío/recepción/agenda.
