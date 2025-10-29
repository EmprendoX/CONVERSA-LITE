export function validateMessage(message: unknown): string | null {
  if (typeof message !== 'string') {
    return 'message must be a string';
  }
  if (message.trim().length === 0) {
    return 'message cannot be empty';
  }
  if (message.length > 4000) {
    return 'message exceeds maximum length of 4000 characters';
  }
  return null;
}

export function sanitizeMessage(message: string): string {
  return message.slice(0, 4000).trim();
}


