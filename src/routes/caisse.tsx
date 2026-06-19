import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, ArrowDownLeft, ArrowUpRight, Receipt, Banknote } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { BottomSheet, Field, inputClass } from "@/components/BottomSheet";
import { cn } from "@/lib/utils";
import { fcfa, PAYMENT_BREAKDOWN } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { SectionTitle } from "./index";

export const Route = createFileRoute("/caisse")({
  head: () => ({
    meta: [
      { title: "Caisse — Caisse+" },
      { name: "description", content: "Suivi de la caisse : entrées, sorties, dépenses et solde par moyen de paiement." },
    ],
  }),
  component: Caisse,
});

const tabs = ["Résumé", "Opérations", "Moyens"] as const;

function Caisse() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Résumé");
  const { expenses, addExpense } = useStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("Achats");
  const [amount, setAmount] = useState("");

  const entrees = PAYMENT_BREAKDOWN.reduce((s, p) => s + p.amount, 0);
  const sorties = expenses.reduce((s, e) => s + e.amount, 0);
  const solde = entrees - sorties;

  const submitExpense = () => {
    if (!label.trim() || !amount) {
      toast.error("Libellé et montant sont obligatoires.");
      return;
    }
    addExpense({ label: label.trim(), category, amount: parseInt(amount, 10) });
    toast.success("Dépense enregistrée");
    setLabel("");
    setAmount("");
    setCategory("Achats");
    setSheetOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">Caisse du jour</h1>
          <p className="text-xs text-muted-foreground">Mardi 18 juin · Journée ouverte</p>
        </div>

        {/* Solde card */}
        <div className="rounded-3xl bg-brand-gradient p-5 text-primary-foreground shadow-elevated">
          <p className="text-sm text-primary-foreground/80">Solde de caisse théorique</p>
          <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{fcfa(solde)}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <ArrowDownLeft className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] text-primary-foreground/70">Entrées</p>
                <p className="font-bold tabular-nums">{fcfa(entrees)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <ArrowUpRight className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] text-primary-foreground/70">Sorties</p>
                <p className="font-bold tabular-nums">{fcfa(sorties)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl bg-muted p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-xl py-2 text-sm font-semibold transition-colors",
                tab === t ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Résumé" && (
          <section className="space-y-3">
            <div className="rounded-2xl border border-success/30 bg-success/10 p-4">
              <p className="text-sm font-semibold text-foreground">Réconciliation</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Théorique</span>
                <span className="font-bold tabular-nums">{fcfa(solde)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Compté</span>
                <span className="font-bold tabular-nums">{fcfa(solde)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-success/20 pt-2 text-sm">
                <span className="font-semibold text-success">Écart</span>
                <span className="font-bold text-success">0 F</span>
              </div>
            </div>
            <PayBreakdown />
          </section>
        )}

        {tab === "Moyens" && <PayBreakdown />}

        {tab === "Opérations" && (
          <section>
            <div className="flex items-center justify-between">
              <SectionTitle title="Dépenses du jour" noMargin />
              <button
                onClick={() => setSheetOpen(true)}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <Receipt className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{e.label}</p>
                      <p className="text-xs text-muted-foreground">{e.category} · {e.time}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-destructive">- {fcfa(e.amount)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Enregistrer une dépense"
        subtitle="Sortie de caisse du jour"
      >
        <div className="space-y-3">
          <Field label="Libellé">
            <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} placeholder="Ex. Glace (sac x4)" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                {["Achats", "Transport", "Salaires", "Charges", "Divers"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Montant (F)">
              <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="0" />
            </Field>
          </div>
          <button
            onClick={submitExpense}
            className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99]"
          >
            Enregistrer la dépense
          </button>
        </div>
      </BottomSheet>
    </AppLayout>
  );
}

function PayBreakdown() {
  const total = PAYMENT_BREAKDOWN.reduce((s, p) => s + p.amount, 0);
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <Banknote className="h-5 w-5 text-primary" />
        <SectionTitle title="Par moyen de paiement" noMargin />
      </div>
      <div className="space-y-3">
        {PAYMENT_BREAKDOWN.map((p) => {
          const pct = Math.round((p.amount / total) * 100);
          return (
            <div key={p.method}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{p.method}</span>
                <span className="font-bold tabular-nums">{fcfa(p.amount)}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
