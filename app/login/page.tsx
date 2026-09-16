"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, code: code || undefined }),
      });
      const data = (await res.json()) as { error?: string; mfaRequired?: boolean };
      if (!res.ok) {
        // Le compte a la double authentification : on révèle le champ code.
        if (data.mfaRequired) setMfaRequired(true);
        setError(data.error || "Connexion refusée.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-line bg-accent font-mono text-lg font-black text-accent-ink shadow-brutal">
            ▦
          </span>
          <div>
            <h1 className="text-xl font-black tracking-tight">LifeOS</h1>
            <p className="text-xs text-muted">Personal Life OS &amp; Routine Hub</p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="flex flex-col gap-3 rounded-xl border-2 border-line bg-card p-5 shadow-brutal"
        >
          <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            Identifiant Home Assistant
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              className="rounded-lg border border-line-soft bg-card-2 px-3 py-2 text-sm text-foreground outline-none focus:border-line"
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="rounded-lg border border-line-soft bg-card-2 px-3 py-2 text-sm text-foreground outline-none focus:border-line"
            />
          </label>

          {mfaRequired && (
            <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              Code de validation (double authentification)
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                maxLength={8}
                autoFocus
                className="rounded-lg border border-line-soft bg-card-2 px-3 py-2 font-mono text-sm tracking-widest text-foreground outline-none focus:border-line"
              />
            </label>
          )}

          {error && (
            <p className="rounded-lg border-2 border-danger/50 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg border-2 border-line bg-accent py-2 text-sm font-bold text-accent-ink shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
          Authentification déléguée à ton instance Home Assistant.
          <br />
          Chaque tentative est consignée dans le journal de sécurité.
        </p>
      </div>
    </div>
  );
}
