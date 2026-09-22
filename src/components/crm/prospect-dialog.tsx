import { useServerFn } from "@tanstack/react-start";
import { Loader2, Radar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { searchProspects } from "@/lib/prospect.functions";
import {
  DEFAULT_CITY,
  DEFAULT_NICHE_TERMS,
  DEFAULT_STATE,
} from "@/lib/prospect/constants";
import { useLeads } from "@/store/leads-store";

interface Progress {
  found: number;
  discarded: number;
  duplicates: number;
  approved: number;
  imported: number;
}

const EMPTY: Progress = { found: 0, discarded: 0, duplicates: 0, approved: 0, imported: 0 };

export function ProspectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { importProspects } = useLeads();
  const runSearch = useServerFn(searchProspects);

  const [niche, setNiche] = useState(DEFAULT_NICHE_TERMS.join(", "));
  const [city, setCity] = useState(DEFAULT_CITY);
  const [state, setState] = useState(DEFAULT_STATE);
  const [limit, setLimit] = useState("20");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Progress>(EMPTY);
  const [reasons, setReasons] = useState<Record<string, number>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSearch() {
    const qty = Number(limit);
    if (!Number.isFinite(qty) || qty < 1 || qty > 120) {
      toast.error("Informe uma quantidade entre 1 e 120.");
      return;
    }

    setRunning(true);
    setErrorMsg(null);
    setProgress(EMPTY);
    setReasons({});

    try {
      const result = await runSearch({
        data: { niche, city: city.trim(), state: state.trim(), limit: qty },
      });

      setProgress({
        found: result.stats.found,
        discarded: result.stats.discarded,
        duplicates: 0,
        approved: result.stats.approved,
        imported: 0,
      });
      setReasons(result.discardReasons);

      const outcome = await importProspects(result.candidates);
      setProgress((p) => ({
        ...p,
        duplicates: outcome.duplicates,
        imported: outcome.imported,
      }));

      if (outcome.imported > 0) {
        toast.success(`${outcome.imported} leads importados para o CRM.`);
      } else if (result.stats.approved === 0) {
        toast.info("Nenhuma empresa passou pelos filtros desta busca.");
      } else {
        toast.info("Todos os leads encontrados já estavam no CRM.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha inesperada na busca.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !running && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radar className="size-4 text-primary" /> Buscar leads no Google Maps
          </DialogTitle>
          <DialogDescription>
            As empresas são filtradas, pontuadas e recebem uma mensagem pronta de WhatsApp. Nada é
            enviado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prospect-niche">Nicho (um ou mais termos, separados por vírgula)</Label>
            <Textarea
              id="prospect-niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              rows={3}
              maxLength={1000}
              disabled={running}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="prospect-city">Cidade</Label>
              <Input
                id="prospect-city"
                value={city}
                maxLength={120}
                onChange={(e) => setCity(e.target.value)}
                disabled={running}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prospect-state">Estado</Label>
              <Input
                id="prospect-state"
                value={state}
                maxLength={40}
                onChange={(e) => setState(e.target.value)}
                disabled={running}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prospect-limit">Quantidade máxima de leads</Label>
            <Input
              id="prospect-limit"
              type="number"
              min={1}
              max={120}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              disabled={running}
            />
          </div>

          <div className="grid grid-cols-5 gap-2 rounded-lg border border-border bg-muted/20 p-3 text-center">
            {(
              [
                ["Encontrados", progress.found],
                ["Descartados", progress.discarded],
                ["Duplicados", progress.duplicates],
                ["Aprovados", progress.approved],
                ["Importados", progress.imported],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <p className="text-lg font-semibold tabular-nums">{value}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {running && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Buscando no Google Maps… isso pode levar
              alguns minutos.
            </p>
          )}

          {Object.keys(reasons).length > 0 && (
            <div className="space-y-1 rounded-lg border border-border p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Motivos de descarte</p>
              {Object.entries(reasons).map(([reason, count]) => (
                <p key={reason}>
                  {reason}: {count}
                </p>
              ))}
            </div>
          )}

          {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" disabled={running} onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleSearch} disabled={running}>
            {running ? <Loader2 className="size-4 animate-spin" /> : <Radar className="size-4" />}
            {running ? "Buscando…" : "Buscar leads"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
