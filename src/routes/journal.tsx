import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Trophy, Clock } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { fcfa, WEEK_SALES } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { SectionTitle, MethodBadge } from "./index";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal & rapports — Caisse+" },
      { name: "description", content: "Historique des ventes, top boissons rentables et performance par période." },
    ],
  }),
  component: Journal,
});

const periods = ["Jour", "Semaine", "Mois"] as const;

function Journal() {
  const [period, setPeriod] = useState<(typeof periods)[number]>("Jour");
  const { drinks, sales } = useStore();

  const topDrinks = [...drinks]
    .map((d) => ({ ...d, margin: d.price - d.cost }))
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5);
  const maxBar = Math.max(...WEEK_SALES.map((w) => w.value));

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">Journal & rapports</h1>
          <p className="text-xs text-muted-foreground">Suivi détaillé de l'activité</p>
        </div>

        {/* Period tabs */}
        <div className="flex rounded-2xl bg-muted p-1">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "flex-1 rounded-xl py-2 text-sm font-semibold transition-colors",
                period === p ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
            <p className="mt-0.5 font-display text-xl font-extrabold tabular-nums text-foreground">{fcfa(322100)}</p>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-success">
              <TrendingUp className="h-3 w-3" /> +18 %
            </span>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs text-muted-foreground">Bénéfice net</p>
            <p className="mt-0.5 font-display text-xl font-extrabold tabular-nums text-primary">{fcfa(118400)}</p>
            <span className="mt-1 inline-block text-[11px] text-muted-foreground">Marge 36,7 %</span>
          </div>
        </div>

        {/* Chart */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <SectionTitle title="Ventes par jour" />
          <div className="flex h-32 items-end justify-between gap-2">
            {WEEK_SALES.map((w, i) => (
              <div key={w.day} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">{w.value}</span>
                <div
                  className={`w-full rounded-t-lg ${i === 5 ? "bg-secondary" : "bg-primary/80"}`}
                  style={{ height: `${(w.value / maxBar) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{w.day}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Top drinks */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-secondary" />
            <SectionTitle title="Top boissons rentables" noMargin />
          </div>
          <div className="space-y-2">
            {topDrinks.map((d, i) => (
              <div key={d.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="text-xl">{d.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.size}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums text-success">+{fcfa(d.margin)}</p>
                  <p className="text-[11px] text-muted-foreground">marge / unité</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* History */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <SectionTitle title="Historique des ventes" noMargin />
          </div>
          <div className="space-y-2">
            {sales.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.id} · {s.table}</p>
                  <p className="text-xs text-muted-foreground">{s.time} · {s.server} · {s.items} articles</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums text-foreground">{fcfa(s.total)}</p>
                  <MethodBadge method={s.method} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
