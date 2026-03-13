import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for service worker ready
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsOfflineReady(true);
      });
    }

    // Capture install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setInstallPrompt(null);
  };

  const clearStoredData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return { isOfflineReady, canInstall: !!installPrompt && !isInstalled, isInstalled, install, clearStoredData };
}
