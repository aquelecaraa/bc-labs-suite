import type { SiteStatus } from "./types";

/**
 * Mensagem de WhatsApp personalizada, montada só com dados reais do lead.
 * Nada é enviado automaticamente — a mensagem fica salva no lead.
 */
export function buildWhatsappMessage(input: {
  companyName: string;
  reviewsCount: number | null;
  rating: number | null;
  siteStatus: SiteStatus;
}): string {
  const { companyName, reviewsCount, rating, siteStatus } = input;

  const social =
    reviewsCount !== null
      ? `vi que vocês já têm uma boa presença por lá, com ${reviewsCount} avaliações`
      : rating !== null
        ? `vi que vocês têm nota ${rating.toFixed(1).replace(".", ",")} por lá`
        : "vi o perfil de vocês por lá";

  if (siteStatus === "SEM SITE") {
    return (
      `Oi, tudo bem? Encontrei a ${companyName} pelo Google e ${social}. ` +
      `Procurei o site da clínica, mas não encontrei um oficial. ` +
      `Trabalho com criação de sites para empresas locais e tive uma ideia de como poderia ficar a página de vocês. Posso te mostrar?`
    );
  }

  return (
    `Oi, tudo bem? Encontrei a ${companyName} pelo Google e ${social}. ` +
    `Vi que vocês já têm um site e trabalho com criação e melhoria de sites para clínicas da região. ` +
    `Posso te mostrar algumas ideias de como a página de vocês poderia atrair mais pacientes?`
  );
}
