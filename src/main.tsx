import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Enregistrement du Service Worker pour le fonctionnement 100% hors-ligne
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker enregistré avec succès :', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Échec de l\'enregistrement du Service Worker :', error);
      });
  });
} else if ('serviceWorker' in navigator) {
  // Dans le serveur de dev AI Studio, on enregistre également pour permettre l'essai du bouton "Installer"
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('[PWA-Dev] Service Worker enregistré :', registration.scope);
    })
    .catch((err) => {
      console.warn('[PWA-Dev] Erreur SW :', err);
    });
}
