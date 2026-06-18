import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Phone, Plus, Users } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { fcfa, SERVERS, TABLES } from "@/lib/mock-data";

export const Route = createFileRoute("/serveurs")({
  head: () => ({
    meta: [
      { title: "Serveurs & tables — Caisse+" },
      { name: "description", content: "Gestion des serveurs et plan de salle visuel avec statut des tables." },
    ],
  }),
  component: Serveurs,
});

const tabs = ["Plan de salle", "Serveurs"] as const;

const statusStyle: Record<string, string> = {
  Libre: "border-success/40 bg-success/10 text-success",
  Occupée: "border-primary/40 bg-primary/10 text-primary",
  Addition: "border-secondary/50 bg-secondary/15 text-secondary",
};

function Serveurs() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Plan de salle");

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Serveurs & tables</h1>
          <p className="text-xs text-muted-foreground">Plan de salle et équipe en poste</p>
        </div>

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

        {tab === "Plan de salle" && (
          <>
            <div className="flex flex-wrap gap-3 text-xs">
              {Object.keys(statusStyle).map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={cn("h-3 w-3 rounded-full border", statusStyle[s])} /> {s}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TABLES.map((t) => (
                <div
                  key={t.id}
                  className={cn("flex flex-col items-center justify-center rounded-2xl border-2 py-6 shadow-card", statusStyle[t.status])}
                >
                  <Users className="mb-1 h-5 w-5 opacity-70" />
                  <p className="font-display text-base font-extrabold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.seats} places</p>
                  <span className="mt-1 text-[11px] font-bold">{t.status}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "Serveurs" && (
          <>
            <button className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-card py-3 text-sm font-bold text-primary">
              <Plus className="h-4 w-4" /> Ajouter un serveur
            </button>
            <div className="space-y-2">
              {SERVERS.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-primary-foreground">
                      {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{s.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {s.phone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {s.active ? (
                      <>
                        <p className="text-sm font-bold tabular-nums text-foreground">{fcfa(s.sales)}</p>
                        <p className="text-[11px] text-muted-foreground">{s.orders} commandes</p>
                      </>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-bold text-muted-foreground">Inactif</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
