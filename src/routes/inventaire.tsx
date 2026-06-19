import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, Save } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { fcfa } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/inventaire")({
  head: () => ({
    meta: [
      { title: "Inventaire — Caisse+" },
      { name: "description", content: "Comptez votre stock physique et détectez les écarts avec le stock théorique." },
    ],
  }),
  component: Inventaire,
});

function Inventaire() {
  const { drinks } = useStore();
  const [counted, setCounted] = useState<Record<string, string>>({});

  const set = (id: string, v: string) => setCounted((c) => ({ ...c, [id]: v.replace(/\D/g, "") }));

  const ecarts = drinks.map((d) => {
    const c = counted[d.id];
    const diff = c === undefined || c === "" ? null : parseInt(c, 10) - d.stock;
    return { drink: d, diff };
  });
  const totalEcartValue = ecarts.reduce((s, e) => (e.diff ? s + e.diff * e.drink.cost : s), 0);
  const counts = ecarts.filter((e) => e.diff !== null).length;

  const save = () => {
    if (counts === 0) {
      toast.error("Saisis au moins un comptage.");
      return;
    }
    toast.success("Inventaire enregistré", {
      description: `${counts} référence(s) comptée(s) · écart ${fcfa(totalEcartValue)}`,
    });
    setCounted({});
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Inventaire physique</h1>
          <p className="text-xs text-muted-foreground">Compte réel vs stock théorique</p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-brand-gradient p-4 text-primary-foreground shadow-card">
          <ClipboardCheck className="h-7 w-7" />
          <div>
            <p className="text-sm font-semibold">{counts}/{drinks.length} comptées</p>
            <p className="text-xs text-primary-foreground/80">
              Écart valorisé : {fcfa(totalEcartValue)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {ecarts.map(({ drink: d, diff }) => (
            <div key={d.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{d.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground">Théorique : {d.stock}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {diff !== null && diff !== 0 && (
                  <span className={cn("text-xs font-bold tabular-nums", diff > 0 ? "text-success" : "text-destructive")}>
                    {diff > 0 ? "+" : ""}
                    {diff}
                  </span>
                )}
                <input
                  inputMode="numeric"
                  value={counted[d.id] ?? ""}
                  onChange={(e) => set(d.id, e.target.value)}
                  placeholder="—"
                  className="w-16 rounded-xl border border-border bg-background py-2 text-center text-sm font-bold tabular-nums outline-none focus:border-primary"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99]"
        >
          <Save className="h-5 w-5" /> Enregistrer l'inventaire
        </button>
      </div>
    </AppLayout>
  );
}
