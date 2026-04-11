import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// ── PWA Auto-Update ──
// Polls /api/version every 5 minutes and on every visibility change (tab/app focus).
// If the server version differs from the cached version, force a full reload.
// This ensures installed home-screen PWAs never get stuck on stale code.
(function initAutoUpdate() {
  let knownVersion = null;
  let checking = false;

  async function checkVersion() {
    if (checking) return;
    checking = true;
    try {
      const res = await fetch('/api/version', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (knownVersion === null) {
        // First check — just store the version
        knownVersion = data.version;
      } else if (data.version !== knownVersion) {
        // Version changed — new deploy detected
        console.log('[AutoUpdate] New version detected, reloading…');
        // Unregister all service workers so the reload gets fresh assets
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(r => r.unregister()));
        }
        // Clear all caches
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(names.map(n => caches.delete(n)));
        }
        // Force reload from server
        window.location.reload();
      }
    } catch (e) {
      // Silently fail — user might be offline
    } finally {
      checking = false;
    }
  }

  // Check on app start (after a short delay to not block initial render)
  setTimeout(checkVersion, 3000);

  // Check every 5 minutes
  setInterval(checkVersion, 5 * 60 * 1000);

  // Check when the app comes back to foreground (tab switch, phone unlock, app switcher)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkVersion();
    }
  });

  // Check on page navigation (popstate)
  window.addEventListener('popstate', checkVersion);
})();

// ── Service Worker Registration ──
// Register the Workbox-generated SW for offline support and push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      // Listen for new SW waiting to activate
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              // New SW activated — the version check will handle the reload
              console.log('[SW] New service worker activated');
            }
          });
        }
      });
    } catch (e) {
      console.warn('[SW] Registration failed:', e);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
