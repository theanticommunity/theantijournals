import { useState, useCallback, type ReactNode } from 'react';
import { CookieConsentContext, type CookieConsentContextType } from './CookieConsentContext';

const CONSENT_KEY = 'antiperson:cookie_consent';
const CONSENT_VERSION = 1;

function getStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed as ConsentState;
  } catch {
    return null;
  }
}

type ConsentCategories = {
  essential: boolean;
  analytics: boolean;
};

type ConsentState = {
  granted: boolean;
  categories: ConsentCategories;
  timestamp: number;
};

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(() => getStoredConsent());

  const grantConsent = useCallback((categories: ConsentCategories) => {
    const state: ConsentState = {
      granted: true,
      categories,
      timestamp: Date.now(),
    };
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: CONSENT_VERSION, ...state }));
    } catch {
      // Ignore storage errors
    }
    setConsent(state);
  }, []);

  const withdrawConsent = useCallback(() => {
    try {
      window.localStorage.removeItem(CONSENT_KEY);
    } catch {
      // Ignore storage errors
    }
    setConsent(null);
  }, []);

  const isAnalyticsAllowed = useCallback(() => {
    return !!(consent?.granted && consent?.categories.analytics === true);
  }, [consent]);

  const value: CookieConsentContextType = {
    consent,
    grantConsent,
    withdrawConsent,
    isAnalyticsAllowed,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {consent ? children : (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" />
          <div className="fixed bottom-0 left-0 right-0 z-[61] bg-white border-t border-black/10 p-4 sm:p-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-sans font-medium text-black">
                    Cookies and similar technologies
                  </h3>
                  <p className="text-xs text-secondary-grey leading-relaxed">
                    We use essential cookies to run the site and optional analytics cookies to understand how visitors
                    use AntiJournals. Analytics cookies collect your IP address, browser, and page views. You can choose
                    which categories to allow.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    onClick={() => grantConsent({ essential: true, analytics: false })}
                    className="px-4 py-2 text-xs font-sans font-medium text-black border border-black bg-white hover:bg-light-grey transition-colors"
                  >
                    Reject non-essential
                  </button>
                  <button
                    onClick={() => grantConsent({ essential: true, analytics: true })}
                    className="px-4 py-2 text-xs font-sans font-medium text-white bg-black hover:bg-secondary-grey transition-colors"
                  >
                    Accept all
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </CookieConsentContext.Provider>
  );
}

export default CookieConsentProvider;
