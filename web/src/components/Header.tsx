import { useState } from 'react';
import Settings from './Settings';

export default function Header() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-xl font-semibold">ConversaX Lite Web</h1>
        <button
          onClick={() => setShowSettings(true)}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border rounded"
        >
          ⚙️ Configuración
        </button>
      </header>
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </>
  );
}


