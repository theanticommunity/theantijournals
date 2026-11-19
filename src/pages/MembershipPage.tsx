import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { paymentApi, membershipApi } from '@/lib/api';

export function MembershipPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [membership, setMembership] = useState<{ membership: string; subscription_status: string | null } | null>(null);
  const [plans] = useState<{ id: string; name: string; amount: number; interval: string }[]>([
    { id: 'monthly', name: 'Monthly', amount: 200000, interval: 'month' },
    { id: 'yearly', name: 'Yearly', amount: 2000000, interval: 'year' },
  ]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const mRes = await membershipApi.get();
        setMembership(mRes.data);
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  async function handleSubscribe(planId: string) {
    if (!user) {
      navigate('/login');
      return;
    }
    setError('');
    setProcessing(true);
    try {
      const res = await paymentApi.createSubscription({ plan: planId, email: user.email || '' });
      const { authorization_url } = res.data as { authorization_url?: string };
      if (authorization_url) {
        window.location.assign(authorization_url);
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
          <div className="masthead mb-2">AntiJournals</div>
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

              {!isPremium && plans.length > 0 && (
                <>
                  <div className="grid md:grid-cols-2 gap-12 mb-16">
                    {plans.map((plan) => (
                      <div key={plan.id} className={`border p-8 ${plan.interval === 'year' ? 'border-black bg-black' : 'border-black/10'}`}>
                        <h2 className={`text-xl font-serif text-black mb-4 ${plan.interval === 'year' ? 'text-white' : ''}`}>
                          {plan.name}
                        </h2>
                        <div className={`text-3xl font-serif font-bold mb-2 ${plan.interval === 'year' ? 'text-white' : 'text-black'}`}>
                          ₦{(plan.amount / 100).toLocaleString()}
                        </div>
                        <div className={`text-secondary-grey/70 text-sm mb-6 ${plan.interval === 'year' ? '' : 'text-secondary-grey'}`}>
                          / {plan.interval}
                        </div>
                        <p className={`text-secondary-grey text-sm mb-6 ${plan.interval === 'year' ? 'text-secondary-grey/70' : ''}`}>
                          Access to all publications including premium and exclusive content.
                        </p>
                        <ul className={`space-y-3 text-sm text-secondary-grey mb-6 ${plan.interval === 'year' ? 'text-secondary-grey/70' : ''}`}>
                          <li>All free publications</li>
                          <li>Premium articles</li>
                          <li>Member-only content</li>
                          <li>Subscription management</li>
                        </ul>
                        <button
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={processing}
                          className={`btn block text-center w-full ${plan.interval === 'year' ? 'btn-outline' : ''}`}
                        >
                          {processing ? 'Subscribing…' : `Subscribe ${plan.interval}`}
                        </button>
                        <p className="mt-4 text-xs text-secondary-grey/70 text-center">
                          Powered by Paystack. International cards accepted.
                        </p>
                      </div>
                    ))}
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

                  <div className="mt-8 p-4 bg-light-grey border border-black/10 rounded">
                    <p className="text-[10px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
                      EU consumers — cooling-off period
                    </p>
                    <p className="text-[10px] text-secondary-grey leading-relaxed">
                      If you are located in the European Union, you have a 14-day cooling-off period from the date
                      of purchase. By subscribing, you consent to immediate access to digital content and
                      acknowledge your right to withdraw is lost once access begins, except as required by law.
                      No refunds for partial subscription periods except as required by law.
                    </p>
                  </div>
                </>
              )}

              {!isPremium && plans.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-secondary-grey text-sm">
                    No subscription plans available at the moment.
                  </p>
                </div>
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
