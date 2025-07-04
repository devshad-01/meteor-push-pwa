import React, { useEffect } from 'react';
import { AppRouter } from './Router';

export const App = () => {
  useEffect(() => {
    // Register service worker immediately
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration.scope);
        })
        .catch(error => {
          console.error('SW registration failed:', error);
        });
    }
  }, []);

  return <AppRouter />;
};
