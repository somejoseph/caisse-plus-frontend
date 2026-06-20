import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Lock, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { ESTABLISHMENT } from "@/lib/mock-data";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion — Caisse+" },
      { name: "description", content: "Connectez-vous à votre espace Caisse+ pour gérer votre maquis." },
    ],
  }),
  component: Connexion,
});

function Connexion() {
  const navigate = useNavigate();
  const { login, establishment } = useStore();
  const [code, setCode] = useState(ESTABLISHMENT.code);
  const [pin, setPin] = useState("");

  const submit = () => {
    if (!code.trim() || pin.length < 4) {
      toast.error("Saisis le code établissement et un code PIN à 4 chiffres.");
      return;
    }
    login();
    toast.success("Connexion réussie", { description: `Bienvenue sur ${establishment.name}` });
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-brand-gradient px-6 text-primary-foreground">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-8 text-center">
          <span className="font-display text-4xl font-extrabold">Caisse+</span>
          <p className="mt-1 text-sm text-primary-foreground/80">La caisse intelligente du maquis</p>
        </div>

        <div className="rounded-3xl bg-card p-6 text-foreground shadow-float">
          <h1 className="text-lg font-bold">Connexion</h1>
          <p className="text-xs text-muted-foreground">Accède à ton espace de gestion</p>

          <label className="mt-5 block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Code établissement</span>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="9731"
                className="w-full bg-transparent py-2.5 text-sm outline-none"
              />
            </div>
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Code PIN</span>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                type="password"
                placeholder="••••"
                className="w-full bg-transparent py-2.5 text-sm tracking-[0.4em] outline-none"
              />
            </div>
          </label>

          <button
            onClick={submit}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99]"
          >
            Se connecter <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-primary-foreground/70">Caisse+ v2.1 · Sohapigroup</p>
    </div>
  );
}
