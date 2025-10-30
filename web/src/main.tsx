import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('No se encontró el elemento raíz para iniciar la aplicación.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
