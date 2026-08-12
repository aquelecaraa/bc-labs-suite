import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import type { Client, Expense, Sale } from "@/types";

/**
 * Camada de dados da BC Labs, agora ligada ao Supabase (Postgres + Realtime).
 * Todos os usuários autenticados (os 3 sócios) compartilham a mesma base.
 */

interface DataState {
  clients: Client[];
  sales: Sale[];
  expenses: Expense[];
  loading: boolean;
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
}

type TimeStamps = { created_at: string; updated_at: string };

const DataContext = createContext<DataState | null>(null);

function reportError(action: string, error: { message: string }) {
  console.error(`[bc-labs] ${action} falhou:`, error.message);
  toast.error(`Não foi possível ${action}. Tente novamente.`);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      const [clientsRes, salesRes, expensesRes] = await Promise.all([
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
        supabase.from("sales").select("*").order("date", { ascending: false }),
        supabase.from("expenses").select("*").order("date", { ascending: false }),
      ]);
      if (cancelled) return;

      if (clientsRes.error) reportError("carregar clientes", clientsRes.error);
      else setClients(clientsRes.data as Client[]);

      if (salesRes.error) reportError("carregar vendas", salesRes.error);
      else setSales(salesRes.data as Sale[]);

      if (expensesRes.error) reportError("carregar despesas", expensesRes.error);
      else setExpenses(expensesRes.data as Expense[]);

      setLoading(false);
    }

    void loadAll();

    // Mantém os 3 sócios sincronizados em tempo real quando qualquer um edita algo.
    const channel = supabase
      .channel("bc-labs-data")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        () => void loadAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        () => void loadAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => void loadAll(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  const value = useMemo<DataState>(
    () => ({
      clients,
      sales,
      expenses,
      loading,
      addSale: (input) => {
        void supabase
          .from("sales")
          .insert(input)
          .then(({ error }) => error && reportError("adicionar a venda", error));
      },
      updateSale: (id, input) => {
        void supabase
          .from("sales")
          .update(input)
          .eq("id", id)
          .then(({ error }) => error && reportError("atualizar a venda", error));
      },
      deleteSale: (id) => {
        void supabase
          .from("sales")
          .delete()
          .eq("id", id)
          .then(({ error }) => error && reportError("excluir a venda", error));
      },
      addExpense: (input) => {
        void supabase
          .from("expenses")
          .insert(input)
          .then(({ error }) => error && reportError("adicionar a despesa", error));
      },
      updateExpense: (id, input) => {
        void supabase
          .from("expenses")
          .update(input)
          .eq("id", id)
          .then(({ error }) => error && reportError("atualizar a despesa", error));
      },
      deleteExpense: (id) => {
        void supabase
          .from("expenses")
          .delete()
          .eq("id", id)
          .then(({ error }) => error && reportError("excluir a despesa", error));
      },
      addClient: (input) => {
        void supabase
          .from("clients")
          .insert(input)
          .then(({ error }) => error && reportError("adicionar o cliente", error));
      },
      updateClient: (id, input) => {
        void supabase
          .from("clients")
          .update(input)
          .eq("id", id)
          .then(({ error }) => error && reportError("atualizar o cliente", error));
      },
      deleteClient: (id) => {
        void supabase
          .from("clients")
          .delete()
          .eq("id", id)
          .then(({ error }) => error && reportError("excluir o cliente", error));
      },
      clientById: (id) => clients.find((c) => c.id === id),
    }),
    [clients, sales, expenses, loading],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData deve ser usado dentro de DataProvider");
  return ctx;
}
