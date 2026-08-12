import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/lib/supabase";

/**
 * Autenticação da BC Labs via Supabase Auth.
 * Não há cadastro público: os 3 sócios são convidados manualmente pelo painel do Supabase.
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthState | null>(null);

function toAuthUser(supabaseUser: {
  id: string;
  email?: string | undefined;
  user_metadata?: Record<string, unknown>;
}): AuthUser {
  const name =
    (supabaseUser.user_metadata?.["name"] as string | undefined) ??
    supabaseUser.email?.split("@")[0] ??
    "Sócio";
  return { id: supabaseUser.id, name, email: supabaseUser.email ?? "" };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? toAuthUser(data.session.user) : null);
      setReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toAuthUser(session.user) : null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(() => {
    void supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback((patch: Partial<AuthUser>) => {
    void supabase.auth.updateUser({ data: { name: patch.name } }).then(({ data, error }) => {
      if (!error && data.user) setUser(toAuthUser(data.user));
    });
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, ready, signIn, signOut, updateProfile }),
    [user, ready, signIn, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
