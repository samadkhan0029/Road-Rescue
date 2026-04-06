import React, { useEffect, useState } from 'react';
import pwa from '../utils/pwa';

const PWAProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Check network status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check if running in standalone mode
    setIsStandalone(pwa.isStandalone());
    
    // Show install prompt for eligible users
    const timer = setTimeout(() => {
      if (!isStandalone && !showInstallPrompt) {
        setShowInstallPrompt(true);
      }
    }, 5000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timer);
    };
  }, [isStandalone, showInstallPrompt]);

  // Cache management utilities
  const clearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('[PWA] All caches cleared');
        return true;
      } catch (error) {
        console.error('[PWA] Failed to clear caches:', error);
        return false;
      }
    }
    return false;
  };

  const value = {
    isOnline,
    isStandalone,
    showUpdateBanner,
    showInstallPrompt,
    clearCache,
    activateUpdate: () => pwa.activateUpdate(),
    getVersion: () => pwa.getVersion(),
    unregister: () => pwa.unregister()
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
      
      {/* Offline indicator */}
      {!isOnline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#dc3545',
          color: 'white',
          padding: '0.5rem',
          textAlign: 'center',
          zIndex: 9999,
          fontSize: '0.9rem',
          fontWeight: '600'
        }}>
          You're offline. Some features may not be available.
        </div>
      )}
      
      {/* Install prompt banner */}
      {showInstallPrompt && !isStandalone && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          zIndex: 10000,
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                Install RoadRescue
              </strong>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                Get the best experience with our app
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
              <button
                onClick={() => setShowInstallPrompt(false)}
                style={{
                  background: 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '0.5rem 1rem',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Later
              </button>
              <button
                data-pwa-install
                style={{
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}
    </PWAContext.Provider>
  );
};

export const PWAContext = React.createContext();
export default PWAProvider;
