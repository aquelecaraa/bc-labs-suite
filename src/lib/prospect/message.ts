import type { SiteStatus } from "./types";

/**
 * Mensagem de WhatsApp personalizada, montada com dados reais do lead.
 * Nada é enviado automaticamente; a mensagem fica salva no lead.
 */
export function buildWhatsappMessage(input: {
  companyName: string;
  reviewsCount: number | null;
  rating: number | null;
  siteStatus: SiteStatus;
}): string {
  const { companyName } = input;

  return `Bom dia, tudo bem? Me chamo Lucas e trabalho na BC Labs, uma agência focada em criar páginas para empresas com o objetivo de destacar seu trabalho no mercado e aumentar suas conversões.

Percebi um detalhe importante na ${companyName}: hoje, quando alguém encontra vocês pelo Google, não tem acesso a uma página completa para conhecer melhor a empresa antes de entrar em contato pelo WhatsApp.

Isso pode fazer com que um possível cliente chegue ao contato sem conhecer os serviços, diferenciais e outros pontos importantes da empresa.

Gostaria de apresentar rapidamente nosso trabalho, sem tomar muito do seu tempo. Se fizer sentido para vocês, posso deixar nosso portfólio abaixo.`;
}