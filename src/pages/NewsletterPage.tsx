import { useState } from 'react';
import { newsletterApi } from '@/lib/api';

export function NewsletterPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('idle');
    try {
      await newsletterApi.subscribe({ email });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Subscription failed');
    }
  };

  return (
    <div className="bg-white">
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="masthead mb-2">AntiPerson</div>
          <div className="masthead-sub mb-10">Newsletter</div>

          <h1 className="text-balance text-4xl md:text-5xl font-serif text-black leading-tight mb-6">
            Newsletter
          </h1>
          <p className="text-secondary-grey text-sm mb-10">
            Occasional updates on new publications. Free, no paywall required.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="p-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded">
                {error}
              </div>
            )}
            {status === 'success' && (
              <div className="p-4 text-xs text-green-600 bg-green-50 border border-green-100 rounded">
                Thank you for subscribing. Please check your inbox to confirm your email address.
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
        </div>
      </section>
    </div>
  );
}

export default NewsletterPage;