import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Autenticação da BC Labs.
 * Hoje: sessão local de demonstração (nenhum backend conectado).
 * Futuro: substituir signIn/signUp/signOut por supabase.auth.* mantendo esta API,
 * e proteger as rotas pelo layout autenticado.
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  ready: boolean;
  isBackendConnected: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (patch: Partial<AuthUser>) => void;
}

const KEY = "bclabs.session.v1";
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      /* noop */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: AuthUser | null) => {
    setUser(next);
    try {
      if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
      else window.localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      isBackendConnected: false,
      signIn: async (email) => {
        await new Promise((r) => setTimeout(r, 500));
        persist({ id: "local-demo", name: email.split("@")[0] || "Operador", email });
      },
      signUp: async (name, email) => {
        await new Promise((r) => setTimeout(r, 600));
        persist({ id: "local-demo", name, email });
      },
      signOut: () => persist(null),
      updateProfile: (patch) => persist(user ? { ...user, ...patch } : null),
    }),
    [user, ready, persist],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
