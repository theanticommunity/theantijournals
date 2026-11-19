import { createContext } from 'react';
import type { User } from 'firebase/auth';

export type AuthContextType = {
  user: User | null;
  profile: { id: string; email: string; full_name?: string; role?: string } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
