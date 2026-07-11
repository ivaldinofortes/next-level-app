import { useEffect, useRef, useState } from 'react';

export function useConnectivity(isLoggedIn: boolean, onReconnect: () => void) {
  const [online, setOnline] = useState(navigator.onLine);
  const [sincronizando, setSincronizando] = useState(false);
  const isFirstOnlineRef = useRef(true);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isFirstOnlineRef.current) {
      isFirstOnlineRef.current = false;
      return;
    }
    if (online && isLoggedIn) onReconnect();
  }, [online, isLoggedIn, onReconnect]);

  return { online, sincronizando, setSincronizando };
}
