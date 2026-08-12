import { useMemo, useState } from "react";

import { previousRange, resolvePeriod } from "@/lib/finance";
import type { DateRange, PeriodKey } from "@/types";

export function usePeriod(initial: PeriodKey = "month") {
  const [period, setPeriod] = useState<PeriodKey>(initial);
  const [custom, setCustom] = useState<DateRange>(() => resolvePeriod("month"));

  const range = useMemo(() => resolvePeriod(period, custom), [period, custom]);
  const previous = useMemo(() => previousRange(range), [range]);

  return { period, setPeriod, custom, setCustom, range, previous };
}
