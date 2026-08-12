import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import type { Client, Expense, Sale } from "@/types";

interface DataState {
  clients: Client[];
  sales: Sale[];
  expenses: Expense[];
  loading: boolean;
  addSale: (input: Omit<Sale, keyof TimeStamps | "id">) => Promise<void>;
  updateSale: (id: string, input: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  addExpense: (input: Omit<Expense, keyof TimeStamps | "id">) => Promise<void>;
  updateExpense: (id: string, input: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addClient: (input: Omit<Client, keyof TimeStamps | "id">) => Promise<void>;
  updateClient: (id: string, input: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  clientById: (id: string) => Client | undefined;
  refresh: () => Promise<void>;
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

  async function loadAll() {
    const [clientsRes, salesRes, expensesRes] = await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("sales").select("*").order("date", { ascending: false }),
      supabase.from("expenses").select("*").order("date", { ascending: false }),
    ]);

    if (clientsRes.error) reportError("carregar clientes", clientsRes.error);
    else setClients(clientsRes.data as Client[]);

    if (salesRes.error) reportError("carregar vendas", salesRes.error);
    else setSales(salesRes.data as Sale[]);

    if (expensesRes.error) reportError("carregar despesas", expensesRes.error);
    else setExpenses(expensesRes.data as Expense[]);

    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await loadAll();
      if (cancelled) return;
    }

    void init();

    const channel = supabase
      .channel("bc-labs-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => void loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => void loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => void loadAll())
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
      refresh: loadAll,

      // VENDAS
      addSale: async (input) => {
        const { data, error } = await supabase.from("sales").insert(input).select().single();
        if (error) {
          reportError("adicionar a venda", error);
        } else if (data) {
          setSales((prev) => [data as Sale, ...prev]);
          toast.success("Venda registrada com sucesso!");
        }
      },
      updateSale: async (id, input) => {
        const { data, error } = await supabase.from("sales").update(input).eq("id", id).select().single();
        if (error) {
          reportError("atualizar a venda", error);
        } else if (data) {
          setSales((prev) => prev.map((s) => (s.id === id ? (data as Sale) : s)));
        }
      },
      deleteSale: async (id) => {
        const { error } = await supabase.from("sales").delete().eq("id", id);
        if (error) {
          reportError("excluir a venda", error);
        } else {
          setSales((prev) => prev.filter((s) => s.id !== id));
          toast.success("Venda excluída!");
        }
      },

      // DESPESAS
      addExpense: async (input) => {
        const { data, error } = await supabase.from("expenses").insert(input).select().single();
        if (error) {
          reportError("adicionar a despesa", error);
        } else if (data) {
          setExpenses((prev) => [data as Expense, ...prev]);
          toast.success("Despesa lançada!");
        }
      },
      updateExpense: async (id, input) => {
        const { data, error } = await supabase.from("expenses").update(input).eq("id", id).select().single();
        if (error) {
          reportError("atualizar a despesa", error);
        } else if (data) {
          setExpenses((prev) => prev.map((e) => (e.id === id ? (data as Expense) : e)));
        }
      },
      deleteExpense: async (id) => {
        const { error } = await supabase.from("expenses").delete().eq("id", id);
        if (error) {
          reportError("excluir a despesa", error);
        } else {
          setExpenses((prev) => prev.filter((e) => e.id !== id));
        }
      },

      // CLIENTES
      addClient: async (input) => {
        const { data, error } = await supabase.from("clients").insert(input).select().single();
        if (error) {
          reportError("adicionar o cliente", error);
        } else if (data) {
          setClients((prev) => [data as Client, ...prev]);
          toast.success("Cliente cadastrado!");
        }
      },
      updateClient: async (id, input) => {
        const { data, error } = await supabase.from("clients").update(input).eq("id", id).select().single();
        if (error) {
          reportError("atualizar o cliente", error);
        } else if (data) {
          setClients((prev) => prev.map((c) => (c.id === id ? (data as Client) : c)));
        }
      },
      deleteClient: async (id) => {
        const { error } = await supabase.from("clients").delete().eq("id", id);
        if (error) {
          reportError("excluir o cliente", error);
        } else {
          setClients((prev) => prev.filter((c) => c.id !== id));
          toast.success("Cliente removido!");
        }
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