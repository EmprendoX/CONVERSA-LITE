import { useState } from 'react';
import Header from './Header';
import MessageList from './MessageList';
import Composer from './Composer';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function Chat() {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionId = 'local-web';

  async function send(message: string) {
    if (!message.trim()) return;

    const userMessage: Message = { role: 'user', text: message };
    setMsgs((m) => [...m, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', text: data.text || '…' };
      setMsgs((m) => [...m, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        text: 'Error al procesar tu mensaje. Por favor intenta de nuevo.',
      };
      setMsgs((m) => [...m, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto h-screen flex flex-col bg-gray-50">
      <Header />
      <MessageList messages={msgs} loading={loading} />
      <Composer onSend={send} disabled={loading} />
    </div>
  );
}

