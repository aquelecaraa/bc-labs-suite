import { describe, expect, it } from "vitest";

import { compareLeadPriority } from "./lead-priority";
import type { Lead } from "@/types";

describe("compareLeadPriority", () => {
  it("orders high, medium, low while preserving equal-priority order", () => {
    const leads = ["baixa", "alta", "media", "alta"] as Lead["priority"][];
    const sorted = leads
      .map((priority, index) => ({ priority, index }) as Lead & { index: number })
      .sort(compareLeadPriority);
    expect(sorted.map((lead) => lead.priority)).toEqual(["alta", "alta", "media", "baixa"]);
    expect(sorted.slice(0, 2).map((lead) => lead.index)).toEqual([1, 3]);
  });
});