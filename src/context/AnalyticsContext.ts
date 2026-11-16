import { createContext } from 'react';

type AnalyticsContextType = {
  track: (eventType: string, data?: Record<string, unknown>) => void;
};

export const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);
