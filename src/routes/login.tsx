import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Mail, ShieldCheck, User } from "lucide-react";
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
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().email({ message: "Informe um e-mail válido" }).max(255),
  password: z.string().min(6, { message: "A senha deve ter ao menos 6 caracteres" }).max(72),
});

function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const { signIn, signUp, user, ready } = useAuth();
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
    if (mode === "signup" && form.name.trim().length < 2) {
      setErrors({ name: "Informe seu nome" });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (mode === "signin") await signIn(form.email, form.password);
      else await signUp(form.name.trim(), form.email, form.password);
      toast.success(mode === "signin" ? "Bem-vindo de volta" : "Conta criada com sucesso");
      void navigate({ to: "/" });
    } catch {
      toast.error("Não foi possível autenticar. Tente novamente.");
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
          <div className="flex rounded-lg bg-muted p-1 text-sm">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${
                  mode === m ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "signin" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <Field
              id="name"
              label="Nome"
              icon={<User className="size-4" />}
              value={form.name}
              error={errors["name"]}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Seu nome"
            />
          )}

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
            {mode === "signin" ? "Entrar na plataforma" : "Criar minha conta"}
          </Button>

          <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Sessão local de demonstração. Nenhum backend está conectado ainda — ao ativar o banco de
            dados, esta tela passa a usar autenticação real com proteção de rotas e RLS.
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
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">{icon}</span>
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
