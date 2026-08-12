import { createFileRoute } from "@tanstack/react-router";
import { Bot, Pencil, Plus, Receipt, RefreshCw, Trash2, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { SimpleBarChart } from "@/components/charts/bar-chart";
import { CategoryDonut } from "@/components/charts/category-donut";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { EmptyState } from "@/components/common/empty-state";
import { SectionCard } from "@/components/common/section-card";
import { StatCard } from "@/components/common/stat-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { expensesByCategory, filterByRange, growth, resolvePeriod, totalExpenses } from "@/lib/finance";
import { formatBRL, formatDate, formatPercent, toISODate } from "@/lib/format";
import { useData } from "@/store/data-store";
import { AI_VENDORS, EXPENSE_CATEGORIES, type AiVendor, type Expense, type ExpenseCategory } from "@/types";

export const Route = createFileRoute("/despesas")({
  head: () => ({
    meta: [
      { title: "Despesas — BC Labs" },
      { name: "description", content: "Controle de despesas, recorrências e custos de IA da BC Labs." },
      { property: "og:title", content: "Despesas — BC Labs" },
      { property: "og:description", content: "Controle de despesas e AI Spend da BC Labs." },
    ],
  }),
  component: ExpensesPage,
});

const schema = z.object({
  description: z.string().trim().min(2, "Descreva a despesa").max(120),
  amount: z.number().positive("Valor deve ser maior que zero"),
  date: z.string().min(1),
  notes: z.string().max(500),
});

function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useData();
  const monthRange = resolvePeriod("month");
  const lastMonthRange = resolvePeriod("lastMonth");
  const yearRange = resolvePeriod("year");

  const monthExpenses = filterByRange(expenses, monthRange);
  const lastMonthExpenses = filterByRange(expenses, lastMonthRange);
  const recurring = monthExpenses.filter((e) => e.recurring);
  const aiMonth = monthExpenses.filter((e) => e.category === "IA");
  const aiLast = lastMonthExpenses.filter((e) => e.category === "IA");
  const toolsMonth = monthExpenses.filter((e) => e.category === "Ferramentas");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [toDelete, setToDelete] = useState<Expense | null>(null);

  const aiByVendor = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filterByRange(expenses, yearRange).filter((x) => x.category === "IA"))
      map.set(e.ai_vendor ?? "Outras IAs", (map.get(e.ai_vendor ?? "Outras IAs") ?? 0) + e.amount);
    const total = [...map.values()].reduce((a, b) => a + b, 0);
    return [...map.entries()]
      .map(([name, value]) => ({ name, value, percent: total ? (value / total) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, yearRange]);

  const aiMonthly = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const value = expenses
        .filter((e) => e.category === "IA")
        .filter((e) => {
          const ed = new Date(e.date);
          return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
        })
        .reduce((a, e) => a + e.amount, 0);
      return { label: d.toLocaleDateString("pt-BR", { month: "short" }), value };
    });
  }, [expenses]);

  const aiYear = filterByRange(expenses, yearRange)
    .filter((e) => e.category === "IA")
    .reduce((a, e) => a + e.amount, 0);

  const rows = [...expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 40);

  return (
    <AppShell>
      <PageHeader
        title="Despesas"
        description="Todo o custo operacional da BC Labs, incluindo o gasto com inteligência artificial."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> Nova despesa
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Despesas do mês"
          value={formatBRL(totalExpenses(monthExpenses))}
          icon={Receipt}
          change={growth(totalExpenses(monthExpenses), totalExpenses(lastMonthExpenses))}
          invertChange
        />
        <StatCard
          label="Despesas recorrentes"
          value={formatBRL(totalExpenses(recurring))}
          icon={RefreshCw}
          hint={`${recurring.length} lançamentos fixos`}
        />
        <StatCard
          label="Gasto com IA"
          value={formatBRL(totalExpenses(aiMonth))}
          icon={Bot}
          change={growth(totalExpenses(aiMonth), totalExpenses(aiLast))}
          invertChange
        />
        <StatCard
          label="Gasto com ferramentas"
          value={formatBRL(totalExpenses(toolsMonth))}
          icon={Wrench}
          hint="no mês atual"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <SectionCard title="Despesas por categoria" description="Mês atual">
          {monthExpenses.length ? (
            <CategoryDonut data={expensesByCategory(monthExpenses)} />
          ) : (
            <EmptyState icon={Receipt} title="Sem despesas no mês" />
          )}
        </SectionCard>

        <SectionCard
          className="xl:col-span-2"
          title="AI Spend"
          description="Custos de inteligência artificial — estrutura pronta para conexão futura com APIs"
        >
          <div className="grid gap-4 md:grid-cols-4">
            <MiniStat label="Gasto atual" value={formatBRL(totalExpenses(aiMonth))} />
            <MiniStat label="Mês anterior" value={formatBRL(totalExpenses(aiLast))} />
            <MiniStat
              label="Variação"
              value={formatPercent(growth(totalExpenses(aiMonth), totalExpenses(aiLast)))}
            />
            <MiniStat label="Acumulado no ano" value={formatBRL(aiYear)} />
          </div>
          <div className="mt-4">
            <SimpleBarChart data={aiMonthly} height={200} color="var(--chart-4)" />
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {AI_VENDORS.map((v) => {
              const found = aiByVendor.find((x) => x.name === v);
              return (
                <li
                  key={v}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{v}</span>
                  <span className="tabular-nums">{formatBRL(found?.value ?? 0)}</span>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      <SectionCard className="mt-4" title="Lançamentos" bodyClassName="p-0">
        {rows.length === 0 ? (
          <EmptyState icon={Receipt} title="Nenhuma despesa registrada" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Descrição</th>
                  <th className="px-3 py-3 font-medium">Categoria</th>
                  <th className="px-3 py-3 font-medium">Data</th>
                  <th className="px-3 py-3 text-right font-medium">Valor</th>
                  <th className="px-3 py-3 font-medium">Recorrente</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                    <td className="px-5 py-3 font-medium">{e.description}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{formatDate(e.date)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatBRL(e.amount)}</td>
                    <td className="px-3 py-3 text-muted-foreground">{e.recurring ? "Sim" : "Não"}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditing(e);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Excluir"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setToDelete(e)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <ExpenseDialog
        open={open}
        onOpenChange={setOpen}
        expense={editing}
        onSubmit={(payload) => {
          if (editing) {
            updateExpense(editing.id, payload);
            toast.success("Despesa atualizada");
          } else {
            addExpense(payload);
            toast.success("Despesa registrada");
          }
        }}
      />

      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Excluir despesa?"
        onConfirm={() => {
          if (toDelete) {
            deleteExpense(toDelete.id);
            toast.success("Despesa excluída");
          }
          setToDelete(null);
        }}
      />
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-[11px] text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  expense: Expense | null;
  onSubmit: (payload: Omit<Expense, "id" | "created_at" | "updated_at">) => void;
}) {
  const [form, setForm] = useState({
    description: "",
    category: "Ferramentas" as ExpenseCategory,
    amount: "",
    date: toISODate(new Date()),
    recurring: false,
    ai_vendor: "OpenAI" as AiVendor,
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm({
      description: expense?.description ?? "",
      category: expense?.category ?? "Ferramentas",
      amount: expense ? String(expense.amount) : "",
      date: expense?.date ?? toISODate(new Date()),
      recurring: expense?.recurring ?? false,
      ai_vendor: (expense?.ai_vendor ?? "OpenAI") as AiVendor,
      notes: expense?.notes ?? "",
    });
  }, [open, expense]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ ...form, amount: Number(form.amount) || 0 });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[String(i.path[0])] = i.message;
      setErrors(next);
      return;
    }
    onSubmit({
      description: parsed.data.description,
      amount: parsed.data.amount,
      date: parsed.data.date,
      notes: parsed.data.notes,
      category: form.category,
      recurring: form.recurring,
      ai_vendor: form.category === "IA" ? form.ai_vendor : null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? "Editar despesa" : "Nova despesa"}</DialogTitle>
          <DialogDescription>Classifique corretamente para alimentar os relatórios.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="desc">Descrição</Label>
            <Input
              id="desc"
              value={form.description}
              maxLength={120}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            {errors["description"] && <p className="text-xs text-destructive">{errors["description"]}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                inputMode="decimal"
                value={form.amount}
                placeholder="0,00"
                onChange={(e) => setForm({ ...form, amount: e.target.value.replace(",", ".") })}
              />
              {errors["amount"] && <p className="text-xs text-destructive">{errors["amount"]}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edate">Data</Label>
              <Input
                id="edate"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            {form.category === "IA" && (
              <div className="space-y-1.5">
                <Label>Fornecedor de IA</Label>
                <Select
                  value={form.ai_vendor}
                  onValueChange={(v) => setForm({ ...form, ai_vendor: v as AiVendor })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_VENDORS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Recorrente</p>
              <p className="text-xs text-muted-foreground">Marque se a cobrança se repete mensalmente.</p>
            </div>
            <Switch
              checked={form.recurring}
              onCheckedChange={(v) => setForm({ ...form, recurring: v })}
              aria-label="Despesa recorrente"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="enotes">Observações</Label>
            <Textarea
              id="enotes"
              rows={2}
              maxLength={500}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{expense ? "Salvar alterações" : "Registrar despesa"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
