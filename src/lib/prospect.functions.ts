import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  DEFAULT_NICHE_TERMS,
  EXCLUDED_NAME_TERMS,
  MAX_REVIEWS,
  MIN_REVIEWS,
} from "./prospect/constants";
import { buildWhatsappMessage } from "./prospect/message";
import { formatBrazilianMobile, toBrazilianMobile } from "./prospect/phone";
import {
  buildOpportunityReason,
  computeScore,
  isIndependent,
  priorityFromScore,
  siteStatusFor,
} from "./prospect/scoring";
import type { ApifyPlace, ProspectCandidate, ProspectResult } from "./prospect/types";

const APIFY_ACTOR = "compass~crawler-google-places";

const inputSchema = z.object({
  niche: z.string().trim().max(1000).default(""),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(40),
  limit: z.number().int().min(1).max(120),
});

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseTerms(niche: string): string[] {
  const terms = niche
    .split(/[\n,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  return terms.length ? terms.slice(0, 20) : DEFAULT_NICHE_TERMS;
}

/**
 * Busca empresas no Google Maps via Apify, aplica filtros, remove duplicados
 * do próprio lote, calcula score e monta a mensagem de WhatsApp.
 * O token do Apify é lido apenas aqui, no servidor.
 */
export const searchProspects = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<ProspectResult> => {
    const token = process.env["APIFY_API_TOKEN"];
    if (!token) {
      throw new Error(
        "APIFY_API_TOKEN não configurado no servidor. Adicione a variável de ambiente e reinicie a aplicação.",
      );
    }

    const terms = parseTerms(data.niche);
    const perSearch = Math.max(5, Math.ceil((data.limit * 3) / terms.length));

    const response = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?timeout=300`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          searchStringsArray: terms,
          locationQuery: `${data.city}, ${data.state}, Brasil`,
          maxCrawledPlacesPerSearch: perSearch,
          language: "pt-BR",
          skipClosedPlaces: true,
          scrapePlaceDetailPage: false,
ическое: undefined,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`[prospect] Apify falhou [${response.status}]: ${body}`);
      throw new Error(`A busca no Apify falhou (${response.status}). Tente novamente em instantes.`);
    }

    const places = (await response.json()) as ApifyPlace[];
    const discardReasons: Record<string, number> = {};
    const discard = (reason: string) => {
      discardReasons[reason] = (discardReasons[reason] ?? 0) + 1;
    };

    const seenPlaceIds = new Set<string>();
    const seenPhones = new Set<string>();
    const candidates: ProspectCandidate[] = [];
    const cityNorm = normalize(data.city);

    for (const place of Array.isArray(places) ? places : []) {
      const name = (place.title ?? "").trim();
      if (!name || !place.placeId) {
        discard("Registro sem nome ou identificador");
        continue;
      }

      if (place.permanentlyClosed) {
        discard("Permanentemente fechada");
        continue;
      }

      const nameNorm = normalize(name);
      if (EXCLUDED_NAME_TERMS.some((t) => nameNorm.includes(normalize(t)))) {
        discard("Fora do perfil (rede, hospital, farmácia, público)");
        continue;
      }

      const placeCity = normalize(place.city ?? "");
      const placeAddress = normalize(place.address ?? "");
      if (placeCity ? placeCity !== cityNorm : !placeAddress.includes(cityNorm)) {
        discard("Fora da cidade pesquisada");
        continue;
      }

      const reviews = typeof place.reviewsCount === "number" ? place.reviewsCount : null;
      if (reviews === null || reviews < MIN_REVIEWS || reviews > MAX_REVIEWS) {
        discard(`Avaliações fora da faixa ${MIN_REVIEWS}–${MAX_REVIEWS}`);
        continue;
      }

      const mobile = toBrazilianMobile(place.phone);
      if (!mobile) {
        discard("Sem celular brasileiro válido");
        continue;
      }

      if (seenPlaceIds.has(place.placeId) || seenPhones.has(mobile)) {
        discard("Duplicado no próprio resultado");
        continue;
      }
      seenPlaceIds.add(place.placeId);
      seenPhones.add(mobile);

      const website = (place.website ?? "").trim();
      const rating = typeof place.totalScore === "number" ? place.totalScore : null;
      const siteStatus = siteStatusFor(website);
      const score = computeScore({
        hasWebsite: Boolean(website),
        reviewsCount: reviews,
        rating,
        isIndependent: isIndependent(name),
      });

      candidates.push({
        place_id: place.placeId,
        company_name: name,
        phone: mobile,
        phone_display: formatBrazilianMobile(mobile),
        website,
        address: (place.address ?? place.street ?? "").trim(),
        city: (place.city ?? data.city).trim(),
        state: (place.state ?? data.state).trim(),
        postal_code: (place.postalCode ?? "").trim(),
        category: (place.categoryName ?? "").trim(),
        google_maps_url: (place.url ?? "").trim(),
        google_rating: rating,
        google_reviews_count: reviews,
        score,
        priority: priorityFromScore(score),
        site_status: siteStatus,
        opportunity_reason: buildOpportunityReason({
          siteStatus,
          reviewsCount: reviews,
          rating,
        }),
        whatsapp_message: buildWhatsappMessage({
          companyName: name,
          reviewsCount: reviews,
          rating,
          siteStatus,
        }),
        source: "Google Maps (Apify)",
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    const approved = candidates.slice(0, data.limit);

    return {
      stats: {
        found: Array.isArray(places) ? places.length : 0,
        discarded: (Array.isArray(places) ? places.length : 0) - approved.length,
        approved: approved.length,
      },
      candidates: approved,
      discardReasons,
    };
  });
