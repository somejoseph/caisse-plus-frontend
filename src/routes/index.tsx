import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, AlertTriangle, Wallet, ShoppingBag, PlusCircle, PackageSearch, Receipt, QrCode, Power, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { BottomSheet, Field, inputClass } from "@/components/BottomSheet";
import { cn } from "@/lib/utils";
import { fcfa, WEEK_SALES, type SaleEntry } from "@/lib/mock-data";
import {
  getDrinksApi, getSalesApi, getCurrentDaySessionApi,
  getServersApi, openDaySessionApi, closeDaySessionApi,
} from "@/lib/graphql/operations";
import { METHOD_LABEL } from "@/lib/graphql/adapters";

export const Route = createFileRoute("/")({
  component: Home,
});

const quickActions = [
  { label: "Nouvelle vente", icon: PlusCircle, to: "/ventes", tone: "primary" },
  { label: "Voir le stock", icon: PackageSearch, to: "/stock", tone: "soft" },
  { label: "Dépense caisse", icon: Receipt, to: "/caisse", tone: "soft" },
  { label: "QR menu", icon: QrCode, to: "/qr-menu", tone: "soft" },
];

function Home() {
  const qc = useQueryClient();
  const [openSheetVisible, setOpenSheetVisible] = useState(false);
  const [closeSheetVisible, setCloseSheetVisible] = useState(false);

  const { data: drinks = [] } = useQuery({ queryKey: ["drinks"], queryFn: () => getDrinksApi() });
  const { data: sales = [] } = useQuery({ queryKey: ["sales"], queryFn: () => getSalesApi(50) });
  const { data: daySession } = useQuery({ queryKey: ["daySession"], queryFn: getCurrentDaySessionApi });

  const dayOpen = !!daySession;
  const outOfStock = drinks.filter((d) => d.stock === 0).length;
  const lowStock = drinks.filter((d) => d.stock > 0 && d.stock <= d.threshold).length;
  const maxBar = Math.max(...WEEK_SALES.map((w) => w.value));
  const totalCA = sales.reduce((s, v) => s + v.total, 0);

  return (
    <AppLayout>
      <div className="space-y-5">
        {dayOpen ? (
          <div className="flex items-center justify-between rounded-2xl border border-success/30 bg-success/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Journée en cours</p>
                <p className="text-xs text-muted-foreground">
                  Ouverte à {daySession?.openedAt} · {daySession?.openedBy}
                </p>
              </div>
            </div>
            <button onClick={() => setCloseSheetVisible(true)} className="flex items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-bold text-destructive active:scale-95">
              <Power className="h-3.5 w-3.5" /> Clôturer
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Journée fermée</p>
                <p className="text-xs text-muted-foreground">Ouvrez la caisse pour commencer</p>
              </div>
            </div>
            <button onClick={() => setOpenSheetVisible(true)} className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground active:scale-95">
              <Power className="h-3.5 w-3.5" /> Ouvrir
            </button>
          </div>
        )}

        {/* Hero CA */}
        <div className="overflow-hidden rounded-3xl bg-brand-gradient p-5 text-primary-foreground shadow-elevated">
          <p className="text-sm font-medium text-primary-foreground/80">Chiffre d'affaires du jour</p>
          <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{fcfa(totalCA)}</p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
            <TrendingUp className="h-3.5 w-3.5" /> Aujourd'hui
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/15 pt-4">
            <MiniStat label="Ventes" value={String(sales.length)} />
            <MiniStat label="Panier moy." value={fcfa(sales.length ? totalCA / sales.length : 0)} />
            <MiniStat label="Crédit" value={fcfa(sales.filter((s) => s.method === "Crédit").reduce((a, s) => a + s.total, 0))} />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Wallet} label="Solde caisse" value={fcfa(sales.filter((s) => s.method !== "Crédit").reduce((a, s) => a + s.total, 0))} hint="Espèces + Mobile" tone="primary" />
          <StatCard icon={ShoppingBag} label="Panier moyen" value={fcfa(sales.length ? totalCA / sales.length : 0)} hint={`${sales.length} ventes`} tone="amber" />
        </div>

        {(outOfStock > 0 || lowStock > 0) && (
          <Link to="/stock" className="flex items-center justify-between rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{outOfStock} en rupture · {lowStock} sous le seuil</p>
                <p className="text-xs text-muted-foreground">Réapprovisionnement conseillé</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-accent" />
          </Link>
        )}

        <section>
          <SectionTitle title="Actions rapides" />
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <Link key={a.label} to={a.to} className={a.tone === "primary"
                ? "flex items-center gap-3 rounded-2xl bg-brand-gradient px-4 py-4 text-primary-foreground shadow-card active:scale-[0.98]"
                : "flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-foreground shadow-card active:scale-[0.98]"}>
                <a.icon className={a.tone === "primary" ? "h-6 w-6" : "h-6 w-6 text-primary"} />
                <span className="text-sm font-semibold leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle title="Évolution 7 jours" noMargin />
            <span className="text-xs font-semibold text-success">+12 %</span>
          </div>
          <div className="flex h-32 items-end justify-between gap-2">
            {WEEK_SALES.map((w, i) => (
              <div key={w.day} className="flex flex-1 flex-col items-center gap-1.5">
                <div className={`w-full rounded-t-lg ${i === WEEK_SALES.length - 1 ? "bg-secondary" : "bg-primary/80"}`} style={{ height: `${(w.value / maxBar) * 100}%` }} />
                <span className="text-[10px] font-medium text-muted-foreground">{w.day}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <SectionTitle title="Dernières ventes" noMargin />
            <Link to="/journal" className="text-xs font-semibold text-primary">Tout voir</Link>
          </div>
          <div className="mt-3 space-y-2">
            {sales.slice(0, 4).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{s.time.slice(0, 5)}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.id} · {s.table}</p>
                    <p className="text-xs text-muted-foreground">{s.items} articles · {s.server}</p>
                  </div>
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

      <OpenDaySheet open={openSheetVisible} onClose={() => setOpenSheetVisible(false)} onOpened={() => { void qc.invalidateQueries({ queryKey: ["daySession"] }); }} />
      <CloseDaySheet open={closeSheetVisible} onClose={() => setCloseSheetVisible(false)} sales={sales} onClosed={() => { void qc.invalidateQueries({ queryKey: ["daySession"] }); }} />
    </AppLayout>
  );
}

function OpenDaySheet({ open, onClose, onOpened }: { open: boolean; onClose: () => void; onOpened: () => void }) {
  const { data: servers = [] } = useQuery({ queryKey: ["servers"], queryFn: getServersApi });
  const [selectedServer, setSelectedServer] = useState("");
  const [loading, setLoading] = useState(false);
  const activeServers = servers.filter((s) => s.active);

  const submit = async () => {
    if (!selectedServer) { toast.error("Sélectionnez un responsable."); return; }
    setLoading(true);
    try {
      const server = activeServers.find((s) => s.id === selectedServer);
      await openDaySessionApi({ serverId: selectedServer, serverName: server?.name.split(" ")[0] });
      toast.success(`Journée ouverte par ${server?.name.split(" ")[0] ?? ""}`);
      onOpened();
      onClose();
    } catch { toast.error("Impossible d'ouvrir la journée."); }
    finally { setLoading(false); }
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <BottomSheet open={open} onClose={onClose} title="Ouvrir la journée" subtitle="Démarrer une nouvelle journée de caisse">
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Date</span><span className="font-semibold capitalize text-foreground">{dateStr}</span></div>
          <div className="mt-1 flex justify-between text-sm"><span className="text-muted-foreground">Heure d'ouverture</span><span className="font-bold text-foreground">{timeStr}</span></div>
        </div>
        <Field label="Responsable de l'ouverture">
          <select value={selectedServer} onChange={(e) => setSelectedServer(e.target.value)} className={inputClass}>
            <option value="">— Sélectionner —</option>
            {activeServers.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.role}</option>)}
          </select>
        </Field>
        <button onClick={submit} disabled={loading} className="w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99] disabled:opacity-60">
          {loading ? "Ouverture…" : "Ouvrir la journée"}
        </button>
      </div>
    </BottomSheet>
  );
}

