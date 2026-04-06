// PWA Service Worker Registration Script
// Place this in your main React app entry point (e.g., index.js or App.js)

class PWAServiceWorker {
  constructor() {
    this.swRegistration = null;
    this.isUpdateAvailable = false;
  }

  // Register the service worker
  async register() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Workers are not supported in this browser');
      return false;
    }

    try {
      console.log('[PWA] Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.swRegistration = registration;
      
      console.log('[PWA] Service Worker registered successfully:', registration.scope);

      // Handle updates
      this.handleUpdates(registration);
      
      // Handle push notifications
      this.handlePushNotifications(registration);

      return true;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return false;
    }
  }

  // Handle service worker updates
  handleUpdates(registration) {
    // Check for updates immediately
    registration.update();

    // Listen for update found
    registration.addEventListener('updatefound', () => {
      console.log('[PWA] New service worker found');
      
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version is available
          this.isUpdateAvailable = true;
          this.showUpdateNotification();
        }
      });
    });

    // Listen for controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Service Worker controller changed, reloading page');
      window.location.reload();
    });
  }

  // Handle push notifications
  async handlePushNotifications(registration) {
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('[PWA] Notification permission granted');
        
        // Subscribe to push notifications (you'll need a push service)
        // const subscription = await registration.pushManager.subscribe({
        //   userVisibleOnly: true,
        //   applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
        // });
        
        console.log('[PWA] Push notifications ready');
      } else {
        console.log('[PWA] Notification permission denied');
      }
    } catch (error) {
      console.error('[PWA] Push notification setup failed:', error);
    }
  }

  // Show update notification to user
  showUpdateNotification() {
    // Create a custom notification or use your app's notification system
    const updateNotification = document.createElement('div');
    updateNotification.id = 'pwa-update-notification';
    updateNotification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
          <strong style="font-size: 1rem;">Update Available</strong>
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0;
            margin-left: 1rem;
          ">×</button>
        </div>
        <p style="margin: 0 0 1rem 0; font-size: 0.9rem; opacity: 0.9;">
          A new version of RoadRescue is available. Update now for the latest features and improvements.
        </p>
        <div style="display: flex; gap: 0.5rem;">
          <button onclick="window.pwa.activateUpdate()" style="
            background: white;
            color: #3b82f6;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
          ">Update Now</button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            background: transparent;
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 0.5rem 1rem;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
          ">Later</button>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
    `;
    
    document.body.appendChild(updateNotification);
  }

  // Activate the new service worker
  activateUpdate() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Remove notification
      const notification = document.getElementById('pwa-update-notification');
      if (notification) {
        notification.remove();
      }
    }
  }

  // Unregister service worker
  async unregister() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.unregister();
        console.log('[PWA] Service Worker unregistered successfully');
        return true;
      } catch (error) {
        console.error('[PWA] Service Worker unregistration failed:', error);
        return false;
      }
    }
    return false;
  }

  // Get current service worker version
  getVersion() {
    if (this.swRegistration) {
      return this.swRegistration.active?.scriptURL || 'unknown';
    }
    return 'not registered';
  }

  // Check if app is running in standalone mode (PWA)
  isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  // Install prompt for PWA
  async showInstallPrompt() {
    let deferredPrompt = null;
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install button or banner
      this.showInstallBanner();
    });

    // Handle install button click
    window.addEventListener('click', async (e) => {
      if (e.target.matches('[data-pwa-install]')) {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`[PWA] Install prompt ${outcome}`);
          deferredPrompt = null;
        }
      }
    });
  }

  // Show install banner
  showInstallBanner() {
    const installBanner = document.createElement('div');
    installBanner.id = 'pwa-install-banner';
    installBanner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideUp 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <strong style="display: block; margin-bottom: 0.25rem;">Install RoadRescue</strong>
            <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">
              Get the best experience with our app
            </p>
          </div>
          <button data-pwa-install style="
            background: white;
            color: #667eea;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            margin-left: 1rem;
          ">Install</button>
        </div>
      </div>
      <style>
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      </style>
    `;
    
    document.body.appendChild(installBanner);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      const banner = document.getElementById('pwa-install-banner');
      if (banner) {
        banner.remove();
      }
    }, 10000);
  }
}

// Create global instance
window.pwa = new PWAServiceWorker();

// Auto-register when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.pwa.register();
  window.pwa.showInstallPrompt();
});

// Export for use in React components
export default window.pwa;
