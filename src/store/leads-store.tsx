import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import type { Client, Lead, LeadActivity } from "@/types";

/**
 * Dados do CRM de prospecção (leads), num contexto próprio e independente
 * do data-store.tsx (clients/sales/expenses) — não interfere em nada existente.
 */

interface LeadsState {
  leads: Lead[];
  activities: LeadActivity[];
  loading: boolean;
  addLead: (input: Omit<Lead, keyof BaseFields | "id">) => Promise<Lead | null>;
  updateLead: (id: string, input: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  leadById: (id: string) => Lead | undefined;
  activitiesForLead: (leadId: string) => LeadActivity[];
  addActivity: (leadId: string, type: string, description: string) => Promise<void>;
  convertToClient: (lead: Lead) => Promise<Client | null>;
  refresh: () => Promise<void>;
}

type BaseFields = { created_at: string; updated_at: string };

const LeadsContext = createContext<LeadsState | null>(null);

function reportError(action: string, error: { message: string }) {
  console.error(`[bc-labs-crm] ${action} falhou:`, error.message);
  toast.error(`Não foi possível ${action}. Tente novamente.`);
}

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    const [leadsRes, activitiesRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("lead_activities").select("*").order("created_at", { ascending: false }),
    ]);

    if (leadsRes.error) reportError("carregar leads", leadsRes.error);
    else setLeads(leadsRes.data as Lead[]);

    if (activitiesRes.error) reportError("carregar histórico de atividades", activitiesRes.error);
    else setActivities(activitiesRes.data as LeadActivity[]);

    setLoading(false);
  }

  useEffect(() => {
    void loadAll();

    const channel = supabase
      .channel("bc-labs-crm")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => void loadAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lead_activities" },
        () => void loadAll(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const value = useMemo<LeadsState>(
    () => ({
      leads,
      activities,
      loading,
      refresh: loadAll,

      addLead: async (input) => {
        const { data, error } = await supabase.from("leads").insert(input).select().single();
        if (error) {
          reportError("adicionar o lead", error);
          return null;
        }
        setLeads((prev) => [data as Lead, ...prev]);
        toast.success("Lead cadastrado!");
        return data as Lead;
      },

      updateLead: async (id, input) => {
        const { data, error } = await supabase
          .from("leads")
          .update(input)
          .eq("id", id)
          .select()
          .single();
        if (error) {
          reportError("atualizar o lead", error);
        } else if (data) {
          setLeads((prev) => prev.map((l) => (l.id === id ? (data as Lead) : l)));
        }
      },

      deleteLead: async (id) => {
        const { error } = await supabase.from("leads").delete().eq("id", id);
        if (error) {
          reportError("excluir o lead", error);
        } else {
          setLeads((prev) => prev.filter((l) => l.id !== id));
          toast.success("Lead removido!");
        }
      },

      leadById: (id) => leads.find((l) => l.id === id),

      activitiesForLead: (leadId) => activities.filter((a) => a.lead_id === leadId),

      addActivity: async (leadId, type, description) => {
        const { data, error } = await supabase
          .from("lead_activities")
          .insert({ lead_id: leadId, type, description })
          .select()
          .single();
        if (error) {
          reportError("registrar a atividade", error);
        } else if (data) {
          setActivities((prev) => [data as LeadActivity, ...prev]);
        }
      },

      convertToClient: async (lead) => {
        const { data: client, error: clientError } = await supabase
          .from("clients")
          .insert({
            name: lead.company_name,
            email: "",
            phone: lead.phone ?? "",
            status: "active",
            notes: lead.notes ?? "",
          })
          .select()
          .single();

        if (clientError || !client) {
          reportError(
            "converter o lead em cliente",
            clientError ?? { message: "erro desconhecido" },
          );
          return null;
        }

        const { data: updatedLead, error: leadError } = await supabase
          .from("leads")
          .update({ status: "cliente", converted_client_id: client.id })
          .eq("id", lead.id)
          .select()
          .single();

        if (leadError) {
          reportError("atualizar o status do lead", leadError);
        } else if (updatedLead) {
          setLeads((prev) => prev.map((l) => (l.id === lead.id ? (updatedLead as Lead) : l)));
        }

        await supabase.from("lead_activities").insert({
          lead_id: lead.id,
          type: "conversion",
          description: `Convertido em cliente: ${lead.company_name}`,
        });

        toast.success(`${lead.company_name} agora é cliente!`);
        return client as Client;
      },
    }),
    [leads, activities, loading],
  );

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function useLeads(): LeadsState {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads deve ser usado dentro de LeadsProvider");
  return ctx;
}
