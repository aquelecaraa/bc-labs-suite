import { buildWhatsappMessage } from "./message";
import {
  buildOpportunityReason,
  computeScore,
  isIndependent,
  priorityFromScore,
  siteStatusFor,
} from "./scoring";

/**
 * Aplica a mesma regra da prospecção (score, prioridade, motivo, mensagem)
 * a um lead já existente. Reutiliza as funções de scoring/message.
 */
export function enrichLeadFields(lead: {
  company_name: string;
  website?: string | null | undefined;
  google_rating?: number | string | null | undefined;
  google_reviews_count?: number | string | null | undefined;
}) {
  const num = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  const rating = num(lead.google_rating);
  const reviews = num(lead.google_reviews_count);
  const website = (lead.website ?? "").trim();
  const siteStatus = siteStatusFor(website);
  const score = computeScore({
    hasWebsite: !!website,
    reviewsCount: reviews,
    rating,
    isIndependent: isIndependent(lead.company_name),
  });
  return {
    score,
    priority: priorityFromScore(score),
    opportunity_reason: buildOpportunityReason({ siteStatus, reviewsCount: reviews, rating }),
    whatsapp_message: buildWhatsappMessage({
      companyName: lead.company_name,
      reviewsCount: reviews,
      rating,
      siteStatus,
    }),
    status: "mensagem_pronta" as const,
  };
}
