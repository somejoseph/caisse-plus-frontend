import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Lock, Hash, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { loginApi } from "@/lib/graphql/operations";
import { USER_ROLE_LABEL } from "@/lib/graphql/adapters";
import type { UserRole } from "@/lib/store";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/connexion")({
  component: Connexion,
});

function Connexion() {
  const navigate = useNavigate();
  const { login, loggedIn } = useStore();
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loggedIn) navigate({ to: "/" });
  }, [loggedIn, navigate]);

  const submit = async () => {
    if (!code.trim() || pin.length < 4) {
      toast.error("Code établissement et PIN à 4 chiffres obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const payload = await loginApi(code.trim(), pin);
      const role = (USER_ROLE_LABEL[payload.user.role] ?? payload.user.role) as UserRole;
      login(payload.accessToken, { ...payload.user, role }, payload.establishment);
      toast.success(`Bienvenue, ${payload.user.name}`, { description: `Connecté en tant que ${role}` });
      navigate({ to: "/" });
    } catch {
      setError(true);
      toast.error("Code établissement ou PIN incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-brand-gradient px-6 text-primary-foreground">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={logo} alt="Logo Caisse+" width={72} height={72} className="h-18 w-18 rounded-2xl shadow-float" />
          <span className="mt-3 font-display text-4xl font-extrabold">Caisse+</span>
          <p className="mt-1 text-sm text-primary-foreground/80">La caisse intelligente du maquis</p>
        </div>

        <div className="rounded-3xl bg-card p-6 text-foreground shadow-float">
          <h1 className="text-lg font-bold">Connexion</h1>
          <p className="text-xs text-muted-foreground">Entre ton code établissement et ton PIN</p>

          <label className="mt-5 block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Code établissement</span>
            <div className={`flex items-center gap-2 rounded-xl border bg-background px-3 ${error ? "border-destructive" : "border-border"}`}>
              <Hash className="h-4 w-4 text-muted-foreground" />
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(false); }}
                inputMode="numeric"
                placeholder="Ex. 1234"
                className="w-full bg-transparent py-2.5 text-sm outline-none"
              />
            </div>
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Code PIN</span>
            <div className={`flex items-center gap-2 rounded-xl border bg-background px-3 ${error ? "border-destructive" : "border-border"}`}>
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                value={pin}
                onChange={(e) => { setPin(e.target.value.slice(0, 20)); setError(false); }}
                type="password"
                placeholder="••••"
                className="w-full bg-transparent py-2.5 text-sm tracking-[0.4em] outline-none"
              />
            </div>
          </label>

          {error && <p className="mt-2 text-xs font-semibold text-destructive">Code établissement ou PIN incorrect.</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "Connexion…" : <>Se connecter <ArrowRight className="h-5 w-5" /></>}
          </button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Nouveau ?{" "}
            <Link to="/inscription" className="font-bold text-primary">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-primary-foreground/70">Caisse+ v2.1 · Sohapigroup</p>
    </div>
  );
}
