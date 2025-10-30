const inMemoryStore = new Map();

function normaliseMessage(message) {
  if (!message || !message.role || !message.content) {
    throw new Error("Cada mensaje debe incluir 'role' y 'content'");
  }
  return {
    role: message.role,
    content: message.content,
    createdAt: message.createdAt ? new Date(message.createdAt).toISOString() : new Date().toISOString()
  };
}

export const inMemoryMemory = {
  async getMessages(sessionId) {
    if (!sessionId) {
      return [];
    }
    const messages = inMemoryStore.get(sessionId) || [];
    return [...messages];
  },
  async addMessage(sessionId, message) {
    if (!sessionId) {
      return;
    }
    const normalised = normaliseMessage(message);
    const history = inMemoryStore.get(sessionId) || [];
    history.push(normalised);
    inMemoryStore.set(sessionId, history);
  }
};

export const memory = inMemoryMemory;
export const memoryProvider = "in-memory";

export default memory;
