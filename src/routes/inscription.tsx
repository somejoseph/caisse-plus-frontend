import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Lock, User, Store, MapPin, Phone, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/inscription")({
  head: () => ({
    meta: [
      { title: "Créer un compte — Caisse+" },
      { name: "description", content: "Créez votre établissement sur Caisse+ et commencez à gérer votre maquis." },
    ],
  }),
  component: Inscription,
});

function Inscription() {
  const navigate = useNavigate();
  const { login } = useStore();
  const [name, setName] = useState("");
  const [estName, setEstName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  const submit = () => {
    if (!name.trim() || !estName.trim() || pin.length < 4) {
      toast.error("Renseigne ton nom, l'établissement et un code PIN à 4 chiffres.");
      return;
    }
    login();
    toast.success("Compte créé 🎉", { description: `Bienvenue ${name.trim()} sur Caisse+` });
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-brand-gradient px-6 py-8 text-primary-foreground">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="Logo Caisse+" width={64} height={64} className="h-16 w-16 rounded-2xl shadow-float" />
          <span className="mt-3 font-display text-3xl font-extrabold">Caisse+</span>
          <p className="mt-1 text-sm text-primary-foreground/80">Crée ton espace de gestion</p>
        </div>

        <div className="rounded-3xl bg-card p-6 text-foreground shadow-float">
          <h1 className="text-lg font-bold">Inscription</h1>
          <p className="text-xs text-muted-foreground">Quelques infos pour démarrer</p>

          <LabeledInput icon={User} label="Ton nom" value={name} onChange={setName} placeholder="Ex. Awa Koné" />
          <LabeledInput icon={Store} label="Nom de l'établissement" value={estName} onChange={setEstName} placeholder="Ex. Maquis Le Repère" />
          <LabeledInput icon={MapPin} label="Ville / quartier" value={city} onChange={setCity} placeholder="Ex. Abidjan · Cocody" />
          <LabeledInput icon={Phone} label="Téléphone" value={phone} onChange={(v) => setPhone(v.replace(/[^\d+ ]/g, ""))} placeholder="+225 07 00 00 00" />

          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Code PIN (4 chiffres)</span>
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
            Créer mon compte <ArrowRight className="h-5 w-5" />
          </button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Déjà un compte ?{" "}
            <Link to="/connexion" className="font-bold text-primary">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
      <p className="pt-6 text-center text-xs text-primary-foreground/70">Caisse+ v2.1 · Sohapigroup</p>
    </div>
  );
}

function LabeledInput({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: typeof User;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="mt-3 block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent py-2.5 text-sm outline-none"
        />
      </div>
    </label>
  );
}
