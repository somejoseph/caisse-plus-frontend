import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, ShieldAlert, Eye, Trash2, Pencil, DoorOpen } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Anti-fraude & audit — Caisse+" },
      { name: "description", content: "Journal d'audit : suppressions, modifications de prix et événements sensibles surveillés." },
    ],
  }),
  component: Audit,
});

type Level = "info" | "alert" | "danger";

const events: { id: string; icon: typeof Eye; label: string; detail: string; user: string; time: string; level: Level }[] = [
  { id: "a1", icon: Trash2, label: "Vente annulée", detail: "Commande #1036 (12 500 F) supprimée", user: "Yao", time: "21:18", level: "danger" },
  { id: "a2", icon: Pencil, label: "Prix modifié", detail: "Heineken 33cl : 1 500 → 1 300 F", user: "Awa", time: "20:42", level: "alert" },
  { id: "a3", icon: DoorOpen, label: "Tiroir-caisse ouvert", detail: "Ouverture sans vente associée", user: "Fatou", time: "20:05", level: "alert" },
  { id: "a4", icon: Eye, label: "Remise appliquée", detail: "Table 2 : -10% (motif : habitué)", user: "Awa", time: "19:31", level: "info" },
  { id: "a5", icon: Pencil, label: "Stock ajusté", detail: "Castel : +6 (correction inventaire)", user: "Awa", time: "18:50", level: "info" },
];

const levelStyle: Record<Level, string> = {
  info: "bg-primary/10 text-primary",
  alert: "bg-secondary/15 text-secondary",
  danger: "bg-destructive/10 text-destructive",
};

function Audit() {
  const alerts = events.filter((e) => e.level !== "info").length;

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Anti-fraude & audit</h1>
          <p className="text-xs text-muted-foreground">Toutes les actions sensibles sont tracées</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
            <ShieldCheck className="h-7 w-7 text-success" />
            <div>
              <p className="font-display text-xl font-extrabold text-success">{events.length}</p>
              <p className="text-[11px] text-muted-foreground">Événements tracés</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-secondary/30 bg-secondary/10 p-4">
            <ShieldAlert className="h-7 w-7 text-secondary" />
            <div>
              <p className="font-display text-xl font-extrabold text-secondary">{alerts}</p>
              <p className="text-[11px] text-muted-foreground">À surveiller</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
              <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", levelStyle[e.level])}>
                <e.icon className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">{e.label}</p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{e.time}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{e.detail}</p>
                <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Par {e.user}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
