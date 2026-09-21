import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Check,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  Pencil,
  Star,
  Target,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/common/confirm-delete";
import { EmptyState } from "@/components/common/empty-state";
import { SectionCard } from "@/components/common/section-card";
import { LeadPriorityBadge, LeadStatusBadge } from "@/components/common/status-badge";
import { LeadDialog } from "@/components/crm/lead-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { useLeads } from "@/store/leads-store";

export const Route = createFileRoute("/crm/$leadId")({
  head: () => ({
    meta: [{ title: "Detalhes do lead — BC Labs" }],
  }),
  component: LeadDetailPage,
});

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function LeadDetailPage() {
  const { leadId } = Route.useParams();
  const { leads, activitiesForLead, updateLead, deleteLead, convertToClient, addActivity } =
    useLeads();
  const navigate = useNavigate();
  const lead = leads.find((l) => l.id === leadId);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toDelete, setToDelete] = useState(false);
  const [message, setMessage] = useState(lead?.whatsapp_message ?? "");
  const [copied, setCopied] = useState(false);

  const activities = useMemo(
    () => (lead ? activitiesForLead(lead.id) : []),
    [lead, activitiesForLead],
  );

  if (!lead) {
    return (
      <EmptyState
        icon={Target}
        title="Lead não encontrado"
        description="O registro pode ter sido removido."
        action={
          <Button asChild variant="secondary">
            <Link to="/crm">Voltar para o CRM</Link>
          </Button>
        }
      />
    );
  }

  const whatsappNumber = onlyDigits(lead.phone ?? "");
  const canWhatsapp = whatsappNumber.length >= 10;

  async function handleSaveMessage() {
    if (!lead) return;
    await updateLead(lead.id, { whatsapp_message: message });
    toast.success("Mensagem salva");
  }

  async function handleCopy() {
    if (!message.trim()) return;
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleOpenWhatsapp() {
    if (!lead) return;
    const text = encodeURIComponent(message);
    const url = canWhatsapp
      ? `https://wa.me/55${whatsappNumber}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
    void addActivity(lead.id, "message_sent", "Abriu o WhatsApp para contato");
  }

  return (
    <>
      <Link
        to="/crm"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> CRM
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {lead.company_name}
            </h1>
            <LeadStatusBadge status={lead.status} />
            <LeadPriorityBadge priority={lead.priority} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Score {lead.score}/100 · cadastrado em {formatDate(lead.created_at)}
            {lead.source ? ` · origem: ${lead.source}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lead.status !== "cliente" && lead.status !== "perdido" && (
            <Button
              variant="secondary"
              onClick={async () => {
                await convertToClient(lead);
                void navigate({ to: "/clientes" });
              }}
              className="flex items-center gap-1.5"
            >
              <UserCheck className="size-4" /> Converter em cliente
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Pencil className="size-4" /> Editar
          </Button>
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setToDelete(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Dados da empresa" className="lg:col-span-1">
          <div className="space-y-3 text-sm">
            <InfoRow icon={Building2} label="Telefone" value={lead.phone || "—"} />
            <InfoRow
              icon={ExternalLink}
              label="Site"
              value={
                lead.website ? (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {lead.website}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <InfoRow icon={MapPin} label="Endereço" value={lead.address || "—"} />
            <InfoRow
              icon={Star}
              label="Google"
              value={
                lead.google_rating != null
                  ? `${lead.google_rating} · ${lead.google_reviews_count ?? 0} avaliações`
                  : "—"
              }
            />
            {lead.google_maps_url && (
              <a
                href={lead.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" /> Ver no Google Maps
              </a>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Oportunidade" className="lg:col-span-2">
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Motivo da oportunidade
              </p>
              <p className="mt-1">{lead.opportunity_reason || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Observações</p>
              <p className="mt-1">{lead.notes || "—"}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Mensagem de WhatsApp" className="lg:col-span-2">
          <div className="space-y-3">
            <Textarea
              rows={4}
              placeholder="Escreva ou cole a mensagem para este lead… (geração automática por IA ainda não está ativa)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveMessage}
                className="flex items-center gap-1.5"
              >
                Salvar mensagem
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="flex items-center gap-1.5"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button
                type="button"
                onClick={handleOpenWhatsapp}
                disabled={!message.trim()}
                className="flex items-center gap-1.5"
              >
                <MessageCircle className="size-4" /> Abrir WhatsApp
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Histórico de atividades" className="lg:col-span-1" bodyClassName="p-0">
          {activities.length === 0 ? (
            <EmptyState icon={Target} title="Sem atividades ainda" />
          ) : (
            <ul className="divide-y divide-border">
              {activities.map((a) => (
                <li key={a.id} className="px-4 py-3 text-sm">
                  <p>{a.description}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <LeadDialog open={isEditOpen} onOpenChange={setIsEditOpen} lead={lead} />

      <ConfirmDelete
        open={toDelete}
        onOpenChange={setToDelete}
        title="Excluir lead?"
        description={`O lead ${lead.company_name} e seu histórico serão removidos.`}
        onConfirm={() => {
          void deleteLead(lead.id);
          void navigate({ to: "/crm" });
        }}
      />
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
