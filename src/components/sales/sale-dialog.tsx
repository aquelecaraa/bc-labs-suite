import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

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
import { PRODUCTS } from "@/data/demo";
import { formatBRL, formatPercent, toISODate } from "@/lib/format";
import { useData } from "@/store/data-store";
import { PAYMENT_METHODS, type Sale, type SaleStatus } from "@/types";

const schema = z.object({
  client_id: z.string().min(1, "Selecione um cliente"),
  product: z.string().trim().min(2, "Informe o produto/serviço").max(120),
  date: z.string().min(1, "Informe a data"),
  gross: z.number().nonnegative("Valor inválido").max(100_000_000),
  fees: z.number().nonnegative("Taxa inválida"),
  costs: z.number().nonnegative("Custo inválido"),
  payment_method: z.string().min(1),
  status: z.enum(["paid", "pending", "canceled"]),
  notes: z.string().max(500),
});

const emptyForm = () => ({
  client_id: "",
  product: PRODUCTS[0]!,
  date: toISODate(new Date()),
  gross: "",
  fees: "",
  costs: "",
  payment_method: PAYMENT_METHODS[0] as string,
  status: "paid" as SaleStatus,
  notes: "",
});

export function SaleDialog({
  open,
  onOpenChange,
  sale,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sale?: Sale | null;
}) {
  const { clients, addSale, updateSale } = useData();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      sale
        ? {
            client_id: sale.client_id,
            product: sale.product,
            date: sale.date,
            gross: String(sale.gross),
            fees: String(sale.fees),
            costs: String(sale.costs),
            payment_method: sale.payment_method,
            status: sale.status,
            notes: sale.notes ?? "",
          }
        : { ...emptyForm(), client_id: clients[0]?.id ?? "" },
    );
  }, [open, sale, clients]);

  const gross = Number(form.gross) || 0;
  const fees = Number(form.fees) || 0;
  const costs = Number(form.costs) || 0;
  const net = gross - fees;
  const profit = net - costs;
  const margin = gross ? (profit / gross) * 100 : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      gross,
      fees,
      costs,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[String(i.path[0])] = i.message;
      setErrors(next);
      return;
    }
    if (sale) {
      updateSale(sale.id, parsed.data);
      toast.success("Venda atualizada");
    } else {
      addSale(parsed.data);
      toast.success("Venda registrada");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{sale ? "Editar venda" : "Nova venda"}</DialogTitle>
          <DialogDescription>
            Os valores líquidos, lucro e margem são calculados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select
                value={form.client_id}
                onValueChange={(v) => setForm({ ...form, client_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors["client_id"] && <p className="text-xs text-destructive">{errors["client_id"]}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product">Produto/Serviço</Label>
              <Input
                id="product"
                list="produtos"
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
              />
              <datalist id="produtos">
                {PRODUCTS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              {errors["product"] && <p className="text-xs text-destructive">{errors["product"]}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Forma de pagamento</Label>
              <Select
                value={form.payment_method}
                onValueChange={(v) => setForm({ ...form, payment_method: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gross">Valor bruto (R$)</Label>
              <Input
                id="gross"
                inputMode="decimal"
                value={form.gross}
                placeholder="0,00"
                onChange={(e) => setForm({ ...form, gross: e.target.value.replace(",", ".") })}
              />
              {errors["gross"] && <p className="text-xs text-destructive">{errors["gross"]}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fees">Taxa (R$)</Label>
              <Input
                id="fees"
                inputMode="decimal"
                value={form.fees}
                placeholder="0,00"
                onChange={(e) => setForm({ ...form, fees: e.target.value.replace(",", ".") })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="costs">Custos relacionados (R$)</Label>
              <Input
                id="costs"
                inputMode="decimal"
                value={form.costs}
                placeholder="0,00"
                onChange={(e) => setForm({ ...form, costs: e.target.value.replace(",", ".") })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as SaleStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              rows={2}
              value={form.notes}
              maxLength={500}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-muted/40 p-3 text-center">
            <Calc label="Líquido" value={formatBRL(net)} />
            <Calc label="Lucro" value={formatBRL(profit)} />
            <Calc label="Margem" value={formatPercent(margin)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{sale ? "Salvar alterações" : "Registrar venda"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Calc({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
