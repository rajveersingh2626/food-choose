// Service Worker Registration Helper
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // In Vite, sw.js is in /public, so it is served at root /sw.js
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Check for updates periodically
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('New app version available. Will refresh on next launch.');
                  } else {
                    console.log('Suhanu Food AI is cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((err) => {
          console.log('SW registration note:', err?.message || err);
        });
    });
  }
}
