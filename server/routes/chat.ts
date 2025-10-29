import { Router, Request, Response } from 'express';
import { callLLM } from '../lib/llm';
import { logMessage } from '../lib/logger';
import { validateMessage, sanitizeMessage } from '../lib/validators';
import { retrieveContext, formatRAGContext } from '../lib/rag';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { message, sessionId } = req.body || {};

  // Validate message
  const validationError = validateMessage(message);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const sanitizedMessage = sanitizeMessage(message as string);
  const t0 = Date.now();

  try {
    // Optional RAG context (for future implementation)
    const context = await retrieveContext(sanitizedMessage);
    const contextText = formatRAGContext(context);

    // Call LLM
    const fullMessage = contextText ? sanitizedMessage + contextText : sanitizedMessage;
    const text = await callLLM({ message: fullMessage, sessionId });

    const ms = Date.now() - t0;

    // Log outgoing message
    logMessage({
      direction: 'out',
      sessionId,
      text,
      meta: { latency_ms: ms },
    });

    // Log incoming message
    logMessage({
      direction: 'in',
      sessionId,
      text: sanitizedMessage,
    });

    return res.json({ text });
  } catch (error) {
    console.error('Chat error:', error);
    const ms = Date.now() - t0;
    
    logMessage({
      direction: 'out',
      sessionId,
      text: 'Error procesando tu mensaje. Por favor intenta de nuevo.',
      meta: { latency_ms: ms, error: String(error) },
    });

    return res.status(500).json({
      error: 'Error procesando mensaje',
      text: 'Error procesando tu mensaje. Por favor intenta de nuevo.',
    });
  }
});

export default router;

