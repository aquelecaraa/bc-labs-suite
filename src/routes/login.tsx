import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/store/auth-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — BC Labs" },
      { name: "description", content: "Acesse a plataforma interna da BC Labs." },
      { property: "og:title", content: "Entrar — BC Labs" },
      { property: "og:description", content: "Acesse a plataforma interna da BC Labs." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "Informe um e-mail válido" }).max(255),
  password: z.string().min(6, { message: "A senha deve ter ao menos 6 caracteres" }).max(72),
});

function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const { signIn, user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && user) void navigate({ to: "/" });
  }, [ready, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await signIn(form.email, form.password);
      toast.success("Bem-vindo de volta");
      void navigate({ to: "/" });
    } catch {
      toast.error("E-mail ou senha inválidos.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid-backdrop grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary glow-ring">
            <span className="text-base font-bold tracking-tight">BC</span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gradient">BC Labs</h1>
          <p className="text-sm text-muted-foreground">Business Intelligence &amp; Automation</p>
        </div>

        <form onSubmit={submit} className="surface space-y-4 p-6">
          <Field
            id="email"
            label="E-mail"
            type="email"
            icon={<Mail className="size-4" />}
            value={form.email}
            error={errors["email"]}
            onChange={(v) => setForm({ ...form, email: v })}
            placeholder="voce@bclabs.com.br"
          />

          <Field
            id="password"
            label="Senha"
            type="password"
            icon={<Lock className="size-4" />}
            value={form.password}
            error={errors["password"]}
            onChange={(v) => setForm({ ...form, password: v })}
            placeholder="••••••••"
          />

          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Entrar na plataforma
          </Button>

          <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Acesso restrito aos sócios da BC Labs. Novas contas são criadas apenas por convite.
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  icon,
  type = "text",
  placeholder,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  type?: string | undefined;
  placeholder?: string | undefined;
  error?: string | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <Input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9"
          aria-invalid={!!error}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
