import { useState } from 'react';
import { newsletterApi } from '@/lib/api';

export function NewsletterPage() {
  const [step, setStep] = useState<'subscribe' | 'verify' | 'success'>('subscribe');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('idle');
    if (!consent) {
      setError('You must consent to our Privacy Policy to subscribe.');
      return;
    }
    try {
      const res = await newsletterApi.subscribe({ email }) as any;
      const data = res.data as { verification_token?: string; email: string; verified: boolean };
      setVerificationToken(data.verification_token || null);
      setStep('verify');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Subscription failed');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await newsletterApi.verify({ token });
      setStep('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await newsletterApi.unsubscribe({ email });
      setStatus('success');
      setStep('subscribe');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unsubscribe failed');
    }
  };

  return (
    <div className="bg-white">
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="masthead mb-2">AntiJournals</div>
          <div className="masthead-sub mb-10">Newsletter</div>

          {step === 'subscribe' && (
            <>
              <h1 className="text-balance text-4xl md:text-5xl font-serif text-black leading-tight mb-6">
                Newsletter
              </h1>
              <p className="text-secondary-grey text-sm mb-10">
                Occasional updates on new publications. Free, no paywall required.
              </p>

              <form onSubmit={handleSubscribe} className="space-y-4">
                {status === 'error' && (
                  <div className="p-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 text-xs font-sans font-medium tracking-widest uppercase text-white bg-black hover:bg-secondary-grey transition-colors"
                >
                  Subscribe
                </button>

                <div className="flex items-start gap-2 text-xs text-secondary-grey">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5"
                  />
                  <label className="leading-relaxed">
                    I consent to AntiJournals processing my email address in accordance with the{' '}
                    <a href="/privacy" className="text-black hover:text-secondary-grey underline">
                      Privacy Policy
                    </a>.
                  </label>
                </div>
              </form>

              <hr className="my-12 border-black/10" />

              <div>
                <h3 className="text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey mb-4">
                  Preferences
                </h3>
                <p className="text-secondary-grey text-sm">
                  The newsletter is independent of paid membership. You can receive free
                  updates without purchasing a subscription. You may unsubscribe at any time.
                </p>
              </div>
            </>
          )}

          {step === 'verify' && (
            <>
              <h1 className="text-balance text-4xl md:text-5xl font-serif text-black leading-tight mb-6">
                Confirm your subscription
              </h1>
              <p className="text-secondary-grey text-sm mb-10">
                A confirmation token has been generated. In production this is sent to your email address.
                Enter it below to verify your subscription.
              </p>

              {verificationToken && (
                <div className="bg-light-grey border border-black/10 rounded p-4 mb-6 text-xs font-mono text-secondary-grey break-all">
                  Verification token: {verificationToken}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                {status === 'error' && (
                  <div className="p-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
                    Verification token
                  </label>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 text-xs font-sans font-medium tracking-widest uppercase text-white bg-black hover:bg-secondary-grey transition-colors"
                >
                  Verify subscription
                </button>
                <p className="text-center text-[11px] text-secondary-grey mt-4">
                  Didn't receive a token? <a href="/newsletter" className="text-black underline">Subscribe again</a>.
                </p>
              </form>
            </>
          )}

          {step === 'success' && (
            <>
              <h1 className="text-balance text-4xl md:text-5xl font-serif text-black leading-tight mb-6">
                Thank you
              </h1>
              <div className="p-4 text-xs text-green-600 bg-green-50 border border-green-100 rounded mb-6">
                You&rsquo;re subscribed. You may unsubscribe at any time using the link in our emails or below.
              </div>
              <form onSubmit={handleUnsubscribe} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 text-xs font-sans font-medium tracking-widest uppercase text-white bg-black hover:bg-secondary-grey transition-colors"
                >
                  Unsubscribe
                </button>
                <p className="text-center text-[11px] text-secondary-grey mt-4">
                  <a href="/newsletter" className="text-black underline">Subscribe again</a>.
                </p>
              </form>
            </>
          )}

          {step !== 'subscribe' && (
            <hr className="my-12 border-black/10" />
          )}

          <div>
            <h3 className="text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey mb-4">
              Preferences
            </h3>
            <p className="text-secondary-grey text-sm">
              The newsletter is independent of paid membership. You can receive free
              updates without purchasing a subscription. You may unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default NewsletterPage;
