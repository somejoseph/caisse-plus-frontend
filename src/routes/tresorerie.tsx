import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { fcfa } from "@/lib/mock-data";
import { AppLayout } from "@/components/AppLayout";
import { useStore } from "@/lib/store";
import { getReportSalesApi, getReportExpensesApi } from "@/lib/graphql/operations";

export const Route = createFileRoute("/tresorerie")({
  component: Tresorerie,
});

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function Tresorerie() {
  const navigate = useNavigate();
  const { currentRole } = useStore();

  useEffect(() => {
    if (currentRole && currentRole !== "Propriétaire") void navigate({ to: "/" });
  }, [currentRole, navigate]);

  const salesQ = useQuery({
    queryKey: ["tresorerie-sales"],
    queryFn: () => getReportSalesApi({ limit: 10000 }),
  });
  const expensesQ = useQuery({
    queryKey: ["tresorerie-expenses"],
    queryFn: () => getReportExpensesApi({ limit: 10000 }),
  });

  if (currentRole && currentRole !== "Propriétaire") return null;

  const isLoading = salesQ.isLoading || expensesQ.isLoading;
  const sales = salesQ.data ?? [];
  const expenses = expensesQ.data ?? [];

  // Regrouper par date
  const dateMap = new Map<string, { entrees: number; sorties: number }>();

  for (const s of sales) {
    if (s.method === "Crédit") continue; // le crédit n'est pas encaissé
    const entry = dateMap.get(s.date) ?? { entrees: 0, sorties: 0 };
    entry.entrees += s.total;
    dateMap.set(s.date, entry);
  }
  for (const e of expenses) {
    const entry = dateMap.get(e.date) ?? { entrees: 0, sorties: 0 };
    entry.sorties += e.amount;
    dateMap.set(e.date, entry);
  }

  // Trier par date ascendante pour calculer le cumulatif
  const rows = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { entrees, sorties }]) => ({ date, entrees, sorties, net: entrees - sorties }));

  // Calcul du solde cumulatif
  let running = 0;
  const rowsWithCumul = rows.map((r) => {
    running += r.net;
    return { ...r, cumul: running };
  });

  // Afficher du plus récent au plus ancien
  const displayRows = [...rowsWithCumul].reverse();
  const totalCumul = running;

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Trésorerie</h1>
          <p className="text-xs text-muted-foreground">Solde cumulatif jour par jour</p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </div>
        )}

        {!isLoading && (
          <>
            <div className="rounded-3xl bg-brand-gradient p-5 text-primary-foreground shadow-elevated">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                  <Landmark className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-primary-foreground/80">Solde cumulatif total</p>
                  <p className="font-display text-3xl font-extrabold tabular-nums">{fcfa(totalCumul)}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/15 pt-4 text-center text-[11px]">
                <div>
                  <p className="text-primary-foreground/70">Jours</p>
                  <p className="font-bold">{rows.length}</p>
                </div>
                <div>
                  <p className="text-primary-foreground/70">Total entrées</p>
                  <p className="font-bold tabular-nums">{fcfa(rows.reduce((s, r) => s + r.entrees, 0))}</p>
                </div>
                <div>
                  <p className="text-primary-foreground/70">Total sorties</p>
                  <p className="font-bold tabular-nums">{fcfa(rows.reduce((s, r) => s + r.sorties, 0))}</p>
                </div>
              </div>
            </div>

            {displayRows.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée disponible.</p>
            )}

            <div className="space-y-2">
              {displayRows.map((r, i) => (
                <div key={r.date} className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-bold capitalize text-foreground">{fmtDay(r.date)}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 text-success">
                          <ArrowDownLeft className="h-3 w-3" />
                          {fcfa(r.entrees)}
                        </span>
                        <span className="flex items-center gap-1 text-destructive">
                          <ArrowUpRight className="h-3 w-3" />
                          {fcfa(r.sorties)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-display text-lg font-extrabold tabular-nums",
                        r.net >= 0 ? "text-success" : "text-destructive",
                      )}>
                        {r.net >= 0 ? "+" : ""}{fcfa(r.net)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Solde&nbsp;
                        <span className={cn(
                          "font-bold",
                          r.cumul >= 0 ? "text-foreground" : "text-destructive",
                        )}>
                          {fcfa(r.cumul)}
                        </span>
                      </p>
                    </div>
                  </div>
                  {/* Barre de progression visuelle pour le net du jour */}
                  {i === 0 && (
                    <div className={cn(
                      "h-0.5 w-full",
                      r.net >= 0 ? "bg-success/40" : "bg-destructive/40",
                    )} />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
