import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { demoClients, demoExpenses, demoSales, IS_DEMO_DATA } from "@/data/demo";
import type { Client, Expense, Sale } from "@/types";

/**
 * Camada de dados da BC Labs.
 * Hoje: dados de demonstração persistidos localmente.
 * Futuro: trocar as implementações por chamadas ao Supabase mantendo a mesma API.
 */

interface DataState {
  clients: Client[];
  sales: Sale[];
  expenses: Expense[];
  loading: boolean;
  isDemo: boolean;
  addSale: (input: Omit<Sale, keyof TimeStamps | "id">) => void;
  updateSale: (id: string, input: Partial<Sale>) => void;
  deleteSale: (id: string) => void;
  addExpense: (input: Omit<Expense, keyof TimeStamps | "id">) => void;
  updateExpense: (id: string, input: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addClient: (input: Omit<Client, keyof TimeStamps | "id">) => void;
  updateClient: (id: string, input: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  clientById: (id: string) => Client | undefined;
  resetDemoData: () => void;
}

type TimeStamps = { created_at: string; updated_at: string };

const STORAGE_KEY = "bclabs.data.v1";
const DataContext = createContext<DataState | null>(null);

const stamp = () => new Date().toISOString();
const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

interface Snapshot {
  clients: Client[];
  sales: Sale[];
  expenses: Expense[];
}

const seed = (): Snapshot => ({ clients: demoClients, sales: demoSales, expenses: demoExpenses });

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Snapshot>(seed);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw) as Snapshot);
    } catch {
      /* ignora storage indisponível */
    }
    const t = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(t);
  }, []);

  const persist = useCallback((next: Snapshot) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignora storage indisponível */
    }
  }, []);

  const value = useMemo<DataState>(() => {
    const mutate = (fn: (s: Snapshot) => Snapshot) =>
      setState((prev) => {
        const next = fn(prev);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* noop */
        }
        return next;
      });

    return {
      ...state,
      loading,
      isDemo: IS_DEMO_DATA,
      addSale: (input) =>
        mutate((s) => ({
          ...s,
          sales: [{ ...input, id: uid("sal"), created_at: stamp(), updated_at: stamp() }, ...s.sales],
        })),
      updateSale: (id, input) =>
        mutate((s) => ({
          ...s,
          sales: s.sales.map((x) => (x.id === id ? { ...x, ...input, updated_at: stamp() } : x)),
        })),
      deleteSale: (id) => mutate((s) => ({ ...s, sales: s.sales.filter((x) => x.id !== id) })),
      addExpense: (input) =>
        mutate((s) => ({
          ...s,
          expenses: [{ ...input, id: uid("exp"), created_at: stamp(), updated_at: stamp() }, ...s.expenses],
        })),
      updateExpense: (id, input) =>
        mutate((s) => ({
          ...s,
          expenses: s.expenses.map((x) => (x.id === id ? { ...x, ...input, updated_at: stamp() } : x)),
        })),
      deleteExpense: (id) => mutate((s) => ({ ...s, expenses: s.expenses.filter((x) => x.id !== id) })),
      addClient: (input) =>
        mutate((s) => ({
          ...s,
          clients: [{ ...input, id: uid("cli"), created_at: stamp(), updated_at: stamp() }, ...s.clients],
        })),
      updateClient: (id, input) =>
        mutate((s) => ({
          ...s,
          clients: s.clients.map((x) => (x.id === id ? { ...x, ...input, updated_at: stamp() } : x)),
        })),
      deleteClient: (id) => mutate((s) => ({ ...s, clients: s.clients.filter((x) => x.id !== id) })),
      clientById: (id) => state.clients.find((c) => c.id === id),
      resetDemoData: () => persist(seed()),
    };
  }, [state, loading, persist]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData deve ser usado dentro de DataProvider");
  return ctx;
}
