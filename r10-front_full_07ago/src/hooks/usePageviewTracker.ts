import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function usePageviewTracker() {
  const location = useLocation();

  useEffect(() => {
    const controller = new AbortController();
    const path = location.pathname + (location.search || '');
    if (!path.startsWith('/admin')) {
      // Não rastrear área admin para evitar ruído
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          path,
          ua: navigator.userAgent,
          referer: document.referrer || ''
        }),
        signal: controller.signal
      }).catch(() => {});
    }
    return () => controller.abort();
  }, [location.pathname, location.search]);
}
