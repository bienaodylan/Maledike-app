import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ignore harmless HMR WebSocket connection warnings in Cloud Run iframe environment
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('WebSocket') ||
    event.reason?.stack?.includes('@vite/client') ||
    String(event.reason).includes('vite')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(<App />);

