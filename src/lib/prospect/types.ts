/**
 * Tipos compartilhados entre a server function de prospecção e a interface.
 * Os campos do Apify seguem exatamente o que o Actor
 * `compass/crawler-google-places` retorna — nada é inventado aqui.
 */

export interface ApifyPlace {
  title?: string;
  placeId?: string;
  categoryName?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
  website?: string;
  totalScore?: number;
  reviewsCount?: number;
  permanentlyClosed?: boolean;
  url?: string;
}

/** Lead já filtrado, pontuado e com mensagem pronta — ainda não gravado. */
export interface ProspectCandidate {
  place_id: string;
  company_name: string;
  phone: string; // formato internacional 55DDD9XXXXXXXX
  phone_display: string;
  website: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  category: string;
  google_maps_url: string;
  google_rating: number | null;
  google_reviews_count: number | null;
  score: number;
  priority: "baixa" | "media" | "alta";
  site_status: SiteStatus;
  opportunity_reason: string;
  whatsapp_message: string;
  source: string;
}

export const SITE_STATUSES = [
  "SEM SITE",
  "SITE NÃO ANALISADO",
  "SITE DESATUALIZADO",
  "SITE POUCO PROFISSIONAL",
  "SITE BÁSICO",
  "SITE BOM",
  "SITE PROFISSIONAL",
] as const;

export type SiteStatus = (typeof SITE_STATUSES)[number];

export interface ProspectStats {
  found: number;
  discarded: number;
  approved: number;
}

export interface ProspectResult {
  stats: ProspectStats;
  candidates: ProspectCandidate[];
  /** Motivos agregados de descarte, para transparência na interface. */
  discardReasons: Record<string, number>;
}

export interface ProspectSearchInput {
  niche: string;
  city: string;
  state: string;
  limit: number;
}
