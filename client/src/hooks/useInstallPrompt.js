import { useState, useEffect } from 'react';

/**
 * useInstallPrompt — Manages the PWA "Add to Home Screen" install prompt.
 * Shows after the user's 2nd session, remembers dismissal for 30 days.
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed recently
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < thirtyDays) return;
    }

    // Check session count
    const sessions = parseInt(localStorage.getItem('sessionCount') || '0');
    if (sessions < 2) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
    if (outcome === 'accepted') {
      localStorage.setItem('pwaInstalled', 'true');
    }
  };

  const dismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  return { showPrompt, install, dismiss };
}
