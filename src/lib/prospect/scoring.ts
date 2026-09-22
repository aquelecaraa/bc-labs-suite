import type { SiteStatus } from "./types";

/**
 * Score 0–100. Só usamos sinais que realmente temos do Google Maps.
 * O bônus de "Instagram ativo sem site" existe no modelo, mas só é aplicado
 * quando essa informação vem de uma fonte confiável (hoje: nunca pelo Apify).
 */
export function computeScore(input: {
  hasWebsite: boolean;
  reviewsCount: number | null;
  rating: number | null;
  isIndependent: boolean;
  activeInstagramWithoutSite?: boolean;
}): number {
  let score = 0;
  if (!input.hasWebsite) score += 35;
  if (input.reviewsCount !== null && input.reviewsCount >= 50 && input.reviewsCount <= 200)
    score += 15;
  if (input.rating !== null && input.rating >= 4.5) score += 10;
  if (input.isIndependent) score += 10;
  if (input.activeInstagramWithoutSite) score += 15;
  return Math.max(0, Math.min(100, score));
}

export function priorityFromScore(score: number): "baixa" | "media" | "alta" {
  if (score >= 55) return "alta";
  if (score >= 30) return "media";
  return "baixa";
}

export function siteStatusFor(website: string): SiteStatus {
  // Sem análise real do site, nunca afirmamos que ele é ruim ou desatualizado.
  return website ? "SITE NÃO ANALISADO" : "SEM SITE";
}

/** Redes/franquias nacionais: excluídas do bônus de "clínica independente". */
const BIG_CHAINS = [
  "odontocompany",
  "oral sin",
  "orthodontic",
  "sorridents",
  "imbramed",
  "dental uni",
  "amor saude",
  "amor saúde",
  "dr consulta",
  "dr. consulta",
  "clinicas dr",
  "hapvida",
  "notredame",
  "einstein",
  "sirio libanes",
  "sírio libanês",
  "fleury",
  "delboni",
  "dasa",
  "labi",
  "sabin",
  "unimed",
  "sesc",
  "sesi",
  "cvc",
  "smart fit",
];

export function isIndependent(name: string): boolean {
  const n = name.toLowerCase();
  return !BIG_CHAINS.some((c) => n.includes(c));
}

export function buildOpportunityReason(input: {
  siteStatus: SiteStatus;
  reviewsCount: number | null;
  rating: number | null;
}): string {
  const parts: string[] = [input.siteStatus];
  if (input.reviewsCount !== null) parts.push(`${input.reviewsCount} avaliações no Google`);
  if (input.rating !== null) parts.push(`nota ${input.rating.toFixed(1).replace(".", ",")}`);
  return parts.join(" · ");
}
