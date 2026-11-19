import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { paymentApi, membershipApi } from '@/lib/api';
import { useAuth } from '@/context/useAuth';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('loading');
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<{ status: string; paid: boolean; amount: number; reference: string } | null>(null);

  useEffect(() => {
    const reference = searchParams.get('reference');
    if (!reference) {
      queueMicrotask(() => {
        setStatus('error');
        setError('No payment reference provided.');
      });
      return;
    }

    async function verify() {
      try {
        const res = await paymentApi.verify(reference!);
        const data = res.data as { status: string; paid: boolean; amount: number; reference: string };
        setPayment(data);
        if (data.paid) {
          setStatus('success');
          // Refresh membership status
          if (user) {
            membershipApi.get().catch(() => {});
          }
        } else {
          setStatus('error');
          setError('Payment was not successful.');
        }
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to verify payment.');
      }
    }

    verify();
  }, [searchParams, user]);

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="masthead mb-2">AntiJournals</div>
        <p className="text-secondary-grey text-sm">Verifying payment…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="masthead mb-2">AntiJournals</div>
          <div className="masthead-sub mb-6">Payment verification</div>
          <h1 className="text-3xl font-serif text-black mb-6">Payment verification failed</h1>
          {error && (
            <div className="p-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded mb-6">
              {error}
            </div>
          )}
          <Link to="/membership" className="btn">
            Try again
          </Link>
          <Link to="/" className="mt-4 inline-block text-[11px] font-sans tracking-widest uppercase text-secondary-grey">
            Return home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="masthead mb-2">AntiJournals</div>
        <div className="masthead-sub mb-6">Payment successful</div>

        <div className="bg-green-50 border border-green-100 rounded p-8 mb-8">
          <h1 className="text-3xl font-serif text-green-700 mb-4">Payment confirmed</h1>
          <p className="text-secondary-grey text-sm mb-4">
            Your payment has been verified successfully.
          </p>
          {payment && (
            <div className="text-left mb-4">
              <p className="text-xs font-sans tracking-widest uppercase text-secondary-grey mb-1">
                Reference
              </p>
              <p className="text-sm font-mono">{payment.reference}</p>
              <p className="text-xs font-sans tracking-widest uppercase text-secondary-grey mb-1">
                Amount
              </p>
              <p className="text-sm">₦{(payment.amount / 100).toLocaleString()}</p>
              <p className="text-xs font-sans tracking-widest uppercase text-secondary-grey mb-1">
                Status
              </p>
              <p className="text-sm font-medium text-green-700">{payment.status}</p>
            </div>
          )}
          <p className="text-secondary-grey text-sm mb-8">
            You now have access to your purchased content. You can view it in your account.
          </p>
          <Link to="/account" className="btn mb-4">
            View account
          </Link>
          <Link to="/" className="inline-block text-[11px] font-sans tracking-widest uppercase text-secondary-grey">
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
