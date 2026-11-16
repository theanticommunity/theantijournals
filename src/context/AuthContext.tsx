import { useEffect, useState, type ReactNode } from 'react';
import type { User } from '@/types/index';
import { authApi } from '@/lib/api';
import { AuthContext, type AuthContextType } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    authApi.me().then(({ data }) => { if (mounted) setUser(data); }).catch(() => { if (mounted) setUser(null); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    setUser(data);
  };

  const register = async (email: string, password: string, name: string) => {
    const { data } = await authApi.register({ email, password, name });
    setUser(data);
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
  };

  const refresh = async () => {
    try {
      const { data } = await authApi.me();
      setUser(data);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh } as AuthContextType}>
      {children}
    </AuthContext.Provider>
  );
}
