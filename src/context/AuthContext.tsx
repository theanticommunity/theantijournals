import { useEffect, useState, type ReactNode } from 'react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  firebaseUpdateProfile,
  type User,
} from '@/firebase/config';
import { AuthContext, type AuthContextType } from './AuthContext';

type ProfileType = {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.data);
      }
    } catch {
      // Profile load failed silently
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser ?? null);
      if (firebaseUser) {
        await loadProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (cred.user) {
      await firebaseUpdateProfile(cred.user, { displayName: name });
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const refresh = async () => {
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, refresh } as AuthContextType}>
      {children}
    </AuthContext.Provider>
  );
}
