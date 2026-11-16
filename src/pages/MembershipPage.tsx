import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { paymentApi, membershipApi } from '@/lib/api';

export function MembershipPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [membership, setMembership] = useState<{ membership: string; subscription_status: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await membershipApi.get();
        setMembership(res.data.data);
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  async function handleSubscribe(plan: string) {
    if (!user) {
      navigate('/login');
      return;
    }
    setError('');
    setProcessing(true);
    try {
      const res = await paymentApi.createSubscription({ plan, email: user.email });
      const { authorization_url } = res.data.data;
      if (authorization_url) {
        window.location.href = authorization_url;
      } else {
        setError('Payment initialization failed.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed.');
    } finally {
      setProcessing(false);
    }
  }

  const isPremium = membership?.membership === 'premium';

  return (
    <div className="bg-white">
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="masthead mb-2">AntiPerson</div>
          <div className="masthead-sub mb-10">Membership</div>

          <h1 className="text-balance text-4xl md:text-5xl font-serif text-black leading-tight mb-12">
            Membership
          </h1>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-secondary-grey text-sm">Loading membership options…</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded mb-6">
                  {error}
                </div>
              )}

              {isPremium && (
                <div className="bg-black/5 border border-black/10 p-8 mb-12">
                  <h2 className="text-2xl font-serif text-black mb-4">Premium Member</h2>
                  <p className="text-secondary-grey text-sm">
                    You are currently a premium member. Your subscription status:{" "}
                    <strong>{membership?.subscription_status || 'active'}</strong>.
                  </p>
                  <p className="text-secondary-grey text-sm mt-2">
                    You have access to all premium publications and member-only content.
                  </p>
                </div>
              )}

              {!isPremium && (
                <>
                  <div className="grid md:grid-cols-2 gap-12 mb-16">
                    <div className="border border-black/10 p-8">
                      <h2 className="text-xl font-serif text-black mb-4">Free</h2>
                      <div className="text-3xl font-serif font-bold text-black mb-2">Free</div>
                      <p className="text-secondary-grey text-sm mb-6">
                        Access to free publications and newsletter.
                      </p>
                      <ul className="space-y-3 text-sm text-secondary-grey mb-6">
                        <li>Free publications</li>
                        <li>Newsletter subscription</li>
                        <li>Optional user account</li>
                        <li>Bookmark publications</li>
                      </ul>
                      <Link
                        to="/register"
                        className="btn-outline block text-center"
                      >
                        Join free
                      </Link>
                    </div>

                    <div className="border border-black bg-black p-8">
                      <h2 className="text-xl font-serif text-white mb-4">Premium</h2>
                      <div className="text-3xl font-serif font-bold text-white mb-1">₦2,000</div>
                      <div className="text-secondary-grey/70 text-sm mb-6">/ month</div>
                      <p className="text-secondary-grey text-sm mb-6">
                        Access to all publications including premium and exclusive content.
                      </p>
                      <ul className="space-y-3 text-sm text-secondary-grey/70 mb-6">
                        <li>All free publications</li>
                        <li>Premium articles</li>
                        <li>Member-only content</li>
                        <li>Subscription management</li>
                      </ul>
                      <button
                        onClick={() => handleSubscribe('monthly')}
                        disabled={processing}
                        className="btn block text-center w-full"
                      >
                        {processing ? 'Subscribing…' : 'Subscribe monthly'}
                      </button>
                      <button
                        onClick={() => handleSubscribe('yearly')}
                        disabled={processing}
                        className="btn-outline block text-center w-full mt-4"
                      >
                        ₦20,000 / year
                      </button>
                      <p className="mt-4 text-xs text-secondary-grey/70 text-center">
                        Powered by Paystack. International cards accepted.
                      </p>
                    </div>
                  </div>

                  <hr className="my-12 border-black/10" />

                  <h2 className="text-2xl font-serif text-black mb-6">Individual purchases</h2>
                  <p className="text-secondary-grey text-sm leading-relaxed mb-8">
                    Where available, individual premium publications can be purchased without a subscription.
                  </p>

                  <div className="text-center">
                    <p className="text-secondary-grey text-sm">
                      Payment processing is powered by Paystack. International cards accepted.
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          <div className="text-center">
            <p className="text-secondary-grey text-sm">
              Questions or correspondence can be directed to the publication.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MembershipPage;