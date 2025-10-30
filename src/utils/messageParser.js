export function parseMessage(body) {
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const messages = value?.messages?.[0];
  
  if (!messages) return null;
  
  return {
    from: messages.from,
    text: messages.text?.body || "",
    messageId: messages.id,
    timestamp: messages.timestamp,
    type: messages.type
  };
}

