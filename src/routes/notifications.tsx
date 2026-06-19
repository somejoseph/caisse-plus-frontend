import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle2, OctagonAlert } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { useStore, type NotifTone } from "@/lib/store";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Caisse+" },
      { name: "description", content: "Alertes de stock, ventes et activité de votre établissement en temps réel." },
    ],
  }),
  component: Notifications,
});

const toneStyle: Record<NotifTone, { wrap: string; icon: typeof Info }> = {
  info: { wrap: "bg-primary/10 text-primary", icon: Info },
  success: { wrap: "bg-success/10 text-success", icon: CheckCircle2 },
  warning: { wrap: "bg-secondary/15 text-secondary", icon: AlertTriangle },
  danger: { wrap: "bg-destructive/10 text-destructive", icon: OctagonAlert },
};

function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead } = useStore();

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Notifications</h1>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est à jour"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Tout lire
            </button>
          )}
        </div>

        {notifications.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Bell className="h-10 w-10 opacity-40" />
            <p className="text-sm">Aucune notification</p>
          </div>
        )}

        <div className="space-y-2">
          {notifications.map((n) => {
            const tone = toneStyle[n.tone];
            return (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left shadow-card transition-colors",
                  n.read ? "border-border bg-card" : "border-primary/30 bg-primary/5",
                )}
              >
                <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", tone.wrap)}>
                  <tone.icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">{n.title}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{n.time}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
