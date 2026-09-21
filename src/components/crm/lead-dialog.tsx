import { useEffect, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLeads } from "@/store/leads-store";
import {
  LEAD_PRIORITIES,
  LEAD_PRIORITY_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type Lead,
  type LeadPriority,
  type LeadStatus,
} from "@/types";

const schema = z.object({
  company_name: z.string().trim().min(2, "Informe o nome da empresa").max(160),
  phone: z.string().trim().max(40),
  website: z.string().trim().max(200),
  address: z.string().trim().max(300),
  google_maps_url: z.string().trim().max(500),
  google_rating: z.string().trim().max(10),
  google_reviews_count: z.string().trim().max(10),
  source: z.string().trim().max(120),
  score: z.number().min(0).max(100),
  priority: z.enum(["baixa", "media", "alta"]),
  opportunity_reason: z.string().trim().max(500),
  status: z.enum(LEAD_STATUSES as [LeadStatus, ...LeadStatus[]]),
  notes: z.string().trim().max(500),
});

const emptyForm = () => ({
  company_name: "",
  phone: "",
  website: "",
  address: "",
  google_maps_url: "",
  google_rating: "",
  google_reviews_count: "",
  source: "",
  score: "0",
  priority: "media" as LeadPriority,
  opportunity_reason: "",
  status: "novo" as LeadStatus,
  notes: "",
});

export function LeadDialog({
  open,
  onOpenChange,
  lead,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead?: Lead | null;
}) {
  const { addLead, updateLead, addActivity } = useLeads();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      lead
        ? {
            company_name: lead.company_name,
            phone: lead.phone ?? "",
            website: lead.website ?? "",
            address: lead.address ?? "",
            google_maps_url: lead.google_maps_url ?? "",
            google_rating: lead.google_rating != null ? String(lead.google_rating) : "",
            google_reviews_count:
              lead.google_reviews_count != null ? String(lead.google_reviews_count) : "",
            source: lead.source ?? "",
            score: String(lead.score),
            priority: lead.priority,
            opportunity_reason: lead.opportunity_reason ?? "",
            status: lead.status,
            notes: lead.notes ?? "",
          }
        : emptyForm(),
    );
  }, [open, lead]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ ...form, score: Number(form.score) || 0 });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[String(i.path[0])] = i.message;
      setErrors(next);
      return;
    }

    setSaving(true);
    const payload = {
      company_name: parsed.data.company_name,
      phone: parsed.data.phone || undefined,
      website: parsed.data.website || undefined,
      address: parsed.data.address || undefined,
      google_maps_url: parsed.data.google_maps_url || undefined,
      google_rating: parsed.data.google_rating ? Number(parsed.data.google_rating) : null,
      google_reviews_count: parsed.data.google_reviews_count
        ? Number(parsed.data.google_reviews_count)
        : null,
      source: parsed.data.source || undefined,
      score: parsed.data.score,
      priority: parsed.data.priority,
      opportunity_reason: parsed.data.opportunity_reason || undefined,
      status: parsed.data.status,
      notes: parsed.data.notes || undefined,
    };

    if (lead) {
      if (lead.status !== payload.status) {
        await addActivity(
          lead.id,
          "status_change",
          `Status alterado de "${LEAD_STATUS_LABELS[lead.status]}" para "${LEAD_STATUS_LABELS[payload.status]}"`,
        );
      }
      await updateLead(lead.id, payload);
    } else {
      const created = await addLead(payload);
      if (created) await addActivity(created.id, "note", "Lead cadastrado");
    }
    setSaving(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
          <DialogDescription>Dados da empresa prospectada e status no funil.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="company_name">Nome da empresa</Label>
              <Input
                id="company_name"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
              {errors["company_name"] && (
                <p className="text-xs text-destructive">{errors["company_name"]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="website">Site</Label>
              <Input
                id="website"
                placeholder="https://…"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="google_maps_url">Link do Google Maps</Label>
              <Input
                id="google_maps_url"
                placeholder="https://maps.google.com/…"
                value={form.google_maps_url}
                onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="google_rating">Nota no Google</Label>
              <Input
                id="google_rating"
                inputMode="decimal"
                placeholder="4,5"
                value={form.google_rating}
                onChange={(e) =>
                  setForm({ ...form, google_rating: e.target.value.replace(",", ".") })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="google_reviews_count">Nº de avaliações</Label>
              <Input
                id="google_reviews_count"
                inputMode="numeric"
                value={form.google_reviews_count}
                onChange={(e) => setForm({ ...form, google_reviews_count: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="source">Origem do lead</Label>
              <Input
                id="source"
                placeholder="Google Maps ABC, indicação…"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="score">Score (0-100)</Label>
              <Input
                id="score"
                inputMode="numeric"
                value={form.score}
                onChange={(e) => setForm({ ...form, score: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as LeadPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {LEAD_PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as LeadStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {LEAD_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="opportunity_reason">Motivo da oportunidade</Label>
            <Textarea
              id="opportunity_reason"
              rows={2}
              value={form.opportunity_reason}
              onChange={(e) => setForm({ ...form, opportunity_reason: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : lead ? "Salvar alterações" : "Cadastrar lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
