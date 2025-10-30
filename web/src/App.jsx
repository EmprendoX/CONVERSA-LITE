import React, { useState } from 'react';

export default function App() {
  const [agent, setAgent] = useState('general');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        width: 360,
        background: '#fff',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 10px 40px rgba(0,0,0,.25)'
      }}>
        <h2 style={{ marginBottom: 12 }}>ConversaX Chat</h2>
        <label style={{ display: 'block', marginBottom: 8 }}>Agente</label>
        <select value={agent} onChange={(e) => setAgent(e.target.value)} style={{ marginBottom: 12, width: '100%' }}>
          <option value="ventas">Ventas</option>
          <option value="soporte">Soporte</option>
          <option value="general">General</option>
        </select>
        <p>Frontend mínimo listo. Si ves este cuadro, el build funcionó.</p>
      </div>
    </div>
  );
}


