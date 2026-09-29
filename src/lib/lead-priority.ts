import type { Lead } from "@/types";

const priorityOrder = { alta: 0, media: 1, baixa: 2, "Standby - Redesign": 3, "Descartado": 4 } as const;

/** Keep equal-priority leads in their existing (newest-first) order. */
export function compareLeadPriority(a: Lead, b: Lead): number {
  return (priorityOrder[a.priority] ?? 5) - (priorityOrder[b.priority] ?? 5);
}