function CloseDaySheet({ open, onClose, sales, onClosed }: { open: boolean; onClose: () => void; sales: SaleEntry[]; onClosed: () => void }) {
  const [counted, setCounted] = useState("");
  const [loading, setLoading] = useState(false);

  const totalCA = sales.reduce((s, v) => s + v.total, 0);
  const cashRevenue = sales.filter((v) => v.method !== "Crédit").reduce((s, v) => s + v.total, 0);
  const countedNum = parseInt(counted || "0", 10);
  const ecart = countedNum - cashRevenue;

  const submit = async () => {
    setLoading(true);
    try {
      await closeDaySessionApi({ countedAmount: countedNum || undefined });
      toast.success("Journée clôturée avec succès");
      onClosed();
      setCounted("");
      onClose();
    } catch { toast.error("Impossible de clôturer la journée."); }
    finally { setLoading(false); }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Clôturer la journée" subtitle="Récapitulatif et fermeture de caisse">
      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Chiffre d'affaires</span><span className="font-bold tabular-nums text-foreground">{fcfa(totalCA)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Nombre de ventes</span><span className="font-bold text-foreground">{sales.length}</span></div>
          <div className="flex justify-between border-t border-border pt-2 text-sm"><span className="font-semibold text-foreground">Solde théorique</span><span className="font-bold tabular-nums text-primary">{fcfa(cashRevenue)}</span></div>
        </div>
        <Field label="Montant compté en caisse (F)">
          <input inputMode="numeric" value={counted} onChange={(e) => setCounted(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="Ex. 184 500" />
        </Field>
        {counted !== "" && (
          <div className={cn("flex justify-between rounded-xl px-4 py-3 text-sm font-bold", ecart === 0 ? "bg-success/10 text-success" : ecart > 0 ? "bg-secondary/10 text-secondary" : "bg-destructive/10 text-destructive")}>
            <span>Écart de caisse</span>
            <span className="tabular-nums">{ecart >= 0 ? "+" : ""}{fcfa(ecart)}</span>
          </div>
        )}
        <button onClick={submit} disabled={loading} className="w-full rounded-2xl bg-destructive py-3.5 text-base font-bold text-white shadow-elevated active:scale-[0.99] disabled:opacity-60">
          {loading ? "Clôture…" : "Clôturer la journée"}
        </button>
      </div>
    </BottomSheet>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] text-primary-foreground/70">{label}</p><p className="font-display text-base font-bold tabular-nums">{value}</p></div>;
}

function StatCard({ icon: Icon, label, value, hint, tone }: { icon: typeof Wallet; label: string; value: string; hint: string; tone: "primary" | "amber" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tone === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/15 text-secondary"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

export function SectionTitle({ title, noMargin }: { title: string; noMargin?: boolean }) {
  return <h2 className={`text-base font-bold text-foreground ${noMargin ? "" : "mb-3"}`}>{title}</h2>;
}

export function MethodBadge({ method }: { method: string }) {
  const map: Record<string, string> = {
    Espèces: "bg-primary/10 text-primary",
    "Mobile Money": "bg-secondary/15 text-secondary",
    Crédit: "bg-accent/10 text-accent",
  };
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${map[method] ?? "bg-muted text-muted-foreground"}`}>{method}</span>;
}

// Keep for compatibility with other routes that import METHOD_LABEL
export { METHOD_LABEL };
