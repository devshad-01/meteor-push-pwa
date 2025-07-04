import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstaller: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    // Detect if we're on localhost/development
    const localhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('ngrok');
    setIsLocalhost(localhost);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isIOSStandalone);

    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    setIsDismissed(dismissed === 'true');

    // For localhost, show install prompt regardless (for testing)
    if (localhost && !isStandalone && !isIOSStandalone && !dismissed) {
      setTimeout(() => {
        setShowBanner(true);
        setIsInstallable(true);
      }, 2000);
    }

    // For iOS, show install prompt if not installed and not dismissed
    if (iOS && !isIOSStandalone && !dismissed) {
      setTimeout(() => {
        setShowBanner(true);
        setIsInstallable(true);
      }, 3000);
      return;
    }

    // Listen for the beforeinstallprompt event (Android/Desktop on HTTPS)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      // Show banner after a delay if not dismissed
      if (!dismissed) {
        setTimeout(() => {
          setShowBanner(true);
        }, 3000); // Show after 3 seconds
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowBanner(false);
      setShowIOSInstructions(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // Handle localhost development - show instructions
    if (isLocalhost && !deferredPrompt) {
      alert(`🔧 Development Mode - PWA Install Guide:

📱 To test PWA installation:

1. Deploy to HTTPS (required for real install prompt)
2. Or use ngrok: npx ngrok http 3000
3. Open the ngrok HTTPS URL in Chrome/Edge

📋 PWA Install Requirements:
✅ HTTPS (localhost doesn't trigger real install)
✅ Valid manifest.json
✅ Service worker registered
✅ Icons (192x192 & 512x512)

🚀 Your app meets all requirements except HTTPS!`);
      return;
    }

    // Handle iOS Safari install instructions
    if (isIOS && !deferredPrompt) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
        setShowBanner(false);
      } else {
        console.log('PWA installation dismissed');
        handleDismiss();
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSInstructions(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const MobileIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="4" width="16" height="24" rx="3" fill="currentColor"/>
      <rect x="10" y="7" width="12" height="16" fill="white"/>
      <circle cx="16" cy="25" r="1" fill="white"/>
    </svg>
  );

  const DownloadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 13L6 9H8V5H12V9H14L10 13Z" fill="currentColor"/>
      <path d="M4 15H16V17H4V15Z" fill="currentColor"/>
    </svg>
  );

  const CloseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.25 6.25L8.125 14.375L3.75 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const ShareIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 3V13M10 3L6 7M10 3L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 14V16C3 16.5523 3.44772 17 4 17H16C16.5523 17 17 16.5523 17 16V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  const HomeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10L10 3L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 8V16C5 16.5523 5.44772 17 6 17H14C14.5523 17 15 16.5523 15 16V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  if (isInstalled) {
    return (
      <div style={styles.installedContainer}>
        <CheckIcon />
        <span style={styles.installedText}>App Installed</span>
      </div>
    );
  }

  if (!isInstallable || isDismissed || !showBanner) {
    return null;
  }

  // iOS Installation Instructions
  if (showIOSInstructions) {
    return (
      <div style={styles.bannerContainer}>
        <div style={styles.banner}>
          <div style={styles.bannerContent}>
            <div style={styles.iconContainer}>
              <MobileIcon />
            </div>
            <div style={styles.textContent}>
              <h3 style={styles.bannerTitle}>Install App</h3>
              <div style={styles.iosInstructions}>
                <p style={styles.iosStep}>
                  <span style={styles.stepNumber}>1.</span>
                  Tap the <ShareIcon /> share button
                </p>
                <p style={styles.iosStep}>
                  <span style={styles.stepNumber}>2.</span>
                  Tap "Add to Home Screen" <HomeIcon />
                </p>
              </div>
            </div>
          </div>
          <div style={styles.actions}>
            <button onClick={handleDismiss} style={styles.dismissButton}>
              <CloseIcon />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.bannerContainer}>
      <div style={styles.banner}>
        <div style={styles.bannerContent}>
          <div style={styles.iconContainer}>
            <MobileIcon />
          </div>
          <div style={styles.textContent}>
            <h3 style={styles.bannerTitle}>
              {isLocalhost ? 'Install App (Dev Mode)' : 'Install App'}
            </h3>
            <p style={styles.bannerDescription}>
              {isLocalhost 
                ? 'Click for install instructions (needs HTTPS)'
                : 'Get quick access and enhanced features'
              }
            </p>
          </div>
        </div>
        <div style={styles.actions}>
          <button onClick={handleInstallClick} style={styles.installButton}>
            <DownloadIcon />
            <span>Install</span>
          </button>
          <button onClick={handleDismiss} style={styles.dismissButton}>
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  bannerContainer: {
    position: 'fixed' as const,
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    maxWidth: '400px',
    width: 'calc(100% - 32px)',
    animation: 'slideDown 0.3s ease-out',
  },

  banner: {
    backgroundColor: '#ffffff',
    border: '1px solid #e1e5e9',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  } as React.CSSProperties,

  bannerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  } as React.CSSProperties,

  iconContainer: {
    color: '#667eea',
    flexShrink: 0,
  } as React.CSSProperties,

  textContent: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,

  bannerTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 4px 0',
    color: '#1a1a1b',
    lineHeight: '20px',
  } as React.CSSProperties,

  bannerDescription: {
    fontSize: '13px',
    color: '#7c7c83',
    margin: 0,
    lineHeight: '16px',
  } as React.CSSProperties,

  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  } as React.CSSProperties,

  installButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#5a6fd8',
      transform: 'translateY(-1px)',
    }
  } as React.CSSProperties,

  dismissButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    backgroundColor: 'transparent',
    color: '#7c7c83',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f6f7f8',
      color: '#1a1a1b',
    }
  } as React.CSSProperties,

  installedContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
    border: '1px solid #c3e6cb',
  } as React.CSSProperties,

  installedText: {
    fontSize: '13px',
  } as React.CSSProperties,

  iosInstructions: {
    marginTop: '8px',
  } as React.CSSProperties,

  iosStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#7c7c83',
    margin: '4px 0',
    lineHeight: '16px',
  } as React.CSSProperties,

  stepNumber: {
    backgroundColor: '#667eea',
    color: 'white',
    fontSize: '11px',
    fontWeight: '600',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as React.CSSProperties,
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  @media (max-width: 480px) {
    .pwa-banner-container {
      top: 8px;
      width: calc(100% - 16px);
    }
  }
`;
document.head.appendChild(styleSheet);
