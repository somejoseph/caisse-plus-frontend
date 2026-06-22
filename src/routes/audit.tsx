import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ShieldAlert, Eye, Trash2, Pencil, DoorOpen } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { getAuditLogApi, type AuditEntry } from "@/lib/graphql/operations";
import { fmtTime } from "@/lib/graphql/adapters";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/audit")({
  component: Audit,
});

type Level = "info" | "alert" | "danger";

const levelStyle: Record<Level, string> = {
  info: "bg-primary/10 text-primary",
  alert: "bg-secondary/15 text-secondary",
  danger: "bg-destructive/10 text-destructive",
};

const LEVEL_MAP: Record<string, Level> = {
  info: "info",
  warning: "alert",
  alert: "alert",
  danger: "danger",
  error: "danger",
};

const EVENT_ICONS: Record<string, typeof Eye> = {
  delete: Trash2,
  annulation: Trash2,
  price_change: Pencil,
  modification: Pencil,
  drawer_open: DoorOpen,
  discount: Eye,
  stock_adjust: Pencil,
};

function getIcon(eventType: string) {
  for (const [key, icon] of Object.entries(EVENT_ICONS)) {
    if (eventType.toLowerCase().includes(key)) return icon;
  }
  return Eye;
}

function Audit() {
  const navigate = useNavigate();
  const { currentRole } = useStore();

  useEffect(() => {
    if (currentRole && currentRole !== "Propriétaire") void navigate({ to: "/" });
  }, [currentRole, navigate]);

  const { data: events = [] } = useQuery({
    queryKey: ["auditLog"],
    queryFn: () => getAuditLogApi(50),
  });

  const alerts = events.filter((e) => (LEVEL_MAP[e.level] ?? "info") !== "info").length;

  if (currentRole !== "Propriétaire") return null;

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

        {events.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <ShieldCheck className="h-10 w-10 opacity-40" />
            <p className="text-sm font-semibold">Aucun événement enregistré</p>
          </div>
        )}

        <div className="space-y-2">
          {events.map((e: AuditEntry) => {
            const level = LEVEL_MAP[e.level] ?? "info";
            const Icon = getIcon(e.eventType);
            return (
              <div key={e.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", levelStyle[level])}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">{e.label}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{fmtTime(e.eventTime)}</span>
                  </div>
                  {e.detail && <p className="mt-0.5 text-xs text-muted-foreground">{e.detail}</p>}
                  {e.userName && <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Par {e.userName}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
