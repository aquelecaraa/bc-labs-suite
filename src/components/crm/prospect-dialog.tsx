import { Loader2, Radar, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_CITY, DEFAULT_STATE } from "@/lib/prospect/constants";
import { supabase } from "@/lib/supabase";
import { useLeads } from "@/store/leads-store";

// As tabelas novas (search_profiles, search_runs, search_discards) ainda não estão
// nos tipos gerados do Supabase. Depois de regenerar os tipos, troque `db` por `supabase`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface SearchProfile {
  id: string;
  name: string;
  search_terms: string[];
  locations: string[];
  max_leads: number;
  min_rating: number;
  max_rating: number;
  only_without_website: boolean;
  min_reviews: number;
  max_reviews_per_place: number;
}

interface Form {
  name: string;
  terms: string; // separados por vírgula
  locations: string; // separadas por ponto e vírgula
  limit: string;
  minRating: string;
  maxRating: string;
  onlyWithoutWebsite: boolean;
  minReviews: string;
  reviewsPerPlace: string;
}

interface Progress {
  scraped: number;
  approved: number;
  imported: number;
}

interface DiscardedPlace {
  name: string;
  reason: string;
  detail: string | null;
  rating: number | null;
  reviews_count: number | null;
  category: string | null;
}

// O nome da função que recarrega os leads varia no store; tentamos os nomes comuns.
type LeadsReload = {
  fetchLeads?: () => Promise<unknown> | unknown;
  loadLeads?: () => Promise<unknown> | unknown;
  refresh?: () => Promise<unknown> | unknown;
};

const EMPTY: Progress = { scraped: 0, approved: 0, imported: 0 };
const NEW_PROFILE = "new";

const DEFAULT_FORM: Form = {
  name: "",
  // Alto ticket: evita postos de saúde e clínicas populares
  terms: "Harmonização Facial, Implantes Dentários, Odontologia Estética",
  locations: `${DEFAULT_CITY}, ${DEFAULT_STATE}`,
  limit: "25",
  minRating: "3.5",
  maxRating: "4.5",
  onlyWithoutWebsite: false, // falta de site vira bônus no score, não descarte
  minReviews: "10",
  reviewsPerPlace: "20",
};

// Campo vazio vira NaN (e é recusado), em vez de virar 0 sem aviso
const toNumber = (v: string) => (v.trim() === "" ? NaN : Number(v.replace(",", ".")));
const splitList = (v: string, sep: string) =>
  v
    .split(sep)
    .map((s) => s.trim())
    .filter(Boolean);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function profileToForm(p: SearchProfile): Form {
  return {
    name: p.name,
    terms: p.search_terms.join(", "),
    locations: p.locations.join("; "),
    limit: String(p.max_leads),
    minRating: String(p.min_rating),
    maxRating: String(p.max_rating),
    onlyWithoutWebsite: p.only_without_website,
    minReviews: String(p.min_reviews),
    reviewsPerPlace: String(p.max_reviews_per_place),
  };
}

async function describeInvokeError(error: unknown): Promise<string> {
  const ctx = (error as { context?: Response }).context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.json();
      if (body?.error) return String(body.error);
    } catch {
      /* ignora */
    }
  }
  return error instanceof Error ? error.message : "Falha ao iniciar a busca.";
}

