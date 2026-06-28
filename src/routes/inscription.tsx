import { useState, useRef, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Lock, User, Store, MapPin, Phone, ArrowRight, ArrowLeft, ImageIcon, X, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { registerApi } from "@/lib/graphql/operations";
import { USER_ROLE_LABEL } from "@/lib/graphql/adapters";
import { uploadImage } from "@/lib/upload";
import type { UserRole } from "@/lib/store";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/inscription")({
  component: Inscription,
});

const TOTAL_STEPS = 2;

function Inscription() {
  const navigate = useNavigate();
  const { login, loggedIn } = useStore();

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [estName, setEstName] = useState("");
  const [city, setCity] = useState("");
  const [pin, setPin] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");

  // UI state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loggedIn && !successCode) navigate({ to: "/" });
  }, [loggedIn, successCode, navigate]);

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const copyCode = () => {
    if (successCode) {
      navigator.clipboard.writeText(successCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const goNext = () => {
    if (!name.trim() || !phone.trim() || pin.length < 4) {
      toast.error("Nom, téléphone et mot de passe (4+ caractères) sont obligatoires.");
      return;
    }
    setStep(2);
  };

  const submit = async () => {
    if (!estName.trim()) {
      toast.error("Le nom de l'établissement est obligatoire.");
      return;
    }
    setLoading(true);
    try {
      let logoUrl: string | undefined;
      if (logoFile) {
        try {
          logoUrl = await uploadImage(logoFile, "logos");
        } catch {
          toast.error("Impossible d'uploader le logo — inscription sans logo.");
        }
      }
      const payload = await registerApi({
        ownerName: name.trim(),
        phone: phone.trim(),
        establishmentName: estName.trim(),
        city: city.trim() || undefined,
        pin,
        logoUrl,
      });
      const role = (USER_ROLE_LABEL[payload.user.role] ?? "Propriétaire") as UserRole;
      login(payload.accessToken, { ...payload.user, role }, payload.establishment);
      setSuccessCode(payload.establishment.code);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création du compte.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Écran de succès ──────────────────────────────────────────────────────────
  if (successCode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-gradient px-6 py-8 text-primary-foreground">
        <div className="w-full max-w-sm rounded-3xl bg-card p-8 text-foreground shadow-float">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h1 className="mt-4 text-xl font-extrabold">Compte créé avec succès&nbsp;!</h1>
            <p className="mt-1 text-sm text-muted-foreground">Bienvenue, {name.trim()}</p>

            <div className="mt-6 w-full rounded-2xl border-2 border-primary/20 bg-primary/5 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Code de votre établissement
              </p>
              <p className="mt-2 font-display text-6xl font-extrabold tracking-[0.4em] text-primary">
                {successCode}
              </p>
              <button
                type="button"
                onClick={copyCode}
                className="mx-auto mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copié !" : "Copier le code"}
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Ce code identifie{" "}
              <span className="font-bold text-foreground">{estName.trim()}</span> dans
              l'application. Vous en aurez besoin à chaque connexion.{" "}
              <span className="font-semibold text-destructive">Conservez-le précieusement.</span>
            </p>

            <button
              onClick={() => navigate({ to: "/" })}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99]"
            >
              J'ai noté mon code <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        <p className="pt-6 text-center text-xs text-primary-foreground/70">Caisse+ v2.1 · JS-DEV · tout droits reservés</p>
      </div>
    );
  }

  // ── Formulaire multi-étapes ──────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-brand-gradient px-6 py-8 text-primary-foreground">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="Logo Caisse+" width={64} height={64} className="h-16 w-16 rounded-2xl shadow-float" />
          <span className="mt-3 font-display text-3xl font-extrabold">Caisse+</span>
          <p className="mt-1 text-sm text-primary-foreground/80">Crée ton espace de gestion</p>
        </div>

        <div className="rounded-3xl bg-card p-6 text-foreground shadow-float">
          {/* Titre + progression */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <h1 className="text-lg font-bold">
                {step === 1 ? "Ton profil" : "Ton établissement"}
              </h1>
              <span className="text-xs font-semibold text-muted-foreground">
                {step} / {TOTAL_STEPS}
              </span>
            </div>
            {/* Barre de progression */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {step === 1
                ? "Tes informations personnelles et ton mot de passe"
                : "Les infos de ton commerce"}
            </p>
          </div>

          {/* ── Étape 1 : profil + credentials ── */}
          {step === 1 && (
            <>
              <LabeledInput
                icon={User}
                label="Ton nom"
                value={name}
                onChange={setName}
                placeholder="Ex. Awa Koné"
              />
              <LabeledInput
                icon={Phone}
                label="Téléphone"
                value={phone}
                onChange={setPhone}
                placeholder="+225 07 00 00 00"
                inputMode="tel"
              />
              <label className="mt-3 block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Mot de passe (4–20 caractères)
                </span>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={pin}
                    onChange={(e) => setPin(e.target.value.slice(0, 20))}
                    type="password"
                    placeholder="••••"
                    className="w-full bg-transparent py-2.5 text-sm tracking-[0.4em] outline-none"
                  />
                </div>
              </label>

              <button
                type="button"
                onClick={goNext}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99]"
              >
                Suivant <ArrowRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* ── Étape 2 : établissement ── */}
          {step === 2 && (
            <>
              {/* Logo optionnel */}
              <div className="mb-1">
                <span className="mb-2 block text-xs font-semibold text-muted-foreground">
                  Logo de l'établissement (optionnel)
                </span>
                <div className="flex items-center gap-3">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/50">
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setLogoFile(null); setLogoPreview(""); }}
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-card active:scale-95"
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> Choisir un logo
                  </button>
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
              </div>

              <LabeledInput
                icon={Store}
                label="Nom de l'établissement"
                value={estName}
                onChange={setEstName}
                placeholder="Ex. Maquis Le Repère"
              />
              <p className="mt-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                Un code à 4 chiffres sera généré pour votre établissement — il servira à vous connecter.
              </p>
              <LabeledInput
                icon={MapPin}
                label="Ville / quartier (optionnel)"
                value={city}
                onChange={setCity}
                placeholder="Ex. Abidjan · Cocody"
              />

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-4 py-3.5 text-sm font-semibold text-foreground shadow-card active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4" /> Retour
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99] disabled:opacity-60"
                >
                  {loading ? "Création…" : <>Créer mon compte <ArrowRight className="h-5 w-5" /></>}
                </button>
              </div>
            </>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Déjà un compte ?{" "}
            <Link to="/connexion" className="font-bold text-primary">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
      <p className="pt-6 text-center text-xs text-primary-foreground/70">Caisse+ v2.1 · JS-DEV · tout droits reservés</p>
    </div>
  );
}

function LabeledInput({
  icon: Icon, label, value, onChange, placeholder, inputMode,
}: {
  icon: typeof User; label: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
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
          inputMode={inputMode}
          className="w-full bg-transparent py-2.5 text-sm outline-none"
        />
      </div>
    </label>
  );
}
