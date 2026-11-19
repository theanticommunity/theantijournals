import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, createUserWithEmailAndPassword, firebaseUpdateProfile } from '@/firebase/config';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!ageConfirmed) {
      setError('You must confirm you are 13 or older.');
      setLoading(false);
      return;
    }
    if (!termsAccepted) {
      setError('You must accept the Terms of Service.');
      setLoading(false);
      return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (cred.user) {
        await firebaseUpdateProfile(cred.user, { displayName: name });
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="masthead mb-2">AntiJournals</div>
          <div className="masthead-sub mb-6">Create an account</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
              Full name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
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
          <div>
            <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-secondary-grey">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            <label className="leading-relaxed">
              I confirm I am 13 years of age or older.
            </label>
          </div>

          <div className="flex items-start gap-2 text-xs text-secondary-grey">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5"
            />
            <label className="leading-relaxed">
              I have read and agree to the{' '}
              <a href="/terms" className="text-black hover:text-secondary-grey underline">
                Terms of Service
              </a>
              {' '}
              and{' '}
              <a href="/privacy" className="text-black hover:text-secondary-grey underline">
                Privacy Policy
              </a>
              .
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-xs font-sans font-medium tracking-widest uppercase text-white bg-black hover:bg-secondary-grey transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] font-sans tracking-widest uppercase text-secondary-grey">
          Already have an account?{' '}
          <Link to="/login" className="text-black hover:text-secondary-grey transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
