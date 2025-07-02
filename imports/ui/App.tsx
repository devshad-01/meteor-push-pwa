import React, { useState, useEffect } from 'react';
import { PWAInstaller } from './PWAInstaller';
import { NotificationManager } from './NotificationManager';

export const App = () => {
  const [userId, setUserId] = useState<string>('demo-user-123');
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (installed as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);
  }, []);

  const handleInstallPrompt = () => {
    setIsInstalled(true);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '20px' 
      }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
            🚀 Meteor PWA Notifications
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            Progressive Web App with Push Notifications
          </p>
          {isInstalled && (
            <p style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '10px', 
              borderRadius: '5px',
              marginTop: '20px'
            }}>
              ✅ App is installed as PWA!
            </p>
          )}
        </header>

        <main>
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '10px', 
            padding: '30px',
            marginBottom: '30px'
          }}>
            <NotificationManager userId={userId} />
          </div>

          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '10px', 
            padding: '30px',
            marginBottom: '30px'
          }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
              👤 User Settings
            </h3>
            <div style={{ textAlign: 'center' }}>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                User ID:
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '5px',
                  border: 'none',
                  fontSize: '16px',
                  textAlign: 'center',
                  width: '200px'
                }}
                placeholder="Enter user ID"
              />
            </div>
          </div>

          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '10px', 
            padding: '30px'
          }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
              📱 PWA Features
            </h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '10px' }}>✅ Service Worker Registration</li>
              <li style={{ marginBottom: '10px' }}>✅ Push Notification Support</li>
              <li style={{ marginBottom: '10px' }}>✅ Offline Capability</li>
              <li style={{ marginBottom: '10px' }}>✅ App Installation Prompt</li>
              <li style={{ marginBottom: '10px' }}>✅ Background Sync</li>
            </ul>
          </div>
        </main>

        {!isInstalled && <PWAInstaller onInstallPrompt={handleInstallPrompt} />}
      </div>
    </div>
  );
};
