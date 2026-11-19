import { useState, useCallback, type ReactNode } from 'react';

const AGE_GATE_KEY = 'antiperson:age_verified';
const MIN_AGE = 13;

export function AgeGate({ children }: { children: ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem(AGE_GATE_KEY) === 'true';
    } catch {
      return null;
    }
  });

  const confirmAge = useCallback(() => {
    try {
      window.sessionStorage.setItem(AGE_GATE_KEY, 'true');
    } catch {
      // Ignore storage errors
    }
    setVerified(true);
  }, []);

  if (verified === null) return null;

  if (!verified) {
    return (
      <div className="fixed inset-0 z-[70] bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <div className="masthead mb-2">AntiJournals</div>
          <h1 className="text-3xl font-serif text-black mb-6">Age verification</h1>
          <p className="text-secondary-grey text-sm leading-relaxed mb-8">
            AntiJournals under AntiPerson is intended for readers aged {MIN_AGE} and older. By continuing, you
            least {MIN_AGE} years old.
          </p>
          <button
            onClick={confirmAge}
            className="w-full py-3 text-xs font-sans font-medium tracking-widest uppercase text-white bg-black hover:bg-secondary-grey transition-colors"
          >
            I am {MIN_AGE} or older
          </button>
          <p className="mt-4 text-[11px] font-sans text-secondary-grey">
            Not {MIN_AGE} or older? Please leave this site.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AgeGate;
