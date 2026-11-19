import { useState, type ReactNode } from 'react';
import { analyticsApi } from '@/lib/api';
import { AnalyticsContext } from './AnalyticsContext';
import { useCookieConsent } from '@/hooks/useCookieConsent';

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [, setPending] = useState(0);
  const sessionId = useState(() => Math.random().toString(36).slice(2))[0];
  const { isAnalyticsAllowed } = useCookieConsent();

  const track = (eventType: string, data?: Record<string, unknown>) => {
    if (!isAnalyticsAllowed()) return;
    setPending((p) => p + 1);
    analyticsApi.track({
      event_type: eventType,
      session_id: sessionId,
      ...data,
    }).catch(() => {}).finally(() => setPending((p) => p - 1));
  };

  return (
    <AnalyticsContext.Provider value={{ track }}>
      {children}
    </AnalyticsContext.Provider>
  );
}
