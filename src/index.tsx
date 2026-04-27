import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (err) {
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red; font-family: sans-serif;">
      <h1>Sistem Başlatılamadı</h1>
      <p>${err instanceof Error ? err.message : String(err)}</p>
      <button onclick="window.location.reload()">Tekrar Dene</button>
    </div>
  `;
}