export function ProspectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const leadsStore = useLeads() as unknown as LeadsReload;
  const refresh = leadsStore.fetchLeads ?? leadsStore.loadLeads ?? leadsStore.refresh;

  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [profileId, setProfileId] = useState<string>(NEW_PROFILE);
  const [form, setForm] = useState<Form>(DEFAULT_FORM);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<Progress>(EMPTY);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, number>>({});
  const [discarded, setDiscarded] = useState<DiscardedPlace[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function loadProfiles(selectId?: string) {
    const { data, error } = await db
      .from("search_profiles")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(`Não foi possível carregar os perfis: ${error.message}`);
      return;
    }
    const list = (data ?? []) as SearchProfile[];
    setProfiles(list);
    const chosen = list.find((p) => p.id === selectId) ?? (selectId ? undefined : list[0]);
    if (chosen) {
      setProfileId(chosen.id);
      setForm(profileToForm(chosen));
    }
  }

  useEffect(() => {
    if (open) void loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSelectProfile(id: string) {
    setProfileId(id);
    if (id === NEW_PROFILE) {
      setForm(DEFAULT_FORM);
      return;
    }
    const p = profiles.find((x) => x.id === id);
    if (p) setForm(profileToForm(p));
  }

  /** Valida o formulário e devolve o payload para a tabela search_profiles. */
  function buildPayload() {
    const terms = splitList(form.terms, ",");
    const locations = splitList(form.locations, ";");
    const limit = toNumber(form.limit);
    const minRating = toNumber(form.minRating);
    const maxRating = toNumber(form.maxRating);
    const minReviews = toNumber(form.minReviews);
    const reviewsPerPlace = toNumber(form.reviewsPerPlace);

    if (terms.length === 0) throw new Error("Informe ao menos um termo de busca.");
    if (locations.length === 0) throw new Error("Informe ao menos uma cidade.");
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new Error("A quantidade de leads deve ser um número inteiro de 1 a 100.");
    if (!(minRating >= 0 && maxRating <= 5 && minRating <= maxRating))
      throw new Error("A faixa de nota deve estar entre 0 e 5, com mínimo menor ou igual ao máximo.");
    if (!Number.isInteger(minReviews) || minReviews < 0)
      throw new Error("O mínimo de avaliações deve ser um número inteiro maior ou igual a 0.");
    if (!Number.isInteger(reviewsPerPlace) || reviewsPerPlace < 0 || reviewsPerPlace > 50)
      throw new Error("A coleta de avaliações por lugar deve ficar entre 0 e 50.");

    return {
      name: form.name.trim() || `${terms[0]} — ${locations[0]}`,
      search_terms: terms,
      locations,
      max_leads: limit,
      min_rating: minRating,
      max_rating: maxRating,
      only_without_website: form.onlyWithoutWebsite,
      min_reviews: minReviews,
      max_reviews_per_place: reviewsPerPlace,
    };
  }

  /** Cria ou atualiza o perfil e devolve o id. */
  async function persistProfile(): Promise<string> {
    const payload = buildPayload();
    if (profileId === NEW_PROFILE) {
      const { data, error } = await db
        .from("search_profiles")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      await loadProfiles(data.id);
      return data.id as string;
    }
    const { error } = await db.from("search_profiles").update(payload).eq("id", profileId);
    if (error) throw new Error(error.message);
    await loadProfiles(profileId);
    return profileId;
  }

  async function handleSave() {
    setSaving(true);
    setErrorMsg(null);
    try {
      await persistProfile();
      toast.success("Perfil salvo.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar o perfil.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSearch() {
    setRunning(true);
    setErrorMsg(null);
    setProgress(EMPTY);
    setReasons({});
    setDiscarded([]);

    try {
      const id = await persistProfile();

      const { data, error } = await supabase.functions.invoke("run-prospecting", {
        body: { profile_id: id },
      });
      if (error) throw new Error(await describeInvokeError(error));
      const runId = (data as { run_id?: string })?.run_id;
      if (!runId) throw new Error("A busca não retornou um identificador de execução.");

      // Acompanha a execução (a função roda em segundo plano)
      const deadline = Date.now() + 6 * 60_000;
      let pollErrors = 0;
      while (Date.now() < deadline) {
        await sleep(4000);
        if (!mounted.current) return;

        const { data: run, error: runErr } = await db
          .from("search_runs")
          .select("status, places_scraped, leads_found, leads_new, discard_reasons, error")
          .eq("id", runId)
          .single();

        // Tolera falhas passageiras de rede: a busca continua rodando no servidor
        if (runErr || !run) {
          pollErrors += 1;
          if (pollErrors >= 3) {
            throw new Error(runErr?.message ?? "Não foi possível acompanhar a busca.");
          }
          continue;
        }
        pollErrors = 0;

        setProgress({
          scraped: run.places_scraped,
          approved: run.leads_found,
          imported: run.leads_new,
        });
        setReasons((run.discard_reasons ?? {}) as Record<string, number>);

        if (run.status === "failed") throw new Error(run.error ?? "A busca falhou.");

        if (run.status === "succeeded") {
          // Lista de lugares descartados e o motivo de cada um
          const { data: dis } = await db
            .from("search_discards")
            .select("name, reason, detail, rating, reviews_count, category")
            .eq("run_id", runId)
            .order("reason")
            .limit(500);
          setDiscarded((dis ?? []) as DiscardedPlace[]);

          // Os leads já foram salvos; se recarregar a lista falhar, não é erro da busca
          if (refresh) {
            try {
              await refresh();
            } catch {
              toast.info("Leads salvos. Atualize a página para vê-los.");
            }
          }

          if (run.leads_new > 0) {
            toast.success(`${run.leads_new} leads novos no CRM.`);
            if (!refresh) toast.info("Atualize a página para ver os novos leads.");
          } else if (run.leads_found === 0) {
            toast.info("Nenhuma empresa passou pelos filtros desta busca.");
          } else {
            toast.info("Todos os leads aprovados já estavam no CRM.");
          }
          return;
        }
      }
      throw new Error(
        "A busca demorou mais que o esperado. Veja o histórico de execuções e tente de novo.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha inesperada na busca.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setRunning(false);
    }
  }

  const busy = running || saving;

  return (
    <Dialog open={open} onOpenChange={(v) => !running && onOpenChange(v)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Perfil de busca</Label>
              <Select value={profileId} onValueChange={handleSelectProfile} disabled={busy}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NEW_PROFILE}>Novo perfil</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prospect-name">Nome do perfil</Label>
              <Input
                id="prospect-name"
                value={form.name}
                maxLength={80}
                placeholder="Ex.: Odonto SBC sem site"
                onChange={(e) => set("name", e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prospect-niche">Nicho (um ou mais termos, separados por vírgula)</Label>
            <Textarea
              id="prospect-niche"
              value={form.terms}
              onChange={(e) => set("terms", e.target.value)}
              rows={2}
              maxLength={1000}
              disabled={busy}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prospect-locations">
              Cidades (separadas por ponto e vírgula, com o estado)
            </Label>
            <Textarea
              id="prospect-locations"
              value={form.locations}
              onChange={(e) => set("locations", e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="São Bernardo do Campo, SP; Santo André, SP"
              disabled={busy}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="prospect-min-rating">Nota mínima</Label>
              <Input
                id="prospect-min-rating"
                inputMode="decimal"
                value={form.minRating}
                onChange={(e) => set("minRating", e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prospect-max-rating">Nota máxima</Label>
              <Input
                id="prospect-max-rating"
                inputMode="decimal"
                value={form.maxRating}
                onChange={(e) => set("maxRating", e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prospect-min-reviews">Mín. avaliações</Label>
              <Input
                id="prospect-min-reviews"
                type="number"
                min={0}
                value={form.minReviews}
                onChange={(e) => set("minReviews", e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prospect-limit">Máx. de leads</Label>
              <Input
                id="prospect-limit"
                type="number"
                min={1}
                max={100}
                value={form.limit}
                onChange={(e) => set("limit", e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={form.onlyWithoutWebsite}
                onChange={(e) => set("onlyWithoutWebsite", e.target.checked)}
                disabled={busy}
              />
              Apenas empresas sem site
            </label>
            <div className="flex items-center gap-2">
              <Label htmlFor="prospect-reviews" className="whitespace-nowrap text-sm font-normal">
                Avaliações lidas por lugar
              </Label>
              <Input
                id="prospect-reviews"
                type="number"
                min={0}
                max={50}
                className="w-20"
                value={form.reviewsPerPlace}
                onChange={(e) => set("reviewsPerPlace", e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/20 p-3 text-center">
            {(
              [
                ["Encontrados", progress.scraped],
                ["Aprovados", progress.approved],
                ["Novos no CRM", progress.imported],
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

          {discarded.length > 0 && (
            <details className="rounded-lg border border-border p-3 text-xs">
              <summary className="cursor-pointer font-medium text-foreground">
                Ver os {discarded.length} lugares descartados e o porquê
              </summary>
              <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1 text-muted-foreground">
                {discarded.map((d, i) => (
                  <li key={`${d.name}-${i}`} className="border-b border-border/60 pb-2 last:border-0">
                    <p className="font-medium text-foreground">{d.name}</p>
                    <p>
                      {d.reason}
                      {d.detail ? ` — ${d.detail}` : ""}
                    </p>
                    <p className="opacity-70">
                      {[
                        d.rating != null ? `nota ${String(d.rating).replace(".", ",")}` : null,
                        d.reviews_count != null ? `${d.reviews_count} avaliações` : null,
                        d.category,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" disabled={running} onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={busy}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Salvar perfil
          </Button>
          <Button onClick={handleSearch} disabled={busy}>
            {running ? <Loader2 className="size-4 animate-spin" /> : <Radar className="size-4" />}
            {running ? "Buscando…" : "Buscar leads"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}