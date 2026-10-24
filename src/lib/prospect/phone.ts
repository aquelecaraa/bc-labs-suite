/**
 * Validação/normalização de telefones brasileiros.
 * O Apify (compass/crawler-google-places) devolve apenas o campo `phone`;
 * não existe campo de WhatsApp. Quando o número é um celular brasileiro
 * válido, convertemos para o formato internacional para permitir abrir
 * o WhatsApp manualmente.
 */

const BLOCKED_PREFIXES = ["0800", "0300", "3003", "4004"];

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Retorna o número em formato internacional (55DDDNXXXXXXXX) ou null. */
export function toBrazilianMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let digits = onlyDigits(raw);
  if (!digits) return null;

  const bare = digits.replace(/^55/, "");
  if (BLOCKED_PREFIXES.some((p) => bare.startsWith(p) || digits.startsWith(p))) return null;

  if (digits.startsWith("55") && digits.length >= 12) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");

  // Celular: DDD (2) + 9 + 8 dígitos = 11
  if (digits.length !== 11) return null;

  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  if (digits[2] !== "9") return null;

  // Números repetidos/absurdos
  if (/^(\d)\1+$/.test(digits)) return null;

  return `55${digits}`;
}

export function isBrazilianMobile(raw: string | null | undefined): boolean {
  return toBrazilianMobile(raw) !== null;
}

/** (11) 99999-9999 a partir do formato internacional. */
export function formatBrazilianMobile(international: string): string {
  const d = international.replace(/^55/, "");
  if (d.length !== 11) return international;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function whatsappLink(international: string, message?: string): string {
  const base = `https://wa.me/${international}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export type PhoneType = "movel" | "fixo" | "desconhecido";

export function classifyPhone(raw?: string | null): PhoneType | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (!d) return null;
  if (/^0[38]00/.test(d)) return "desconhecido";
  if (/^55\d{10,11}$/.test(d)) d = d.slice(2);
  if (/^0\d{10,11}$/.test(d)) d = d.slice(1);
  if (/^[1-9]\d9\d{8}$/.test(d)) return "movel";
  if (/^[1-9]\d[2-5]\d{7}$/.test(d)) return "fixo";
  return "desconhecido";
}