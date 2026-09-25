import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const dismissedAt = localStorage.getItem('pwa_install_dismissed_at');
    if (dismissedAt) {
      const hours = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hours < 24) {
        setIsDismissed(true);
      }
    }

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);

    const ua = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(ua);
    const isSafari = isApple && /safari/.test(ua) && !/crios|fxios/.test(ua);
    if (isSafari && !isStandalone) {
      setIsIOS(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa_install_dismissed_at', Date.now().toString());
  };

  if (isInstalled || isDismissed) return null;

  if (deferredPrompt) {
    return (
      <aside aria-label='App Installation' className='fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4 duration-300'>
        <div className='bg-white rounded-2xl shadow-xl border border-neutral-200/80 p-4 flex items-center gap-3 backdrop-blur-md bg-white/95'>
          <img src='/icon-192.png' alt='LASU Logo' className='w-12 h-12 rounded-xl object-contain bg-white border border-neutral-100 shadow-sm shrink-0' />
          <div className='flex-1 min-w-0'>
            <h4 className='text-sm font-bold text-neutral-900 truncate'>LASU InternConnect</h4>
            <p className='text-xs text-neutral-500 leading-tight'>Install app for instant access & faster check-ins</p>
          </div>
          <div className='flex items-center gap-1.5 shrink-0'>
            <button onClick={handleInstallClick} className='px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95'>Install</button>
            <button onClick={handleDismiss} className='p-1 text-neutral-400 hover:text-neutral-600 rounded-lg text-xs' aria-label='Close'>✕</button>
          </div>
        </div>
      </aside>
    );
  }

  if (isIOS) {
    return (
      <aside aria-label='iOS Installation Tip' className='fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4 duration-300'>
        <div className='bg-white rounded-2xl shadow-xl border border-neutral-200/80 p-4 backdrop-blur-md bg-white/95'>
          <div className='flex items-start gap-3'>
            <img src='/icon-192.png' alt='LASU Logo' className='w-10 h-10 rounded-xl object-contain bg-white border border-neutral-100 shadow-sm shrink-0' />
            <div className='flex-1 min-w-0'>
              <h4 className='text-sm font-bold text-neutral-900'>Install LASU InternConnect</h4>
              <p className='text-xs text-neutral-600 mt-1 leading-relaxed'>
                Tap the <span className='font-bold text-blue-600'>Share</span> icon below, then choose <span className='font-semibold text-neutral-900'>&lquo;Add to Home Screen&rquo;</span>.
              </p>
            </div>
            <button onClick={handleDismiss} className='p-1 text-neutral-400 hover:text-neutral-600 rounded-lg text-xs shrink-0' aria-label='Close'>✕</button>
          </div>
        </div>
      </aside>
    );
  }

  return null;
}
