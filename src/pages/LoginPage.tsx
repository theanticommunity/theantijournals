import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, signInWithEmailAndPassword } from '@/firebase/config';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="masthead mb-2">AntiJournals</div>
          <div className="masthead-sub mb-6">Log in</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
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
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-xs font-sans font-medium tracking-widest uppercase text-white bg-black hover:bg-secondary-grey transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] font-sans tracking-widest uppercase text-secondary-grey">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-black hover:text-secondary-grey transition-colors">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
