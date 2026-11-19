import { createContext } from 'react';

type ConsentCategories = {
  essential: boolean;
  analytics: boolean;
};

type ConsentState = {
  granted: boolean;
  categories: ConsentCategories;
  timestamp: number;
};

export type CookieConsentContextType = {
  consent: ConsentState | null;
  grantConsent: (categories: ConsentCategories) => void;
  withdrawConsent: () => void;
  isAnalyticsAllowed: () => boolean;
};

export const CookieConsentContext = createContext<CookieConsentContextType | null>(null);
