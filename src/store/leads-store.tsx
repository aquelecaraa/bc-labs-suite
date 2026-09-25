import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { enrichLeadFields } from "@/lib/prospect/enrich";
import { onlyDigits } from "@/lib/prospect/phone";
import type { ProspectCandidate } from "@/lib/prospect/types";
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
  importProspects: (
    candidates: ProspectCandidate[],
  ) => Promise<{ imported: number; duplicates: number; failed: number }>;
  refresh: () => Promise<void>;
  processPendingLeads: (onProgress?: (done: number, total: number) => void) => Promise<{ processed: number; failed: number; total: number }>;
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

      processPendingLeads: async (onProgress) => {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .or("status.is.null,status.eq.");
        if (error) {
          reportError("buscar leads pendentes", error);
          return { processed: 0, failed: 0, total: 0 };
        }
        const pending = (data ?? []) as Lead[];
        let processed = 0;
        let failed = 0;
        onProgress?.(0, pending.length);
        for (const [i, lead] of pending.entries()) {
          const { error: upErr } = await supabase
            .from("leads")
            .update(enrichLeadFields(lead))
            .eq("id", lead.id);
          if (upErr) {
            failed += 1;
            console.error("[bc-labs-crm] processar lead falhou:", upErr.message);
          } else processed += 1;
          onProgress?.(i + 1, pending.length);
        }
        await loadAll();
        return { processed, failed, total: pending.length };
      },

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

      importProspects: async (candidates) => {
        let imported = 0;
        let duplicates = 0;
        let failed = 0;
        const inserted: Lead[] = [];

        // Deduplicação na ordem: place_id → telefone → Google Maps URL → nome + endereço
        const key = (v?: string | null) => (v ?? "").trim().toLowerCase();
        const placeIds = new Set(leads.map((l) => key(l.place_id)).filter(Boolean));
        const phones = new Set(leads.map((l) => onlyDigits(l.phone ?? "")).filter(Boolean));
        const urls = new Set(leads.map((l) => key(l.google_maps_url)).filter(Boolean));
        const nameAddr = new Set(leads.map((l) => `${key(l.company_name)}|${key(l.address)}`));

        for (const c of candidates) {
          const cPhone = onlyDigits(c.phone);
          const cNameAddr = `${key(c.company_name)}|${key(c.address)}`;
          if (
            placeIds.has(key(c.place_id)) ||
            (cPhone && phones.has(cPhone)) ||
            (c.google_maps_url && urls.has(key(c.google_maps_url))) ||
            nameAddr.has(cNameAddr)
          ) {
            duplicates += 1;
            continue;
          }

          const { data, error } = await supabase
            .from("leads")
            .insert({
              company_name: c.company_name,
              phone: c.phone_display,
              website: c.website,
              address: c.address,
              city: c.city,
              state: c.state,
              postal_code: c.postal_code,
              category: c.category,
              place_id: c.place_id,
              google_maps_url: c.google_maps_url,
              google_rating: c.google_rating,
              google_reviews_count: c.google_reviews_count,
              source: c.source,
              score: c.score,
              priority: c.priority,
              opportunity_reason: c.opportunity_reason,
              status: "mensagem_pronta",
              whatsapp_message: c.whatsapp_message,
            })
            .select()
            .single();

          if (error) {
            // 23505 = índice único (place_id já existe no banco)
            if ((error as { code?: string }).code === "23505") {
              duplicates += 1;
            } else {
              failed += 1;
              console.error("[bc-labs-crm] importar lead falhou:", error.message);
            }
            continue;
          }

          placeIds.add(key(c.place_id));
          if (cPhone) phones.add(cPhone);
          if (c.google_maps_url) urls.add(key(c.google_maps_url));
          nameAddr.add(cNameAddr);
          inserted.push(data as Lead);
          imported += 1;
        }

        if (inserted.length) setLeads((prev) => [...inserted, ...prev]);
        return { imported, duplicates, failed };
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
