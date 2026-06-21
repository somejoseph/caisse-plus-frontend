import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowDownLeft, ArrowUpRight, Receipt, Banknote } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { BottomSheet, Field, inputClass } from "@/components/BottomSheet";
import { cn } from "@/lib/utils";
import { fcfa } from "@/lib/mock-data";
import type { SaleEntry, Expense } from "@/lib/mock-data";
import { getSalesApi, getExpensesApi, getCurrentDaySessionApi, addExpenseApi } from "@/lib/graphql/operations";
import { SectionTitle } from "./index";

export const Route = createFileRoute("/caisse")({
  component: Caisse,
});

const tabs = ["Résumé", "Opérations", "Moyens"] as const;

function Caisse() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Résumé");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("Achats");
  const [amount, setAmount] = useState("");

  const { data: sales = [] } = useQuery({ queryKey: ["sales"], queryFn: () => getSalesApi(100) });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: () => getExpensesApi(50) });
  const { data: daySession } = useQuery({ queryKey: ["daySession"], queryFn: getCurrentDaySessionApi });
  const dayOpen = !!daySession;

  const addExpenseMut = useMutation({
    mutationFn: addExpenseApi,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const entrees = sales.filter((s: SaleEntry) => s.method !== "Crédit").reduce((a, s) => a + s.total, 0);
  const sorties = expenses.reduce((a: number, e: Expense) => a + e.amount, 0);
  const solde = entrees - sorties;

  const submitExpense = async () => {
    if (!label.trim() || !amount) {
      toast.error("Libellé et montant sont obligatoires.");
      return;
    }
    try {
      await addExpenseMut.mutateAsync({ label: label.trim(), category, amount: parseInt(amount, 10) });
      toast.success("Dépense enregistrée");
      setLabel("");
      setAmount("");
      setCategory("Achats");
      setSheetOpen(false);
    } catch {
      toast.error("Impossible d'enregistrer la dépense.");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">Caisse du jour</h1>
          <p className="text-xs capitalize text-muted-foreground">
            {daySession?.date ?? new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            {" · "}
            {dayOpen ? `Ouverte à ${daySession?.openedAt}` : "Journée fermée"}
          </p>
        </div>

        {!dayOpen && (
          <div className="flex items-center gap-2 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-xs font-semibold text-accent">
            <Receipt className="h-4 w-4 shrink-0" />
            Journée fermée — retournez à l'accueil pour ouvrir la caisse.
          </div>
        )}

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

        <div className="flex rounded-2xl bg-muted p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn("flex-1 rounded-xl py-2 text-sm font-semibold transition-colors", tab === t ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}
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
                <span className="text-muted-foreground">Solde théorique</span>
                <span className="font-bold tabular-nums">{fcfa(solde)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ventes cash</span>
                <span className="font-bold tabular-nums">{fcfa(entrees)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dépenses</span>
                <span className="font-bold tabular-nums text-destructive">- {fcfa(sorties)}</span>
              </div>
            </div>
            <PayBreakdown sales={sales} />
          </section>
        )}

        {tab === "Moyens" && <PayBreakdown sales={sales} />}

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
              {expenses.map((e: Expense) => (
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
              {expenses.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">Aucune dépense enregistrée.</p>
              )}
            </div>
          </section>
        )}
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Enregistrer une dépense" subtitle="Sortie de caisse du jour">
        <div className="space-y-3">
          <Field label="Libellé">
            <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} placeholder="Ex. Glace (sac x4)" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                {["Achats", "Transport", "Salaires", "Charges", "Divers"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Montant (F)">
              <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="0" />
            </Field>
          </div>
          <button
            onClick={submitExpense}
            disabled={addExpenseMut.isPending}
            className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99] disabled:opacity-60"
          >
            {addExpenseMut.isPending ? "Enregistrement…" : "Enregistrer la dépense"}
          </button>
        </div>
      </BottomSheet>
    </AppLayout>
  );
}

const PAY_COLORS: Record<string, string> = {
  Espèces: "var(--color-primary)",
  "Mobile Money": "var(--color-secondary)",
  Crédit: "var(--color-accent)",
};

function PayBreakdown({ sales }: { sales: SaleEntry[] }) {
  const methods = ["Espèces", "Mobile Money", "Crédit"] as const;
  const breakdown = methods.map((m) => ({
    method: m,
    amount: sales.filter((s) => s.method === m).reduce((a, s) => a + s.total, 0),
  }));
  const total = breakdown.reduce((s, p) => s + p.amount, 0);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <Banknote className="h-5 w-5 text-primary" />
        <SectionTitle title="Par moyen de paiement" noMargin />
      </div>
      <div className="space-y-3">
        {breakdown.map((p) => {
          const pct = total ? Math.round((p.amount / total) * 100) : 0;
          return (
            <div key={p.method}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{p.method}</span>
                <span className="font-bold tabular-nums">{fcfa(p.amount)}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PAY_COLORS[p.method] }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
